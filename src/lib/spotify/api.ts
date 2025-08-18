import { SpotifyAuth } from './auth'
import { spotifyConfig } from './config'

export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: Array<{ url: string; height: number; width: number }>
  followers: { total: number }
  country: string
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
    release_date: string
    total_tracks: number
  }
  duration_ms: number
  popularity: number
  explicit: boolean
  preview_url: string | null
  track_number: number
  external_urls: { spotify: string }
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
  images: Array<{ url: string; height: number; width: number }>
  followers: { total: number }
  external_urls: { spotify: string }
}

export interface SpotifyRecentlyPlayed {
  items: Array<{
    track: SpotifyTrack
    played_at: string
    context: {
      type: string
      href: string
      external_urls: { spotify: string }
    } | null
  }>
  next: string | null
  cursors: {
    after: string
    before: string
  }
  limit: number
  href: string
}

export interface SpotifyTopItems<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  href: string
  next: string | null
  previous: string | null
}

export interface SpotifyAudioFeatures {
  id: string
  acousticness: number
  danceability: number
  energy: number
  instrumentalness: number
  key: number
  liveness: number
  loudness: number
  mode: number
  speechiness: number
  tempo: number
  time_signature: number
  valence: number
}

export class SpotifyAPIError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message)
    this.name = 'SpotifyAPIError'
  }
}

export class SpotifyAPI {
  private static async makeRequest<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new SpotifyAPIError(
          `Rate limited. Retry after ${retryAfter} seconds`,
          429,
          'RATE_LIMITED'
        )
      }

      throw new SpotifyAPIError(
        error.error?.message || `API request failed: ${response.status}`,
        response.status,
        error.error?.reason
      )
    }

    return await response.json()
  }

  /**
   * Get current user's Spotify profile
   */
  static async getCurrentUser(userId: string): Promise<SpotifyUser> {
    const accessToken = await SpotifyAuth.getValidAccessToken(userId)
    return await this.makeRequest<SpotifyUser>(
      spotifyConfig.endpoints.me,
      accessToken
    )
  }

  /**
   * Get user's recently played tracks
   */
  static async getRecentlyPlayed(
    userId: string,
    limit = 50,
    after?: string
  ): Promise<SpotifyRecentlyPlayed> {
    const accessToken = await SpotifyAuth.getValidAccessToken(userId)
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after })
    })
    
    const url = `${spotifyConfig.endpoints.recentlyPlayed}?${params}`
    return await this.makeRequest<SpotifyRecentlyPlayed>(url, accessToken)
  }

  /**
   * Get user's top artists
   */
  static async getTopArtists(
    userId: string,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 50,
    offset = 0
  ): Promise<SpotifyTopItems<SpotifyArtist>> {
    const accessToken = await SpotifyAuth.getValidAccessToken(userId)
    
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: limit.toString(),
      offset: offset.toString()
    })
    
    const url = `${spotifyConfig.endpoints.topArtists}?${params}`
    return await this.makeRequest<SpotifyTopItems<SpotifyArtist>>(url, accessToken)
  }

  /**
   * Get user's top tracks
   */
  static async getTopTracks(
    userId: string,
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit = 50,
    offset = 0
  ): Promise<SpotifyTopItems<SpotifyTrack>> {
    const accessToken = await SpotifyAuth.getValidAccessToken(userId)
    
    const params = new URLSearchParams({
      time_range: timeRange,
      limit: limit.toString(),
      offset: offset.toString()
    })
    
    const url = `${spotifyConfig.endpoints.topTracks}?${params}`
    return await this.makeRequest<SpotifyTopItems<SpotifyTrack>>(url, accessToken)
  }

  /**
   * Get track details
   */
  static async getTrack(trackId: string, accessToken: string): Promise<SpotifyTrack> {
    return await this.makeRequest<SpotifyTrack>(
      spotifyConfig.endpoints.track(trackId),
      accessToken
    )
  }

  /**
   * Get artist details
   */
  static async getArtist(artistId: string, accessToken: string): Promise<SpotifyArtist> {
    return await this.makeRequest<SpotifyArtist>(
      spotifyConfig.endpoints.artist(artistId),
      accessToken
    )
  }

  /**
   * Get audio features for a track
   */
  static async getAudioFeatures(trackId: string, accessToken: string): Promise<SpotifyAudioFeatures> {
    return await this.makeRequest<SpotifyAudioFeatures>(
      spotifyConfig.endpoints.audioFeatures(trackId),
      accessToken
    )
  }

  /**
   * Test API connection and permissions
   */
  static async testConnection(userId: string): Promise<boolean> {
    try {
      await this.getCurrentUser(userId)
      return true
    } catch (error) {
      console.error('Spotify API connection test failed:', error)
      return false
    }
  }
}
