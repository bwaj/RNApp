import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { MusicDataQueries } from '../queries'

// Mock the database config
jest.mock('../config', () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
  }
}))

// Mock schema
jest.mock('../schema', () => ({
  listeningHistory: {
    id: 'listening_history.id',
    userId: 'listening_history.user_id',
    trackId: 'listening_history.track_id',
    playedAt: 'listening_history.played_at'
  },
  tracks: {
    id: 'tracks.id',
    name: 'tracks.name',
    durationMs: 'tracks.duration_ms',
    albumId: 'tracks.album_id'
  },
  artists: {
    id: 'artists.id',
    name: 'artists.name',
    genres: 'artists.genres',
    imageUrl: 'artists.image_url',
    spotifyId: 'artists.spotify_id'
  },
  albums: {
    id: 'albums.id',
    name: 'albums.name',
    imageUrl: 'albums.image_url'
  },
  trackArtists: {
    trackId: 'track_artists.track_id',
    artistId: 'track_artists.artist_id'
  }
}))

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ type: 'eq', left: a, right: b })),
  desc: jest.fn(field => ({ type: 'desc', field })),
  count: jest.fn(field => ({ type: 'count', field })),
  sum: jest.fn(field => ({ type: 'sum', field })),
  avg: jest.fn(field => ({ type: 'avg', field })),
  and: jest.fn((...conditions) => ({ type: 'and', conditions })),
  gte: jest.fn((a, b) => ({ type: 'gte', left: a, right: b })),
  lte: jest.fn((a, b) => ({ type: 'lte', left: a, right: b })),
  sql: jest.fn(template => ({ type: 'sql', template })),
  asc: jest.fn(field => ({ type: 'asc', field }))
}))

import { db } from '../config'

const mockDb = db as jest.Mocked<typeof db>

describe('MusicDataQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getUserListeningStats', () => {
    it('should return user listening statistics', async () => {
      const mockStats = {
        totalListeningEvents: 100,
        totalListeningTime: 18000000, // 5 hours
        averageTrackLength: 180000 // 3 minutes
      }

      const mockArtistCount = { totalArtists: 25 }
      const mockTrackCount = { totalTracks: 50 }
      const mockAlbumCount = { totalAlbums: 15 }

      // Mock the chained query builder
      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      
      // Mock multiple query results
      mockDb.select
        .mockReturnValueOnce([mockStats] as any)
        .mockReturnValueOnce([mockArtistCount] as any)
        .mockReturnValueOnce([mockTrackCount] as any)
        .mockReturnValueOnce([mockAlbumCount] as any)

      const result = await MusicDataQueries.getUserListeningStats('user123')

      expect(result).toEqual({
        totalTracks: 50,
        totalListeningTime: 18000000,
        totalArtists: 25,
        totalAlbums: 15,
        averageTrackLength: 180000,
        totalListeningEvents: 100
      })
    })

    it('should handle empty results gracefully', async () => {
      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      
      // Mock empty results
      mockDb.select
        .mockReturnValueOnce([{}] as any)
        .mockReturnValueOnce([{}] as any)
        .mockReturnValueOnce([{}] as any)
        .mockReturnValueOnce([{}] as any)

      const result = await MusicDataQueries.getUserListeningStats('user123')

      expect(result).toEqual({
        totalTracks: 0,
        totalListeningTime: 0,
        totalArtists: 0,
        totalAlbums: 0,
        averageTrackLength: 0,
        totalListeningEvents: 0
      })
    })
  })

  describe('getTopArtists', () => {
    it('should return top artists for user', async () => {
      const mockArtists = [
        {
          artist: {
            id: 'artist1',
            name: 'The Beatles',
            imageUrl: 'beatles.jpg',
            genres: ['rock', 'pop'],
            spotifyId: 'spotify1'
          },
          playCount: 50,
          totalListeningTime: 9000000
        }
      ]

      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce(mockArtists.map(artist => ({
        ...artist,
        playCount: String(artist.playCount),
        totalListeningTime: String(artist.totalListeningTime)
      })) as any)

      const result = await MusicDataQueries.getTopArtists('user123', 10)

      expect(result).toHaveLength(1)
      expect(result[0].artist.name).toBe('The Beatles')
      expect(result[0].playCount).toBe(50)
      expect(result[0].totalListeningTime).toBe(9000000)
    })

    it('should handle date range filtering', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce([] as any)

      await MusicDataQueries.getTopArtists('user123', 10, startDate, endDate)

      // Verify that date filtering was applied
      expect(mockQuery.where).toHaveBeenCalled()
    })
  })

  describe('getRecentTracks', () => {
    it('should return recent tracks with pagination', async () => {
      const mockTracks = [
        {
          id: 'history1',
          playedAt: new Date('2024-01-01T12:00:00Z'),
          track: {
            id: 'track1',
            name: 'Yesterday',
            spotifyId: 'spotify1',
            durationMs: 180000,
            previewUrl: null
          },
          artist: {
            id: 'artist1',
            name: 'The Beatles',
            imageUrl: 'beatles.jpg'
          },
          album: {
            id: 'album1',
            name: 'Help!',
            imageUrl: 'help.jpg'
          }
        }
      ]

      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce(mockTracks as any)

      const result = await MusicDataQueries.getRecentTracks('user123', 20, 0)

      expect(result).toHaveLength(1)
      expect(result[0].track.name).toBe('Yesterday')
      expect(result[0].artist.name).toBe('The Beatles')
      expect(mockQuery.limit).toHaveBeenCalledWith(20)
      expect(mockQuery.offset).toHaveBeenCalledWith(0)
    })
  })

  describe('getListeningTrends', () => {
    it('should return listening trends over time', async () => {
      const mockTrends = [
        {
          date: '2024-01-01',
          totalTracks: 10,
          totalMinutes: 45,
          uniqueArtists: 8
        },
        {
          date: '2024-01-02',
          totalTracks: 15,
          totalMinutes: 60,
          uniqueArtists: 12
        }
      ]

      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce(mockTrends.map(trend => ({
        ...trend,
        totalTracks: String(trend.totalTracks),
        totalMinutes: String(trend.totalMinutes),
        uniqueArtists: String(trend.uniqueArtists)
      })) as any)

      const result = await MusicDataQueries.getListeningTrends('user123', 30)

      expect(result).toHaveLength(2)
      expect(result[0].date).toBe('2024-01-01')
      expect(result[0].totalTracks).toBe(10)
      expect(result[1].totalMinutes).toBe(60)
    })
  })

  describe('getGenreDistribution', () => {
    it('should return genre distribution with percentages', async () => {
      const mockGenres = [
        { genre: 'rock', trackCount: '50' },
        { genre: 'pop', trackCount: '30' },
        { genre: 'jazz', trackCount: '20' }
      ]

      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce(mockGenres as any)

      const result = await MusicDataQueries.getGenreDistribution('user123')

      expect(result).toHaveLength(3)
      expect(result[0].genre).toBe('rock')
      expect(result[0].trackCount).toBe(50)
      expect(result[0].percentage).toBe(50) // 50/100 * 100
      expect(result[1].percentage).toBe(30) // 30/100 * 100
      expect(result[2].percentage).toBe(20) // 20/100 * 100
    })

    it('should handle empty genres gracefully', async () => {
      const mockQuery = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
      }

      mockDb.select.mockReturnValue(mockQuery as any)
      mockDb.select.mockResolvedValueOnce([] as any)

      const result = await MusicDataQueries.getGenreDistribution('user123')

      expect(result).toHaveLength(0)
    })
  })
})
