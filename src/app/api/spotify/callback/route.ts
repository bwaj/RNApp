import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { SpotifyAuth } from '@/lib/spotify/auth'
import { SpotifyAPI } from '@/lib/spotify/api'
import { spotifyOperations } from '@/lib/db/operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Check for authorization errors
    if (error) {
      console.error('Spotify authorization error:', error)
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?spotify_error=${error}`)
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?spotify_error=missing_params`)
    }
    
    // Verify state parameter for CSRF protection
    const storedState = request.cookies.get('spotify_auth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?spotify_error=invalid_state`)
    }
    
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(`${request.nextUrl.origin}/auth/signin`)
    }

    // Exchange code for tokens
    const tokenResponse = await SpotifyAuth.exchangeCodeForTokens(code)
    
    // Get Spotify user info
    const spotifyUser = await SpotifyAPI.getCurrentUser(user.id)
    
    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000)
    
    // Store or update Spotify connection
    await spotifyOperations.create({
      userId: user.id,
      spotifyUserId: spotifyUser.id,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token!,
      tokenExpiresAt: expiresAt,
      isActive: true,
    })
    
    // Clear the state cookie
    const response = NextResponse.redirect(`${request.nextUrl.origin}/dashboard?spotify_connected=true`)
    response.cookies.delete('spotify_auth_state')
    
    return response
  } catch (error) {
    console.error('Spotify callback error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard?spotify_error=connection_failed`)
  }
}
