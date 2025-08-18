import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { MusicDataQueries } from '@/lib/db/queries'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify that the requesting user matches the userId
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const recentTracks = await MusicDataQueries.getRecentTracks(
      user.id,
      limit,
      offset
    )
    
    return NextResponse.json(recentTracks)
  } catch (error) {
    console.error('Recent tracks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent tracks' },
      { status: 500 }
    )
  }
}
