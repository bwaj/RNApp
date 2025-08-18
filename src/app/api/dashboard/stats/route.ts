import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { MusicDataQueries } from '@/lib/db/queries'
import { CacheService } from '@/lib/cache/redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Verify that the requesting user matches the userId (or is admin)
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use caching for better performance
    const stats = await CacheService.getUserStats(user.id, async () => {
      return await MusicDataQueries.getUserListeningStats(user.id)
    })
    
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listening statistics' },
      { status: 500 }
    )
  }
}
