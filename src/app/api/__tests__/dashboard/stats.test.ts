import { NextRequest } from 'next/server'
import { GET } from '../../dashboard/stats/route'
import { getCurrentUser } from '@/lib/auth/session'
import { MusicDataQueries } from '@/lib/db/queries'

// Mock dependencies
jest.mock('@/lib/auth/session')
jest.mock('@/lib/db/queries')
jest.mock('@/lib/cache/redis', () => ({
  CacheService: {
    getUserStats: jest.fn()
  }
}))

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockMusicDataQueries = MusicDataQueries as jest.Mocked<typeof MusicDataQueries>

describe('/api/dashboard/stats', () => {
  const mockUser = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com'
  }

  const mockStats = {
    totalTracks: 100,
    totalListeningTime: 3600000,
    totalArtists: 25,
    totalAlbums: 15,
    averageTrackLength: 180000,
    totalListeningEvents: 200
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user stats for authenticated user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    
    const { CacheService } = await import('@/lib/cache/redis')
    const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
    mockCacheService.getUserStats.mockImplementation(async (userId, fetcher) => {
      return await fetcher()
    })
    
    mockMusicDataQueries.getUserListeningStats.mockResolvedValueOnce(mockStats)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=user123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockStats)
    expect(mockMusicDataQueries.getUserListeningStats).toHaveBeenCalledWith('user123')
  })

  it('should return 401 for unauthenticated user', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=user123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 when user tries to access another user\'s stats', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=otheruser')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should handle database errors gracefully', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    
    const { CacheService } = await import('@/lib/cache/redis')
    const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
    mockCacheService.getUserStats.mockImplementation(async (userId, fetcher) => {
      return await fetcher()
    })
    
    mockMusicDataQueries.getUserListeningStats.mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=user123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch listening statistics')
  })

  it('should include cache headers in response', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    
    const { CacheService } = await import('@/lib/cache/redis')
    const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
    mockCacheService.getUserStats.mockImplementation(async (userId, fetcher) => {
      return await fetcher()
    })
    
    mockMusicDataQueries.getUserListeningStats.mockResolvedValueOnce(mockStats)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=user123')
    const response = await GET(request)

    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=300, stale-while-revalidate=86400')
  })

  it('should use cache service for performance', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(mockUser)
    
    const { CacheService } = await import('@/lib/cache/redis')
    const mockCacheService = CacheService as jest.Mocked<typeof CacheService>
    mockCacheService.getUserStats.mockResolvedValueOnce(mockStats)

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats?userId=user123')
    await GET(request)

    expect(mockCacheService.getUserStats).toHaveBeenCalledWith('user123', expect.any(Function))
  })
})
