import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import StatsOverview from '../stats-overview'

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('StatsOverview', () => {
  const userId = 'user123'
  const mockStats = {
    totalTracks: 1250,
    totalArtists: 180,
    totalPlaytime: 15600000, // 4.33 hours in ms
    topGenre: 'Electronic',
    listeningStreak: 12,
    recentActivity: {
      tracksThisWeek: 45,
      newArtistsThisMonth: 8
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should fetch and display stats on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    } as Response)

    render(<StatsOverview userId={userId} />)

    // Should fetch stats
    expect(mockFetch).toHaveBeenCalledWith(`/api/dashboard/stats?userId=${userId}`)

    // Should display stats after loading
    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument() // totalTracks formatted
      expect(screen.getByText('180')).toBeInTheDocument() // totalArtists  
      expect(screen.getByText('4h 20m')).toBeInTheDocument() // formatted playtime
    })
  })

  it('should refresh stats when spotify-sync-completed event is fired', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    } as Response)

    render(<StatsOverview userId={userId} />)

    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument()
    })

    // Clear the mock to track new calls
    mockFetch.mockClear()

    // Updated stats after sync
    const updatedStats = {
      ...mockStats,
      totalTracks: 1275, // 25 new tracks
      totalArtists: 185, // 5 new artists
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedStats
    } as Response)

    // Simulate sync completed event
    act(() => {
      window.dispatchEvent(new CustomEvent('spotify-sync-completed', {
        detail: {
          synced: {
            recentTracks: 25,
            newArtists: 5,
            newTracks: 25,
            listeningEvents: 25,
            errors: []
          }
        }
      }))
    })

    // Should fetch stats again
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/dashboard/stats?userId=${userId}`)
    })

    // Should display updated stats
    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument() // Still formatted as 1.3K
      expect(screen.getByText('185')).toBeInTheDocument()
    })
  })

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<StatsOverview userId={userId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<StatsOverview userId={userId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    } as Response)

    const { unmount } = render(<StatsOverview userId={userId} />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'spotify-sync-completed',
      expect.any(Function)
    )

    removeEventListenerSpy.mockRestore()
  })

  it('should format duration correctly', async () => {
    const statsWithShortDuration = { ...mockStats, totalPlaytime: 120000 } // 2m

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithShortDuration
    } as Response)

    render(<StatsOverview userId={userId} />)

    await waitFor(() => {
      expect(screen.getByText('2m')).toBeInTheDocument()
    })
  })
})