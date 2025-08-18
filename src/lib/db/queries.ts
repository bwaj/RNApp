import { db } from './config'
import { 
  listeningHistory, 
  tracks, 
  artists, 
  albums, 
  trackArtists,
  userStats 
} from './schema'
import { eq, desc, count, sum, avg, and, gte, lte, sql, asc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

export interface UserListeningStats {
  totalTracks: number
  totalListeningTime: number
  totalArtists: number
  totalAlbums: number
  averageTrackLength: number
  totalListeningEvents: number
}

export interface TopArtistData {
  artist: {
    id: string
    name: string
    imageUrl: string | null
    genres: string[]
    spotifyId: string
  }
  playCount: number
  totalListeningTime: number
}

export interface TopTrackData {
  track: {
    id: string
    name: string
    spotifyId: string
    durationMs: number
    popularity: number | null
    previewUrl: string | null
  }
  artist: {
    id: string
    name: string
    imageUrl: string | null
  }
  album: {
    id: string | null
    name: string | null
    imageUrl: string | null
  }
  playCount: number
  lastPlayed: Date
}

export interface RecentTrackData {
  id: string
  playedAt: Date
  track: {
    id: string
    name: string
    spotifyId: string
    durationMs: number
    previewUrl: string | null
  }
  artist: {
    id: string
    name: string
    imageUrl: string | null
  }
  album: {
    id: string | null
    name: string | null
    imageUrl: string | null
  }
}

export interface ListeningTrendData {
  date: string
  totalTracks: number
  totalMinutes: number
  uniqueArtists: number
}

export interface GenreData {
  genre: string
  trackCount: number
  percentage: number
}

export class MusicDataQueries {
  /**
   * Get comprehensive listening statistics for a user
   */
  static async getUserListeningStats(userId: string): Promise<UserListeningStats> {
    const [stats] = await db
      .select({
        totalListeningEvents: count(listeningHistory.id),
        totalListeningTime: sum(tracks.durationMs),
        averageTrackLength: avg(tracks.durationMs),
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .where(eq(listeningHistory.userId, userId))

    const [artistCount] = await db
      .select({
        totalArtists: sql<number>`COUNT(DISTINCT ${trackArtists.artistId})`
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .where(eq(listeningHistory.userId, userId))

    const [trackCount] = await db
      .select({
        totalTracks: sql<number>`COUNT(DISTINCT ${listeningHistory.trackId})`
      })
      .from(listeningHistory)
      .where(eq(listeningHistory.userId, userId))

    const [albumCount] = await db
      .select({
        totalAlbums: sql<number>`COUNT(DISTINCT ${tracks.albumId})`
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .where(and(
        eq(listeningHistory.userId, userId),
        sql`${tracks.albumId} IS NOT NULL`
      ))

    return {
      totalTracks: trackCount?.totalTracks || 0,
      totalListeningTime: Number(stats?.totalListeningTime || 0),
      totalArtists: artistCount?.totalArtists || 0,
      totalAlbums: albumCount?.totalAlbums || 0,
      averageTrackLength: Number(stats?.averageTrackLength || 0),
      totalListeningEvents: Number(stats?.totalListeningEvents || 0),
    }
  }

  /**
   * Get top artists for a user within a time range
   */
  static async getTopArtists(
    userId: string,
    limit = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<TopArtistData[]> {
    let query = db
      .select({
        artist: {
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          genres: artists.genres,
          spotifyId: artists.spotifyId,
        },
        playCount: count(listeningHistory.id),
        totalListeningTime: sum(tracks.durationMs),
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(eq(listeningHistory.userId, userId))
      .groupBy(artists.id, artists.name, artists.imageUrl, artists.genres, artists.spotifyId)
      .orderBy(desc(count(listeningHistory.id)))
      .limit(limit)

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(listeningHistory.userId, userId),
          gte(listeningHistory.playedAt, startDate),
          lte(listeningHistory.playedAt, endDate)
        )
      ) as any
    }

    const results = await query

    return results.map(row => ({
      artist: row.artist,
      playCount: Number(row.playCount),
      totalListeningTime: Number(row.totalListeningTime || 0),
    }))
  }

  /**
   * Get top tracks for a user within a time range
   */
  static async getTopTracks(
    userId: string,
    limit = 10,
    startDate?: Date,
    endDate?: Date
  ): Promise<TopTrackData[]> {
    // Create aliases for the joins to avoid conflicts
    const primaryArtist = alias(artists, 'primaryArtist')
    
    let query = db
      .select({
        track: {
          id: tracks.id,
          name: tracks.name,
          spotifyId: tracks.spotifyId,
          durationMs: tracks.durationMs,
          popularity: tracks.popularity,
          previewUrl: tracks.previewUrl,
        },
        artist: {
          id: primaryArtist.id,
          name: primaryArtist.name,
          imageUrl: primaryArtist.imageUrl,
        },
        album: {
          id: albums.id,
          name: albums.name,
          imageUrl: albums.imageUrl,
        },
        playCount: count(listeningHistory.id),
        lastPlayed: sql<Date>`MAX(${listeningHistory.playedAt})`,
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(primaryArtist, eq(trackArtists.artistId, primaryArtist.id))
      .where(eq(listeningHistory.userId, userId))
      .groupBy(
        tracks.id, tracks.name, tracks.spotifyId, tracks.durationMs, 
        tracks.popularity, tracks.previewUrl,
        primaryArtist.id, primaryArtist.name, primaryArtist.imageUrl,
        albums.id, albums.name, albums.imageUrl
      )
      .orderBy(desc(count(listeningHistory.id)))
      .limit(limit)

    if (startDate && endDate) {
      query = query.where(
        and(
          eq(listeningHistory.userId, userId),
          gte(listeningHistory.playedAt, startDate),
          lte(listeningHistory.playedAt, endDate)
        )
      ) as any
    }

    const results = await query

    return results.map(row => ({
      track: row.track,
      artist: row.artist,
      album: row.album,
      playCount: Number(row.playCount),
      lastPlayed: row.lastPlayed,
    }))
  }

  /**
   * Get recent listening history for a user
   */
  static async getRecentTracks(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<RecentTrackData[]> {
    const primaryArtist = alias(artists, 'primaryArtist')
    
    const results = await db
      .select({
        id: listeningHistory.id,
        playedAt: listeningHistory.playedAt,
        track: {
          id: tracks.id,
          name: tracks.name,
          spotifyId: tracks.spotifyId,
          durationMs: tracks.durationMs,
          previewUrl: tracks.previewUrl,
        },
        artist: {
          id: primaryArtist.id,
          name: primaryArtist.name,
          imageUrl: primaryArtist.imageUrl,
        },
        album: {
          id: albums.id,
          name: albums.name,
          imageUrl: albums.imageUrl,
        },
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(primaryArtist, eq(trackArtists.artistId, primaryArtist.id))
      .where(eq(listeningHistory.userId, userId))
      .orderBy(desc(listeningHistory.playedAt))
      .limit(limit)
      .offset(offset)

    return results
  }

  /**
   * Get listening trends over time
   */
  static async getListeningTrends(
    userId: string,
    days = 30
  ): Promise<ListeningTrendData[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const results = await db
      .select({
        date: sql<string>`DATE(${listeningHistory.playedAt})`,
        totalTracks: count(listeningHistory.id),
        totalMinutes: sql<number>`ROUND(SUM(${tracks.durationMs}) / 60000.0)`,
        uniqueArtists: sql<number>`COUNT(DISTINCT ${trackArtists.artistId})`,
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .where(
        and(
          eq(listeningHistory.userId, userId),
          gte(listeningHistory.playedAt, startDate)
        )
      )
      .groupBy(sql`DATE(${listeningHistory.playedAt})`)
      .orderBy(asc(sql`DATE(${listeningHistory.playedAt})`))

    return results.map(row => ({
      date: row.date,
      totalTracks: Number(row.totalTracks),
      totalMinutes: Number(row.totalMinutes),
      uniqueArtists: Number(row.uniqueArtists),
    }))
  }

  /**
   * Get genre distribution for a user
   */
  static async getGenreDistribution(userId: string): Promise<GenreData[]> {
    const results = await db
      .select({
        genre: sql<string>`unnest(${artists.genres})`,
        trackCount: count(listeningHistory.id),
      })
      .from(listeningHistory)
      .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(
        and(
          eq(listeningHistory.userId, userId),
          sql`array_length(${artists.genres}, 1) > 0`
        )
      )
      .groupBy(sql`unnest(${artists.genres})`)
      .orderBy(desc(count(listeningHistory.id)))
      .limit(10)

    const totalTracks = results.reduce((sum, row) => sum + Number(row.trackCount), 0)

    return results.map(row => ({
      genre: row.genre,
      trackCount: Number(row.trackCount),
      percentage: totalTracks > 0 ? (Number(row.trackCount) / totalTracks) * 100 : 0,
    }))
  }

  /**
   * Search tracks, artists, or albums in user's library
   */
  static async searchUserLibrary(
    userId: string,
    query: string,
    type: 'tracks' | 'artists' | 'albums' = 'tracks',
    limit = 20
  ) {
    const searchTerm = `%${query.toLowerCase()}%`

    if (type === 'artists') {
      return await db
        .select({
          id: artists.id,
          name: artists.name,
          imageUrl: artists.imageUrl,
          genres: artists.genres,
          playCount: count(listeningHistory.id),
        })
        .from(artists)
        .leftJoin(trackArtists, eq(artists.id, trackArtists.artistId))
        .leftJoin(tracks, eq(trackArtists.trackId, tracks.id))
        .leftJoin(listeningHistory, eq(tracks.id, listeningHistory.trackId))
        .where(
          and(
            eq(listeningHistory.userId, userId),
            sql`LOWER(${artists.name}) LIKE ${searchTerm}`
          )
        )
        .groupBy(artists.id, artists.name, artists.imageUrl, artists.genres)
        .orderBy(desc(count(listeningHistory.id)))
        .limit(limit)
    }

    if (type === 'albums') {
      return await db
        .select({
          id: albums.id,
          name: albums.name,
          imageUrl: albums.imageUrl,
          releaseDate: albums.releaseDate,
          totalTracks: albums.totalTracks,
          playCount: count(listeningHistory.id),
        })
        .from(albums)
        .leftJoin(tracks, eq(albums.id, tracks.albumId))
        .leftJoin(listeningHistory, eq(tracks.id, listeningHistory.trackId))
        .where(
          and(
            eq(listeningHistory.userId, userId),
            sql`LOWER(${albums.name}) LIKE ${searchTerm}`
          )
        )
        .groupBy(albums.id, albums.name, albums.imageUrl, albums.releaseDate, albums.totalTracks)
        .orderBy(desc(count(listeningHistory.id)))
        .limit(limit)
    }

    // Default to tracks
    const primaryArtist = alias(artists, 'primaryArtist')
    
    return await db
      .select({
        id: tracks.id,
        name: tracks.name,
        durationMs: tracks.durationMs,
        popularity: tracks.popularity,
        artist: {
          id: primaryArtist.id,
          name: primaryArtist.name,
          imageUrl: primaryArtist.imageUrl,
        },
        album: {
          id: albums.id,
          name: albums.name,
          imageUrl: albums.imageUrl,
        },
        playCount: count(listeningHistory.id),
        lastPlayed: sql<Date>`MAX(${listeningHistory.playedAt})`,
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
      .leftJoin(primaryArtist, eq(trackArtists.artistId, primaryArtist.id))
      .leftJoin(listeningHistory, eq(tracks.id, listeningHistory.trackId))
      .where(
        and(
          eq(listeningHistory.userId, userId),
          sql`LOWER(${tracks.name}) LIKE ${searchTerm}`
        )
      )
      .groupBy(
        tracks.id, tracks.name, tracks.durationMs, tracks.popularity,
        primaryArtist.id, primaryArtist.name, primaryArtist.imageUrl,
        albums.id, albums.name, albums.imageUrl
      )
      .orderBy(desc(count(listeningHistory.id)))
      .limit(limit)
  }
}
