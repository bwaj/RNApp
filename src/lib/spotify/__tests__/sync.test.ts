import { SpotifyDataSync } from '../sync'
import { SpotifyAPI } from '../api'
import { spotifyOperations, artistOperations, trackOperations, listeningOperations } from '@/lib/db/operations'

// Mock dependencies
jest.mock('../api')
jest.mock('@/lib/db/operations')

const mockSpotifyAPI = SpotifyAPI as jest.Mocked<typeof SpotifyAPI>
const mockSpotifyOperations = spotifyOperations as jest.Mocked<typeof spotifyOperations>
const mockArtistOperations = artistOperations as jest.Mocked<typeof artistOperations>
const mockTrackOperations = trackOperations as jest.Mocked<typeof trackOperations>
const mockListeningOperations = listeningOperations as jest.Mocked<typeof listeningOperations>

describe('SpotifyDataSync', () => {
  const userId = 'user123'
  const mockConnection = {
    id: 'conn123',
    userId: 'user123',
    spotifyUserId: 'spotify123',
    accessToken: 'token123',
    refreshToken: 'refresh123',
    tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    isActive: true,
    lastSyncAt: new Date('2025-01-21T10:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('syncUserData', () => {
    it('should sync user data successfully', async () => {
      // Mock connection exists
      mockSpotifyOperations.findByUserId.mockResolvedValue(mockConnection)

      // Mock recently played tracks
      mockSpotifyAPI.getRecentlyPlayed.mockResolvedValue({
        items: [
          {
            track: {
              id: 'track1',
              name: 'Test Track',
              artists: [{ id: 'artist1', name: 'Test Artist', external_urls: {} }],
              album: {
                id: 'album1',
                name: 'Test Album',
                release_date: '2025-01-01',
                total_tracks: 10,
                images: [{ url: 'image.jpg', width: 300, height: 300 }]
              },
              duration_ms: 180000,
              popularity: 75,
              explicit: false,
              preview_url: null,
              track_number: 1,
              external_urls: {}
            },
            played_at: '2025-01-21T12:00:00Z',
            context: {
              type: 'playlist',
              href: 'https://api.spotify.com/v1/playlists/123',
              external_urls: { spotify: 'https://open.spotify.com/playlist/123' }
            }
          }
        ],
        next: null,
        cursors: { after: 'cursor123', before: null },
        limit: 50,
        href: 'https://api.spotify.com/v1/me/player/recently-played'
      })

      // Mock top artists and tracks (empty for simplicity)
      mockSpotifyAPI.getTopArtists.mockResolvedValue({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
        href: 'test',
        next: null,
        previous: null
      })

      mockSpotifyAPI.getTopTracks.mockResolvedValue({
        items: [],
        total: 0,
        limit: 50,
        offset: 0,
        href: 'test',
        next: null,
        previous: null
      })

      // Mock database operations
      mockArtistOperations.upsert.mockResolvedValue({
        id: 'artist1',
        spotifyId: 'artist1',
        name: 'Test Artist',
        genres: [],
        popularity: null,
        imageUrl: null,
        externalUrls: {},
        followers: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockTrackOperations.upsert.mockResolvedValue({
        id: 'track1',
        spotifyId: 'track1',
        name: 'Test Track',
        albumId: null,
        durationMs: 180000,
        popularity: 75,
        explicit: false,
        previewUrl: null,
        trackNumber: 1,
        externalUrls: {},
        audioFeatures: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      mockListeningOperations.addListeningEvent.mockResolvedValue({
        id: 'listen1',
        userId: 'user123',
        trackId: 'track1',
        playedAt: new Date('2025-01-21T12:00:00Z'),
        context: {
          type: 'playlist',
          href: 'https://api.spotify.com/v1/playlists/123',
          external_urls: { spotify: 'https://open.spotify.com/playlist/123' }
        },
        createdAt: new Date()
      })

      mockSpotifyOperations.markLastSync.mockResolvedValue(undefined)

      const result = await SpotifyDataSync.syncUserData(userId)

      expect(result).toEqual({
        recentTracks: 1,
        newArtists: 0, // No top artists in this test
        newAlbums: 0,
        newTracks: 1, // 1 from recent + 0 from top tracks
        listeningEvents: 1,
        errors: []
      })

      expect(mockSpotifyOperations.findByUserId).toHaveBeenCalledWith(userId)
      expect(mockSpotifyOperations.markLastSync).toHaveBeenCalledWith(userId)
      expect(mockListeningOperations.addListeningEvent).toHaveBeenCalledWith({
        userId,
        trackId: 'track1',
        playedAt: new Date('2025-01-21T12:00:00Z'),
        context: {
          type: 'playlist',
          href: 'https://api.spotify.com/v1/playlists/123',
          external_urls: { spotify: 'https://open.spotify.com/playlist/123' }
        }
      })
    })

    it('should handle no active Spotify connection', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValue(null)

      const result = await SpotifyDataSync.syncUserData(userId)

      expect(result.errors).toContain('No active Spotify connection found')
      expect(result.recentTracks).toBe(0)
      expect(result.newArtists).toBe(0)
      expect(result.newTracks).toBe(0)
      expect(result.listeningEvents).toBe(0)
    })

    it('should handle inactive Spotify connection', async () => {
      const inactiveConnection = { ...mockConnection, isActive: false }
      mockSpotifyOperations.findByUserId.mockResolvedValue(inactiveConnection)

      const result = await SpotifyDataSync.syncUserData(userId)

      expect(result.errors).toContain('No active Spotify connection found')
    })

    it('should handle API errors gracefully', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValue(mockConnection)
      mockSpotifyAPI.getRecentlyPlayed.mockRejectedValue(new Error('API rate limit'))

      const result = await SpotifyDataSync.syncUserData(userId)

      expect(result.errors).toContain('Failed to sync recently played tracks')
      expect(result.recentTracks).toBe(0)
    })
  })

  describe('getSyncStatus', () => {
    it('should return sync status for connected user', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValue(mockConnection)

      const status = await SpotifyDataSync.getSyncStatus(userId)

      expect(status.isConnected).toBe(true)
      expect(status.isActive).toBe(true)
      expect(status.lastSyncAt).toEqual(mockConnection.lastSyncAt)
      expect(status.nextSyncAt).toBeInstanceOf(Date)
      expect(status.totalSyncs).toBe(0)
    })

    it('should return disconnected status for user without connection', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValue(null)

      const status = await SpotifyDataSync.getSyncStatus(userId)

      expect(status).toEqual({
        isConnected: false,
        lastSyncAt: null,
        nextSyncAt: null,
        isActive: false,
        totalSyncs: 0
      })
    })

    it('should calculate next sync time correctly', async () => {
      const connectionWithSync = {
        ...mockConnection,
        lastSyncAt: new Date('2025-01-21T10:00:00Z')
      }
      mockSpotifyOperations.findByUserId.mockResolvedValue(connectionWithSync)

      const status = await SpotifyDataSync.getSyncStatus(userId)

      const expectedNextSync = new Date('2025-01-21T16:00:00Z') // 6 hours later
      expect(status.nextSyncAt?.getTime()).toBe(expectedNextSync.getTime())
    })
  })
})
