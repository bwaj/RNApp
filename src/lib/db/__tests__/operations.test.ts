import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { db } from '../config'
import { 
  userOperations, 
  spotifyOperations, 
  artistOperations, 
  trackOperations,
  dbOperations 
} from '../operations'
import type { NewUser, NewSpotifyConnection, NewArtist, NewTrack } from '../schema'

// Mock data
const mockUser: NewUser = {
  googleId: 'test_google_id_123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg'
}

const mockArtist: NewArtist = {
  spotifyId: 'spotify_artist_test',
  name: 'Test Artist',
  genres: ['rock', 'indie'],
  popularity: 75,
  imageUrl: 'https://example.com/artist.jpg',
  followers: 50000
}

describe('Database Operations', () => {
  beforeAll(async () => {
    // Check if database is connected
    const health = await dbOperations.healthCheck()
    if (!health.healthy) {
      console.log('Database not available, skipping integration tests')
      return
    }
  })

  beforeEach(async () => {
    // Clear test data before each test
    try {
      await dbOperations.clearAllTables()
    } catch (error) {
      // Database might not be available, skip clearing
      console.log('Skipping table clearing - database not available')
    }
  })

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const user = await userOperations.create(mockUser)
      
      expect(user).toBeDefined()
      expect(user.email).toBe(mockUser.email)
      expect(user.name).toBe(mockUser.name)
      expect(user.googleId).toBe(mockUser.googleId)
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeDefined()
    })

    it('should find user by Google ID', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const createdUser = await userOperations.create(mockUser)
      const foundUser = await userOperations.findByGoogleId(mockUser.googleId)
      
      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(createdUser.id)
      expect(foundUser?.email).toBe(mockUser.email)
    })

    it('should find user by email', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const createdUser = await userOperations.create(mockUser)
      const foundUser = await userOperations.findByEmail(mockUser.email)
      
      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(createdUser.id)
      expect(foundUser?.googleId).toBe(mockUser.googleId)
    })

    it('should update user information', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const createdUser = await userOperations.create(mockUser)
      const updatedUser = await userOperations.update(createdUser.id, {
        name: 'Updated Name'
      })
      
      expect(updatedUser.name).toBe('Updated Name')
      expect(updatedUser.email).toBe(mockUser.email) // Should remain the same
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(createdUser.createdAt.getTime())
    })
  })

  describe('Artist Operations', () => {
    it('should upsert an artist', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const artist = await artistOperations.upsert(mockArtist)
      
      expect(artist).toBeDefined()
      expect(artist.name).toBe(mockArtist.name)
      expect(artist.spotifyId).toBe(mockArtist.spotifyId)
      expect(artist.popularity).toBe(mockArtist.popularity)
    })

    it('should update existing artist on upsert', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      // Create artist
      const originalArtist = await artistOperations.upsert(mockArtist)
      
      // Update same artist with new data
      const updatedData = {
        ...mockArtist,
        name: 'Updated Artist Name',
        popularity: 90
      }
      const updatedArtist = await artistOperations.upsert(updatedData)
      
      expect(updatedArtist.id).toBe(originalArtist.id) // Same ID
      expect(updatedArtist.name).toBe('Updated Artist Name')
      expect(updatedArtist.popularity).toBe(90)
      expect(updatedArtist.spotifyId).toBe(mockArtist.spotifyId) // Same Spotify ID
    })

    it('should find artist by Spotify ID', async () => {
      const health = await dbOperations.healthCheck()
      if (!health.healthy) {
        console.log('Skipping test - database not available')
        return
      }

      const createdArtist = await artistOperations.upsert(mockArtist)
      const foundArtist = await artistOperations.findBySpotifyId(mockArtist.spotifyId)
      
      expect(foundArtist).toBeDefined()
      expect(foundArtist?.id).toBe(createdArtist.id)
      expect(foundArtist?.name).toBe(mockArtist.name)
    })
  })

  describe('Database Health Check', () => {
    it('should perform health check', async () => {
      const health = await dbOperations.healthCheck()
      
      expect(health).toBeDefined()
      expect(health.timestamp).toBeDefined()
      expect(typeof health.healthy).toBe('boolean')
      
      if (!health.healthy) {
        console.log('Database health check failed:', health.error)
        expect(health.error).toBeDefined()
      }
    })
  })
})

// Unit tests that don't require database connection
describe('Database Operations (Unit Tests)', () => {
  it('should have correct user operations interface', () => {
    expect(typeof userOperations.create).toBe('function')
    expect(typeof userOperations.findByGoogleId).toBe('function')
    expect(typeof userOperations.findByEmail).toBe('function')
    expect(typeof userOperations.findById).toBe('function')
    expect(typeof userOperations.update).toBe('function')
    expect(typeof userOperations.delete).toBe('function')
  })

  it('should have correct artist operations interface', () => {
    expect(typeof artistOperations.upsert).toBe('function')
    expect(typeof artistOperations.findBySpotifyId).toBe('function')
    expect(typeof artistOperations.findById).toBe('function')
  })

  it('should have correct database operations interface', () => {
    expect(typeof dbOperations.healthCheck).toBe('function')
    expect(typeof dbOperations.clearAllTables).toBe('function')
  })
})
