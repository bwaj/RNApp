import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock dotenv and environment variables
process.env.SPOTIFY_CLIENT_ID = 'test_client_id'
process.env.SPOTIFY_CLIENT_SECRET = 'test_client_secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock the config
jest.mock('../config', () => ({
  spotifyConfig: {
    clientId: 'test_client_id',
    clientSecret: 'test_client_secret',
    redirectUri: 'http://localhost:3000/api/spotify/callback',
    endpoints: {
      authorize: 'https://accounts.spotify.com/authorize',
      token: 'https://accounts.spotify.com/api/token',
    },
    scopes: ['user-read-email', 'user-read-private']
  }
}))

// Mock database operations
jest.mock('@/lib/db/operations', () => ({
  spotifyOperations: {
    findByUserId: jest.fn(),
    updateTokens: jest.fn(),
    deactivate: jest.fn(),
  }
}))

// Mock fetch
global.fetch = jest.fn()

import { SpotifyAuth, SpotifyAuthError } from '../auth'
import { spotifyOperations } from '@/lib/db/operations'

const mockSpotifyOperations = spotifyOperations as jest.Mocked<typeof spotifyOperations>
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('SpotifyAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL', () => {
      const state = 'test_state'
      const url = SpotifyAuth.getAuthorizationUrl(state)
      
      expect(url).toContain('https://accounts.spotify.com/authorize')
      expect(url).toContain('client_id=test_client_id')
      expect(url).toContain('state=test_state')
      expect(url).toContain('scope=user-read-email%20user-read-private')
      expect(url).toContain('response_type=code')
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockResponse = {
        access_token: 'test_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test_refresh_token',
        scope: 'user-read-email'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await SpotifyAuth.exchangeCodeForTokens('test_code')
      
      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      )
    })

    it('should throw error when exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid authorization code'
      } as Response)

      await expect(SpotifyAuth.exchangeCodeForTokens('invalid_code'))
        .rejects.toThrow(SpotifyAuthError)
    })
  })

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        access_token: 'new_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'user-read-email'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await SpotifyAuth.refreshAccessToken('test_refresh_token')
      
      expect(result).toEqual(mockResponse)
    })

    it('should throw error when refresh fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid refresh token'
      } as Response)

      await expect(SpotifyAuth.refreshAccessToken('invalid_token'))
        .rejects.toThrow(SpotifyAuthError)
    })
  })

  describe('getValidAccessToken', () => {
    it('should return existing token if still valid', async () => {
      const futureDate = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      
      mockSpotifyOperations.findByUserId.mockResolvedValueOnce({
        id: 'connection_id',
        userId: 'user_id',
        spotifyUserId: 'spotify_user',
        accessToken: 'valid_token',
        refreshToken: 'refresh_token',
        tokenExpiresAt: futureDate,
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const token = await SpotifyAuth.getValidAccessToken('user_id')
      
      expect(token).toBe('valid_token')
      expect(mockSpotifyOperations.updateTokens).not.toHaveBeenCalled()
    })

    it('should refresh token if expired', async () => {
      const pastDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      
      mockSpotifyOperations.findByUserId.mockResolvedValueOnce({
        id: 'connection_id',
        userId: 'user_id',
        spotifyUserId: 'spotify_user',
        accessToken: 'expired_token',
        refreshToken: 'refresh_token',
        tokenExpiresAt: pastDate,
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const mockRefreshResponse = {
        access_token: 'new_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new_refresh_token',
        scope: 'user-read-email'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse
      } as Response)

      mockSpotifyOperations.updateTokens.mockResolvedValueOnce({
        id: 'connection_id',
        userId: 'user_id',
        spotifyUserId: 'spotify_user',
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        tokenExpiresAt: new Date(),
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const token = await SpotifyAuth.getValidAccessToken('user_id')
      
      expect(token).toBe('new_access_token')
      expect(mockSpotifyOperations.updateTokens).toHaveBeenCalled()
    })

    it('should throw error if no connection found', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValueOnce(null)

      await expect(SpotifyAuth.getValidAccessToken('user_id'))
        .rejects.toThrow('No Spotify connection found for user')
    })

    it('should throw error if connection is inactive', async () => {
      mockSpotifyOperations.findByUserId.mockResolvedValueOnce({
        id: 'connection_id',
        userId: 'user_id',
        spotifyUserId: 'spotify_user',
        accessToken: 'token',
        refreshToken: 'refresh_token',
        tokenExpiresAt: new Date(),
        isActive: false,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await expect(SpotifyAuth.getValidAccessToken('user_id'))
        .rejects.toThrow('Spotify connection is inactive')
    })
  })

  describe('revokeAccess', () => {
    it('should deactivate connection successfully', async () => {
      mockSpotifyOperations.deactivate.mockResolvedValueOnce()

      await expect(SpotifyAuth.revokeAccess('user_id')).resolves.not.toThrow()
      expect(mockSpotifyOperations.deactivate).toHaveBeenCalledWith('user_id')
    })

    it('should throw error if deactivation fails', async () => {
      mockSpotifyOperations.deactivate.mockRejectedValueOnce(new Error('Database error'))

      await expect(SpotifyAuth.revokeAccess('user_id'))
        .rejects.toThrow('Failed to revoke Spotify access')
    })
  })
})

// Unit tests for interfaces and types
describe('SpotifyAuth (Unit Tests)', () => {
  it('should have correct static method signatures', () => {
    expect(typeof SpotifyAuth.getAuthorizationUrl).toBe('function')
    expect(typeof SpotifyAuth.exchangeCodeForTokens).toBe('function')
    expect(typeof SpotifyAuth.refreshAccessToken).toBe('function')
    expect(typeof SpotifyAuth.getValidAccessToken).toBe('function')
    expect(typeof SpotifyAuth.revokeAccess).toBe('function')
  })

  it('should create SpotifyAuthError with correct properties', () => {
    const error = new SpotifyAuthError('Test error', 'TEST_CODE')
    expect(error.name).toBe('SpotifyAuthError')
    expect(error.message).toBe('Test error')
    expect(error.code).toBe('TEST_CODE')
  })
})
