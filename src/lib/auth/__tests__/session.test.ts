import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock Next.js server functions
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

jest.mock('@/lib/auth/config', () => ({
  authOptions: {},
}))

import { getCurrentUser, requireAuth, getSession } from '../session'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>

describe('Auth Session Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentUser', () => {
    it('should return user when session exists', async () => {
      const mockUser = {
        id: 'user123',
        googleId: 'google123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }

      mockGetServerSession.mockResolvedValue({
        user: mockUser,
        accessToken: 'token123',
        expires: '2024-12-31'
      })

      const result = await getCurrentUser()
      expect(result).toEqual(mockUser)
      expect(mockGetServerSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })

    it('should return null when session has no user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: null,
        accessToken: '',
        expires: '2024-12-31'
      })

      const result = await getCurrentUser()
      expect(result).toBeNull()
    })
  })

  describe('requireAuth', () => {
    it('should return user when authenticated', async () => {
      const mockUser = {
        id: 'user123',
        googleId: 'google123',
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg'
      }

      mockGetServerSession.mockResolvedValue({
        user: mockUser,
        accessToken: 'token123',
        expires: '2024-12-31'
      })

      const result = await requireAuth()
      expect(result).toEqual(mockUser)
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should redirect when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await requireAuth()
      expect(mockRedirect).toHaveBeenCalledWith('/auth/signin')
    })
  })

  describe('getSession', () => {
    it('should return session when it exists', async () => {
      const mockSession = {
        user: {
          id: 'user123',
          googleId: 'google123',
          email: 'test@example.com',
          name: 'Test User',
          image: 'https://example.com/avatar.jpg'
        },
        accessToken: 'token123',
        expires: '2024-12-31'
      }

      mockGetServerSession.mockResolvedValue(mockSession)

      const result = await getSession()
      expect(result).toEqual(mockSession)
    })

    it('should return null when no session', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await getSession()
      expect(result).toBeNull()
    })
  })
})

// Unit tests for interface validation
describe('Auth Session Helpers (Unit Tests)', () => {
  it('should have correct function signatures', () => {
    expect(typeof getCurrentUser).toBe('function')
    expect(typeof requireAuth).toBe('function')
    expect(typeof getSession).toBe('function')
  })
})
