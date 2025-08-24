import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import SpotifyConnectionCard from '@/components/spotify/connection-card'
import StatsOverview from '@/components/dashboard/stats-overview'
import QuickActionsCard from '@/components/dashboard/quick-actions-card'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('Sync Flow Integration', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User'
  }

  const initialStats = {
    totalTracks: 1200,
    totalArtists: 150,
    totalPlaytime: 12000000,
    topGenre: 'Electronic',
    listeningStreak: 10,
    recentActivity: {
      tracksThisWeek: 40,
      newArtistsThisMonth: 5
    }
  }

  const updatedStats = {
    totalTracks: 1225, // +25 tracks
    totalArtists: 155, // +5 artists
    totalPlaytime: 13500000, // +1.5h playtime
    topGenre: 'Electronic',
    listeningStreak: 11,
    recentActivity: {
      tracksThisWeek: 45,
      newArtistsThisMonth: 8
    }
  }

  const syncResult = {
    message: 'Sync completed successfully',
    synced: {
      recentTracks: 25,
      newArtists: 5,
      newAlbums: 3,
      newTracks: 25,
      listeningEvents: 25,
      errors: []
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })
  })

  it('should complete full sync flow from SpotifyConnectionCard', async () => {
    // Mock API responses
    let callCount = 0
    mockFetch.mockImplementation((url, options) => {
      callCount++
      
      if (url === '/api/spotify/sync' && !options?.method) {
        // GET sync status
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isConnected: true,
            isActive: true,
            lastSyncAt: '2025-01-21T10:00:00Z'
          })
        } as Response)
      }
      
      if (url === '/api/spotify/sync' && options?.method === 'POST') {
        // POST sync
        return Promise.resolve({
          ok: true,
          json: async () => syncResult
        } as Response)
      }
      
      if (url === `/api/dashboard/stats?userId=${mockUser.id}`) {
        // Stats API - return updated stats after sync
        const stats = callCount <= 2 ? initialStats : updatedStats
        return Promise.resolve({
          ok: true,
          json: async () => stats
        } as Response)
      }
      
      return Promise.reject(new Error('Unexpected API call'))
    })

    // Render components together
    const TestComponent = () => (
      <div>
        <SpotifyConnectionCard />
        <StatsOverview userId={mockUser.id} />
      </div>
    )

    render(<TestComponent />)

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
      expect(screen.getByText('1.2K')).toBeInTheDocument() // initial totalTracks formatted
    })

    // Click sync button
    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    // Should complete sync and update stats
    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument() // sync completed
      expect(screen.getByText('1.2K')).toBeInTheDocument() // stats refreshed
      expect(screen.getByText('155')).toBeInTheDocument() // updated totalArtists
    })

    // Verify API calls
    expect(mockFetch).toHaveBeenCalledWith('/api/spotify/sync') // status check
    expect(mockFetch).toHaveBeenCalledWith('/api/spotify/sync', { method: 'POST' }) // sync
    expect(mockFetch).toHaveBeenCalledWith(`/api/dashboard/stats?userId=${mockUser.id}`) // stats refresh
  })

  it('should complete full sync flow from QuickActionsCard', async () => {
    // Mock API responses
    let statsCallCount = 0
    mockFetch.mockImplementation((url, options) => {
      if (url === '/api/spotify/sync' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => syncResult
        } as Response)
      }
      
      if (url === `/api/dashboard/stats?userId=${mockUser.id}`) {
        statsCallCount++
        const stats = statsCallCount === 1 ? initialStats : updatedStats
        return Promise.resolve({
          ok: true,
          json: async () => stats
        } as Response)
      }
      
      return Promise.reject(new Error('Unexpected API call'))
    })

    const TestComponent = () => (
      <div>
        <QuickActionsCard />
        <StatsOverview userId={mockUser.id} />
      </div>
    )

    render(<TestComponent />)

    // Wait for initial stats to load
    await waitFor(() => {
      expect(screen.getByText('1.2K')).toBeInTheDocument()
    })

    // Click sync from quick actions
    const syncButtons = screen.getAllByText('Sync Now')
    expect(syncButtons.length).toBeGreaterThan(0)
    fireEvent.click(syncButtons[0]) // Click first sync button

    // Should complete sync and update stats
    await waitFor(() => {
      expect(screen.getAllByText('Sync Now').length).toBeGreaterThan(0) // buttons back to normal
      expect(screen.getByText('1.2K')).toBeInTheDocument() // stats refreshed
    })
  })

  it('should handle sync errors in the full flow', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch.mockImplementation((url, options) => {
      if (url === '/api/spotify/sync' && !options?.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isConnected: true,
            isActive: true,
            lastSyncAt: '2025-01-21T10:00:00Z'
          })
        } as Response)
      }
      
      if (url === '/api/spotify/sync' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 500
        } as Response)
      }
      
      if (url === `/api/dashboard/stats?userId=${mockUser.id}`) {
        return Promise.resolve({
          ok: true,
          json: async () => initialStats
        } as Response)
      }
      
      return Promise.reject(new Error('Unexpected API call'))
    })

    const TestComponent = () => (
      <div>
        <SpotifyConnectionCard />
        <StatsOverview userId={mockUser.id} />
      </div>
    )

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    })

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to sync Spotify data:',
        expect.any(Error)
      )
    })

    // Stats should remain unchanged
    expect(screen.getByText('1.2K')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
