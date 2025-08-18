import { SpotifyAPI, SpotifyTrack, SpotifyArtist } from './api'
import { 
  artistOperations, 
  trackOperations, 
  listeningOperations,
  spotifyOperations 
} from '@/lib/db/operations'
import type { NewArtist, NewAlbum, NewTrack, NewListeningHistory } from '@/lib/db/schema'

export interface SyncResult {
  recentTracks: number
  newArtists: number
  newAlbums: number
  newTracks: number
  listeningEvents: number
  errors: string[]
}

export interface SyncStatus {
  isConnected: boolean
  lastSyncAt: Date | null
  nextSyncAt: Date | null
  isActive: boolean
  totalSyncs: number
}

export class SpotifyDataSync {
  /**
   * Sync all user data from Spotify
   */
  static async syncUserData(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      recentTracks: 0,
      newArtists: 0,
      newAlbums: 0,
      newTracks: 0,
      listeningEvents: 0,
      errors: []
    }

    try {
      // Check if user has Spotify connection
      const connection = await spotifyOperations.findByUserId(userId)
      if (!connection || !connection.isActive) {
        throw new Error('No active Spotify connection found')
      }

      // Sync recently played tracks
      await this.syncRecentlyPlayed(userId, result)
      
      // Sync top artists and tracks
      await this.syncTopItems(userId, result)
      
      // Mark sync completion
      await spotifyOperations.markLastSync(userId)
      
    } catch (error) {
      console.error('Sync error:', error)
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error')
    }

    return result
  }

  /**
   * Sync recently played tracks
   */
  private static async syncRecentlyPlayed(userId: string, result: SyncResult): Promise<void> {
    try {
      const recentlyPlayed = await SpotifyAPI.getRecentlyPlayed(userId, 50)
      
      for (const item of recentlyPlayed.items) {
        try {
          // Process track and artists
          const track = await this.processTrack(item.track)
          result.newTracks++
          
          // Create listening event
          const listeningEvent: NewListeningHistory = {
            userId,
            trackId: track.id,
            playedAt: new Date(item.played_at),
            context: item.context ? {
              type: item.context.type,
              href: item.context.href,
              external_urls: item.context.external_urls
            } : null
          }
          
          await listeningOperations.addListeningEvent(listeningEvent)
          result.listeningEvents++
          
        } catch (error) {
          console.error('Error processing track:', error)
          result.errors.push(`Failed to process track: ${item.track.name}`)
        }
      }
      
      result.recentTracks = recentlyPlayed.items.length
    } catch (error) {
      console.error('Error syncing recently played:', error)
      result.errors.push('Failed to sync recently played tracks')
    }
  }

  /**
   * Sync top artists and tracks
   */
  private static async syncTopItems(userId: string, result: SyncResult): Promise<void> {
    const timeRanges: Array<'short_term' | 'medium_term' | 'long_term'> = [
      'short_term', 'medium_term', 'long_term'
    ]
    
    for (const timeRange of timeRanges) {
      try {
        // Sync top artists
        const topArtists = await SpotifyAPI.getTopArtists(userId, timeRange, 50)
        for (const artist of topArtists.items) {
          await this.processArtist(artist)
          result.newArtists++
        }
        
        // Sync top tracks
        const topTracks = await SpotifyAPI.getTopTracks(userId, timeRange, 50)
        for (const track of topTracks.items) {
          await this.processTrack(track)
          result.newTracks++
        }
        
      } catch (error) {
        console.error(`Error syncing top items for ${timeRange}:`, error)
        result.errors.push(`Failed to sync top items for ${timeRange}`)
      }
    }
  }

  /**
   * Process and store artist data
   */
  private static async processArtist(spotifyArtist: SpotifyArtist) {
    const artistData: NewArtist = {
      spotifyId: spotifyArtist.id,
      name: spotifyArtist.name,
      genres: spotifyArtist.genres,
      popularity: spotifyArtist.popularity,
      imageUrl: spotifyArtist.images[0]?.url || null,
      externalUrls: spotifyArtist.external_urls,
      followers: spotifyArtist.followers.total
    }

    return await artistOperations.upsert(artistData)
  }

  /**
   * Process and store track data
   */
  private static async processTrack(spotifyTrack: SpotifyTrack) {
    // First process the album
    const albumData: NewAlbum = {
      spotifyId: spotifyTrack.album.id,
      name: spotifyTrack.album.name,
      albumType: 'album', // Default type
      releaseDate: spotifyTrack.album.release_date,
      totalTracks: spotifyTrack.album.total_tracks,
      imageUrl: spotifyTrack.album.images[0]?.url || null,
      externalUrls: {}
    }

    // Note: We'll need to implement album operations similar to artists
    // For now, we'll handle this in the track operations
    
    // Process track artists
    for (const artist of spotifyTrack.artists) {
      const artistData: NewArtist = {
        spotifyId: artist.id,
        name: artist.name,
        genres: [],
        popularity: null,
        imageUrl: null,
        externalUrls: {},
        followers: null
      }
      
      await artistOperations.upsert(artistData)
    }

    // Process the track
    const trackData: NewTrack = {
      spotifyId: spotifyTrack.id,
      name: spotifyTrack.name,
      albumId: null, // We'll need to get this from the album operations
      durationMs: spotifyTrack.duration_ms,
      popularity: spotifyTrack.popularity,
      explicit: spotifyTrack.explicit,
      previewUrl: spotifyTrack.preview_url,
      trackNumber: spotifyTrack.track_number,
      externalUrls: spotifyTrack.external_urls,
      audioFeatures: null // We'll fetch this separately if needed
    }

    return await trackOperations.upsert(trackData)
  }

  /**
   * Get sync status for user
   */
  static async getSyncStatus(userId: string): Promise<SyncStatus> {
    const connection = await spotifyOperations.findByUserId(userId)
    
    if (!connection) {
      return {
        isConnected: false,
        lastSyncAt: null,
        nextSyncAt: null,
        isActive: false,
        totalSyncs: 0
      }
    }

    // Calculate next sync time (every 6 hours)
    const nextSyncAt = connection.lastSyncAt 
      ? new Date(connection.lastSyncAt.getTime() + 6 * 60 * 60 * 1000)
      : new Date()

    return {
      isConnected: true,
      lastSyncAt: connection.lastSyncAt,
      nextSyncAt,
      isActive: connection.isActive,
      totalSyncs: 0 // We could track this in the database if needed
    }
  }

  /**
   * Schedule background sync for user
   */
  static async scheduleSync(userId: string): Promise<void> {
    // This would integrate with a job queue system like Bull/BullMQ
    // For now, we'll just do immediate sync
    console.log(`Scheduling sync for user ${userId}`)
    
    // In production, this would add a job to a queue
    // await syncQueue.add('sync-user-data', { userId }, {
    //   delay: 0,
    //   repeat: { cron: '0 */6 * * *' } // Every 6 hours
    // })
  }
}
