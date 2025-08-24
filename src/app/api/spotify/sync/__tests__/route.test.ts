/**
 * @jest-environment node
 */
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { SpotifyDataSync } from '@/lib/spotify/sync'

// Mock the dependencies
jest.mock('@/lib/auth/session')
jest.mock('@/lib/spotify/sync')

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockSpotifyDataSync = SpotifyDataSync as jest.Mocked<typeof SpotifyDataSync>

describe('/api/spotify/sync', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    googleId: 'google123',
    accessToken: 'token123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/spotify/sync', () => {
    it('should return sync status for authenticated user', async () => {
      const mockSyncStatus = {
        isConnected: true,
        lastSyncAt: '2025-01-21T10:00:00.000Z', // JSON serialized date
        nextSyncAt: '2025-01-21T16:00:00.000Z', // JSON serialized date
        isActive: true,
        totalSyncs: 5
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockSpotifyDataSync.getSyncStatus.mockResolvedValue(mockSyncStatus)

      const request = new NextRequest('http://localhost:3000/api/spotify/sync')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockSyncStatus)
      expect(mockSpotifyDataSync.getSyncStatus).toHaveBeenCalledWith('user123')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/spotify/sync')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockSpotifyDataSync.getSyncStatus).not.toHaveBeenCalled()
    })

    it('should handle sync status errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockSpotifyDataSync.getSyncStatus.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/spotify/sync')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get sync status')
    })
  })

  describe('POST /api/spotify/sync', () => {
    it('should sync user data successfully', async () => {
      const mockSyncResult = {
        recentTracks: 20,
        newArtists: 5,
        newAlbums: 3,
        newTracks: 15,
        listeningEvents: 20,
        errors: []
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockSpotifyDataSync.syncUserData.mockResolvedValue(mockSyncResult)

      const request = new NextRequest('http://localhost:3000/api/spotify/sync', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Sync completed successfully')
      expect(data.synced).toEqual(mockSyncResult)
      expect(mockSpotifyDataSync.syncUserData).toHaveBeenCalledWith('user123')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/spotify/sync', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
      expect(mockSpotifyDataSync.syncUserData).not.toHaveBeenCalled()
    })

    it('should handle sync errors gracefully', async () => {
      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockSpotifyDataSync.syncUserData.mockRejectedValue(new Error('No Spotify connection'))

      const request = new NextRequest('http://localhost:3000/api/spotify/sync', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to sync Spotify data')
    })

    it('should return sync result with errors when partial failure occurs', async () => {
      const mockSyncResultWithErrors = {
        recentTracks: 10,
        newArtists: 2,
        newAlbums: 1,
        newTracks: 8,
        listeningEvents: 10,
        errors: ['Failed to sync some tracks', 'Rate limit exceeded']
      }

      mockGetCurrentUser.mockResolvedValue(mockUser)
      mockSpotifyDataSync.syncUserData.mockResolvedValue(mockSyncResultWithErrors)

      const request = new NextRequest('http://localhost:3000/api/spotify/sync', {
        method: 'POST'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Sync completed successfully')
      expect(data.synced.errors).toHaveLength(2)
      expect(data.synced.recentTracks).toBe(10)
    })
  })
})
