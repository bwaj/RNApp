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

    // Verify that the requesting user matches the userId
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const genreDistribution = await MusicDataQueries.getGenreDistribution(user.id)
    
    return NextResponse.json(genreDistribution)
  } catch (error) {
    console.error('Genre distribution error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch genre distribution' },
      { status: 500 }
    )
  }
}
