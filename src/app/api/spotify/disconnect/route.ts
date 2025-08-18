import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { SpotifyAuth } from '@/lib/spotify/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await SpotifyAuth.revokeAccess(user.id)
    
    return NextResponse.json({ 
      message: 'Spotify account disconnected successfully' 
    })
  } catch (error) {
    console.error('Spotify disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Spotify account' },
      { status: 500 }
    )
  }
}
