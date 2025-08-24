import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuickActionsCard from '../quick-actions-card'

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn()
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
})

describe('QuickActionsCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render all quick action buttons', () => {
    render(<QuickActionsCard />)

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('Sync Now')).toBeInTheDocument()
    expect(screen.getByText('View Analytics')).toBeInTheDocument()
    expect(screen.getByText('Search Library')).toBeInTheDocument()
  })

  it('should handle sync button click successfully', async () => {
    const mockSyncResult = {
      message: 'Sync completed successfully',
      synced: {
        recentTracks: 15,
        newArtists: 3,
        newAlbums: 2,
        newTracks: 12,
        listeningEvents: 15,
        errors: []
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSyncResult
    } as Response)

    render(<QuickActionsCard />)

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    // Should call sync API
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/spotify/sync', {
        method: 'POST'
      })
    })

    // Should emit custom event
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'spotify-sync-completed',
        detail: mockSyncResult
      })
    )
  })

  it('should show syncing state during sync operation', async () => {
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Sync completed' })
        } as Response), 100)
      )
    )

    render(<QuickActionsCard />)

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    // Should show syncing state
    await waitFor(() => {
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    // Button should be disabled
    expect(syncButton).toBeDisabled()

    // Should eventually return to normal state
    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should handle sync errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<QuickActionsCard />)

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to sync Spotify data:',
        expect.any(Error)
      )
    })

    // Should not emit custom event on error
    expect(mockDispatchEvent).not.toHaveBeenCalled()

    // Should return to normal state
    expect(screen.getByText('Sync Now')).toBeInTheDocument()
    expect(syncButton).not.toBeDisabled()

    consoleSpy.mockRestore()
  })

  it('should handle network errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<QuickActionsCard />)

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to sync Spotify data:',
        expect.any(Error)
      )
    })

    // Should not emit custom event on error
    expect(mockDispatchEvent).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should link to analytics page correctly', () => {
    render(<QuickActionsCard />)

    const analyticsLink = screen.getByText('View Analytics').closest('a')
    expect(analyticsLink).toHaveAttribute('href', '/analytics')
  })

  it('should prevent multiple simultaneous sync operations', async () => {
    // Mock a slow response
    mockFetch.mockImplementationOnce(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Sync completed' })
        } as Response), 100)
      )
    )

    render(<QuickActionsCard />)

    const syncButton = screen.getByText('Sync Now')
    
    // Click multiple times quickly
    fireEvent.click(syncButton)
    fireEvent.click(syncButton)
    fireEvent.click(syncButton)

    // Should only make one API call
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Wait for sync to complete
    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    }, { timeout: 200 })
  })
})
