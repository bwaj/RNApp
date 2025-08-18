import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { SpotifyDataSync } from '@/lib/spotify/sync'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await SpotifyDataSync.syncUserData(user.id)
    
    return NextResponse.json({
      message: 'Sync completed successfully',
      synced: result
    })
  } catch (error) {
    console.error('Spotify sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Spotify data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await SpotifyDataSync.getSyncStatus(user.id)
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Spotify sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
