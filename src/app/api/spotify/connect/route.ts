import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { SpotifyAuth } from '@/lib/spotify/auth'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate a random state for CSRF protection
    const state = randomBytes(16).toString('hex')
    
    // Store state in session/cookie for verification
    const response = NextResponse.redirect(SpotifyAuth.getAuthorizationUrl(state))
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60, // 10 minutes
    })
    
    return response
  } catch (error) {
    console.error('Spotify connect error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Spotify connection' },
      { status: 500 }
    )
  }
}
