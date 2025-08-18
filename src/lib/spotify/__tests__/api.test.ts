import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock environment variables  
process.env.SPOTIFY_CLIENT_ID = 'test_client_id'
process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock the auth module
jest.mock('../auth', () => ({
  SpotifyAuth: {
    getValidAccessToken: jest.fn()
  }
}))

// Mock the config
jest.mock('../config', () => ({
  spotifyConfig: {
    endpoints: {
      me: 'https://api.spotify.com/v1/me',
      recentlyPlayed: 'https://api.spotify.com/v1/me/player/recently-played',
      topArtists: 'https://api.spotify.com/v1/me/top/artists',
      topTracks: 'https://api.spotify.com/v1/me/top/tracks',
      track: (id: string) => `https://api.spotify.com/v1/tracks/${id}`,
      artist: (id: string) => `https://api.spotify.com/v1/artists/${id}`,
      audioFeatures: (id: string) => `https://api.spotify.com/v1/audio-features/${id}`,
    }
  }
}))

// Mock fetch
global.fetch = jest.fn()

import { SpotifyAPI, SpotifyAPIError } from '../api'
import { SpotifyAuth } from '../auth'

const mockSpotifyAuth = SpotifyAuth as jest.Mocked<typeof SpotifyAuth>
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('SpotifyAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSpotifyAuth.getValidAccessToken.mockResolvedValue('valid_token')
  })

  describe('getCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = {
        id: 'spotify_user_id',
        display_name: 'Test User',
        email: 'test@example.com',
        images: [{ url: 'https://example.com/image.jpg', height: 300, width: 300 }],
        followers: { total: 100 },
        country: 'US'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      } as Response)

      const result = await SpotifyAPI.getCurrentUser('user_id')
      
      expect(result).toEqual(mockUser)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid_token'
          })
        })
      )
    })

    it('should throw error for failed request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid token' } })
      } as Response)

      await expect(SpotifyAPI.getCurrentUser('user_id'))
        .rejects.toThrow(SpotifyAPIError)
    })
  })

  describe('getRecentlyPlayed', () => {
    it('should fetch recently played tracks', async () => {
      const mockResponse = {
        items: [
          {
            track: {
              id: 'track_id',
              name: 'Test Track',
              artists: [{ id: 'artist_id', name: 'Test Artist' }],
              album: {
                id: 'album_id',
                name: 'Test Album',
                images: [],
                release_date: '2024-01-01',
                total_tracks: 10
              },
              duration_ms: 180000,
              popularity: 70,
              explicit: false,
              preview_url: null,
              track_number: 1,
              external_urls: { spotify: 'https://open.spotify.com/track/track_id' }
            },
            played_at: '2024-01-01T12:00:00.000Z',
            context: null
          }
        ],
        next: null,
        cursors: { after: 'after_cursor', before: 'before_cursor' },
        limit: 50,
        href: 'https://api.spotify.com/v1/me/player/recently-played'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await SpotifyAPI.getRecentlyPlayed('user_id', 20)
      
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=20'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid_token'
          })
        })
      )
    })
  })

  describe('getTopArtists', () => {
    it('should fetch top artists with correct parameters', async () => {
      const mockResponse = {
        items: [
          {
            id: 'artist_id',
            name: 'Test Artist',
            genres: ['rock', 'indie'],
            popularity: 80,
            images: [],
            followers: { total: 1000000 },
            external_urls: { spotify: 'https://open.spotify.com/artist/artist_id' }
          }
        ],
        total: 1,
        limit: 20,
        offset: 0,
        href: 'https://api.spotify.com/v1/me/top/artists',
        next: null,
        previous: null
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await SpotifyAPI.getTopArtists('user_id', 'short_term', 20, 0)
      
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('time_range=short_term'),
        expect.any(Object)
      )
    })
  })

  describe('Rate Limiting', () => {
    it('should handle rate limiting error', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '30']]),
        json: async () => ({ error: { message: 'Rate limited' } })
      }

      // Create a proper Headers object
      const headers = new Headers()
      headers.set('Retry-After', '30')
      
      mockFetch.mockResolvedValueOnce({
        ...mockResponse,
        headers
      } as Response)

      await expect(SpotifyAPI.getCurrentUser('user_id'))
        .rejects.toThrow(expect.objectContaining({
          status: 429,
          code: 'RATE_LIMITED'
        }))
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: {
            message: 'Insufficient client scope',
            reason: 'SCOPE_ERROR'
          }
        })
      } as Response)

      await expect(SpotifyAPI.getCurrentUser('user_id'))
        .rejects.toThrow(expect.objectContaining({
          status: 403,
          code: 'SCOPE_ERROR'
        }))
    })
  })

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockUser = {
        id: 'user_id',
        display_name: 'Test User',
        email: 'test@example.com',
        images: [],
        followers: { total: 0 },
        country: 'US'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      } as Response)

      const result = await SpotifyAPI.testConnection('user_id')
      expect(result).toBe(true)
    })

    it('should return false for failed connection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid token' } })
      } as Response)

      const result = await SpotifyAPI.testConnection('user_id')
      expect(result).toBe(false)
    })

    it('should return false for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await SpotifyAPI.testConnection('user_id')
      expect(result).toBe(false)
    })
  })
})

// Unit tests for interfaces and error classes
describe('SpotifyAPI (Unit Tests)', () => {
  it('should have correct static method signatures', () => {
    expect(typeof SpotifyAPI.getCurrentUser).toBe('function')
    expect(typeof SpotifyAPI.getRecentlyPlayed).toBe('function')
    expect(typeof SpotifyAPI.getTopArtists).toBe('function')
    expect(typeof SpotifyAPI.getTopTracks).toBe('function')
    expect(typeof SpotifyAPI.getTrack).toBe('function')
    expect(typeof SpotifyAPI.getArtist).toBe('function')
    expect(typeof SpotifyAPI.getAudioFeatures).toBe('function')
    expect(typeof SpotifyAPI.testConnection).toBe('function')
  })

  it('should create SpotifyAPIError with correct properties', () => {
    const error = new SpotifyAPIError('Test error', 404, 'NOT_FOUND')
    expect(error.name).toBe('SpotifyAPIError')
    expect(error.message).toBe('Test error')
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })
})
