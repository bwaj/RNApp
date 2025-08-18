import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error('Spotify API credentials are required')
}

export const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/spotify/callback`,
  
  // Spotify API endpoints
  endpoints: {
    authorize: 'https://accounts.spotify.com/authorize',
    token: 'https://accounts.spotify.com/api/token',
    me: 'https://api.spotify.com/v1/me',
    recentlyPlayed: 'https://api.spotify.com/v1/me/player/recently-played',
    topArtists: 'https://api.spotify.com/v1/me/top/artists',
    topTracks: 'https://api.spotify.com/v1/me/top/tracks',
    track: (id: string) => `https://api.spotify.com/v1/tracks/${id}`,
    artist: (id: string) => `https://api.spotify.com/v1/artists/${id}`,
    album: (id: string) => `https://api.spotify.com/v1/albums/${id}`,
    audioFeatures: (id: string) => `https://api.spotify.com/v1/audio-features/${id}`,
  },
  
  // Required scopes for our application
  scopes: [
    'user-read-email',
    'user-read-private', 
    'user-read-recently-played',
    'user-top-read',
    'user-read-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative'
  ],
  
  // Rate limiting configuration
  rateLimit: {
    requestsPerSecond: 1, // Conservative rate limiting
    burstLimit: 10,
    retryDelay: 1000, // 1 second
    maxRetries: 3
  }
}
