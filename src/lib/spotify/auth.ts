import { spotifyConfig } from './config'
import { spotifyOperations } from '@/lib/db/operations'

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
}

export class SpotifyAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'SpotifyAuthError'
  }
}

export class SpotifyAuth {
  /**
   * Generate Spotify authorization URL
   */
  static getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: spotifyConfig.clientId,
      scope: spotifyConfig.scopes.join(' '),
      redirect_uri: spotifyConfig.redirectUri,
      state,
      show_dialog: 'true' // Force user to approve each time
    })

    return `${spotifyConfig.endpoints.authorize}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
    const response = await fetch(spotifyConfig.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: spotifyConfig.redirectUri
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new SpotifyAuthError(`Failed to exchange code for tokens: ${error}`)
    }

    return await response.json()
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
    const response = await fetch(spotifyConfig.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new SpotifyAuthError(`Failed to refresh token: ${error}`)
    }

    return await response.json()
  }

  /**
   * Get valid access token for user (refresh if needed)
   */
  static async getValidAccessToken(userId: string): Promise<string> {
    const connection = await spotifyOperations.findByUserId(userId)
    
    if (!connection) {
      throw new SpotifyAuthError('No Spotify connection found for user')
    }

    if (!connection.isActive) {
      throw new SpotifyAuthError('Spotify connection is inactive')
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = new Date(connection.tokenExpiresAt)
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    if (expiresAt > fiveMinutesFromNow) {
      // Token is still valid
      return connection.accessToken
    }

    // Token is expired or about to expire, refresh it
    try {
      const tokenResponse = await this.refreshAccessToken(connection.refreshToken)
      
      // Update tokens in database
      const newExpiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000)
      
      await spotifyOperations.updateTokens(
        userId,
        tokenResponse.access_token,
        tokenResponse.refresh_token || connection.refreshToken,
        newExpiresAt
      )

      return tokenResponse.access_token
    } catch (error) {
      // If refresh fails, deactivate the connection
      await spotifyOperations.deactivate(userId)
      throw new SpotifyAuthError('Failed to refresh Spotify token, connection deactivated')
    }
  }

  /**
   * Revoke Spotify access for user
   */
  static async revokeAccess(userId: string): Promise<void> {
    try {
      await spotifyOperations.deactivate(userId)
    } catch (error) {
      console.error('Error revoking Spotify access:', error)
      throw new SpotifyAuthError('Failed to revoke Spotify access')
    }
  }
}
