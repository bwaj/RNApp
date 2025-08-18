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
    const timeRange = searchParams.get('timeRange') || 'month'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Verify that the requesting user matches the userId
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate date range based on timeRange
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (timeRange !== 'all') {
      endDate = new Date()
      startDate = new Date()
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }
    }

    const topArtists = await MusicDataQueries.getTopArtists(
      user.id,
      limit,
      startDate,
      endDate
    )
    
    return NextResponse.json(topArtists)
  } catch (error) {
    console.error('Top artists error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top artists' },
      { status: 500 }
    )
  }
}
