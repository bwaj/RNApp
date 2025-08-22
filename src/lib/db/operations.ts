import { db } from './config'
import { 
  users, 
  userProfiles,
  spotifyConnections, 
  artists, 
  albums, 
  tracks, 
  trackArtists,
  albumArtists,
  listeningHistory,
  userStats,
  type NewUser,
  type NewUserProfile,
  type NewSpotifyConnection,
  type NewArtist,
  type NewAlbum,
  type NewTrack,
  type NewListeningHistory,
  type NewUserStats
} from './schema'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'

// User operations
export const userOperations = {
  async create(userData: NewUser) {
    const [user] = await db.insert(users).values(userData).returning()
    return user
  },

  async findByGoogleId(googleId: string) {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        image: users.image,
        googleId: userProfiles.googleId,
      })
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(userProfiles.googleId, googleId))
    
    return result[0] || null
  },

  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email))
    return user || null
  },

  async findById(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    return user || null
  },

  async update(id: string, userData: Partial<NewUser>) {
    const [user] = await db.update(users).set({
      ...userData,
      updatedAt: new Date()
    }).where(eq(users.id, id)).returning()
    return user
  },

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id))
  },

  async createProfile(profileData: NewUserProfile) {
    const [profile] = await db.insert(userProfiles).values(profileData).returning()
    return profile
  }
}

// Spotify connection operations
export const spotifyOperations = {
  async create(connectionData: NewSpotifyConnection) {
    const [connection] = await db.insert(spotifyConnections).values(connectionData).returning()
    return connection
  },

  async findByUserId(userId: string) {
    const [connection] = await db.select().from(spotifyConnections)
      .where(and(eq(spotifyConnections.userId, userId), eq(spotifyConnections.isActive, true)))
    return connection || null
  },

  async updateTokens(userId: string, accessToken: string, refreshToken: string, expiresAt: Date) {
    const [connection] = await db.update(spotifyConnections).set({
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt,
      updatedAt: new Date()
    }).where(eq(spotifyConnections.userId, userId)).returning()
    return connection
  },

  async markLastSync(userId: string) {
    await db.update(spotifyConnections).set({
      lastSyncAt: new Date(),
      updatedAt: new Date()
    }).where(eq(spotifyConnections.userId, userId))
  },

  async deactivate(userId: string) {
    await db.update(spotifyConnections).set({
      isActive: false,
      updatedAt: new Date()
    }).where(eq(spotifyConnections.userId, userId))
  }
}

// Artist operations
export const artistOperations = {
  async upsert(artistData: NewArtist) {
    // Try to insert, if conflict on spotify_id, update instead
    const [artist] = await db.insert(artists).values(artistData)
      .onConflictDoUpdate({
        target: artists.spotifyId,
        set: {
          name: artistData.name,
          genres: artistData.genres,
          popularity: artistData.popularity,
          imageUrl: artistData.imageUrl,
          externalUrls: artistData.externalUrls,
          followers: artistData.followers,
          updatedAt: new Date()
        }
      }).returning()
    return artist
  },

  async findBySpotifyId(spotifyId: string) {
    const [artist] = await db.select().from(artists).where(eq(artists.spotifyId, spotifyId))
    return artist || null
  },

  async findById(id: string) {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id))
    return artist || null
  }
}

// Track operations
export const trackOperations = {
  async upsert(trackData: NewTrack) {
    const [track] = await db.insert(tracks).values(trackData)
      .onConflictDoUpdate({
        target: tracks.spotifyId,
        set: {
          name: trackData.name,
          albumId: trackData.albumId,
          durationMs: trackData.durationMs,
          popularity: trackData.popularity,
          explicit: trackData.explicit,
          previewUrl: trackData.previewUrl,
          trackNumber: trackData.trackNumber,
          externalUrls: trackData.externalUrls,
          audioFeatures: trackData.audioFeatures,
          updatedAt: new Date()
        }
      }).returning()
    return track
  },

  async findBySpotifyId(spotifyId: string) {
    const [track] = await db.select().from(tracks).where(eq(tracks.spotifyId, spotifyId))
    return track || null
  },

  async findById(id: string) {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id))
    return track || null
  }
}

// Listening history operations
export const listeningOperations = {
  async addListeningEvent(eventData: NewListeningHistory) {
    const [event] = await db.insert(listeningHistory).values(eventData).returning()
    return event
  },

  async getUserRecentPlays(userId: string, limit = 50) {
    return await db.select({
      id: listeningHistory.id,
      playedAt: listeningHistory.playedAt,
      track: {
        id: tracks.id,
        name: tracks.name,
        spotifyId: tracks.spotifyId,
        durationMs: tracks.durationMs
      }
    })
    .from(listeningHistory)
    .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
    .where(eq(listeningHistory.userId, userId))
    .orderBy(desc(listeningHistory.playedAt))
    .limit(limit)
  },

  async getUserListeningStats(userId: string, startDate: Date, endDate: Date) {
    const totalPlays = await db.select({ count: sql<number>`count(*)` })
      .from(listeningHistory)
      .where(
        and(
          eq(listeningHistory.userId, userId),
          gte(listeningHistory.playedAt, startDate),
          lte(listeningHistory.playedAt, endDate)
        )
      )

    const totalListeningTime = await db.select({ 
      total: sql<number>`sum(${tracks.durationMs}) / 1000` // Convert to seconds
    })
    .from(listeningHistory)
    .leftJoin(tracks, eq(listeningHistory.trackId, tracks.id))
    .where(
      and(
        eq(listeningHistory.userId, userId),
        gte(listeningHistory.playedAt, startDate),
        lte(listeningHistory.playedAt, endDate)
      )
    )

    return {
      totalPlays: totalPlays[0]?.count || 0,
      totalListeningTimeSeconds: totalListeningTime[0]?.total || 0
    }
  }
}

// Database health and utility operations
export const dbOperations = {
  async healthCheck() {
    try {
      await db.execute(sql`SELECT 1`)
      return { healthy: true, timestamp: new Date() }
    } catch (error) {
      return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() }
    }
  },

  async clearAllTables() {
    console.warn('🚨 Clearing all database tables...')
    
    // Delete in reverse dependency order
    await db.delete(listeningHistory)
    await db.delete(userStats)
    await db.delete(trackArtists)
    await db.delete(albumArtists)
    await db.delete(tracks)
    await db.delete(albums)
    await db.delete(artists)
    await db.delete(spotifyConnections)
    await db.delete(users)
    
    console.log('✅ All tables cleared')
  }
}
