import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import SpotifyConnectionCard from '../connection-card'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch globally
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn()
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
})

describe('SpotifyConnectionCard', () => {
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('should render sync button when Spotify is connected', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })

    // Mock connection status API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isConnected: true,
        isActive: true,
        lastSyncAt: '2025-01-21T10:00:00Z'
      })
    } as Response)

    render(<SpotifyConnectionCard />)

    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/spotify/sync')
  })

  it('should handle sync button click and emit custom event', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })

    // Mock connection status API response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConnected: true,
          isActive: true,
          lastSyncAt: '2025-01-21T10:00:00Z'
        })
      } as Response)
      // Mock sync API response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Sync completed successfully',
          synced: {
            recentTracks: 10,
            newArtists: 5,
            newAlbums: 3,
            newTracks: 8,
            listeningEvents: 10,
            errors: []
          }
        })
      } as Response)
      // Mock connection status refresh
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConnected: true,
          isActive: true,
          lastSyncAt: '2025-01-21T12:00:00Z'
        })
      } as Response)

    render(<SpotifyConnectionCard />)

    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    })

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/spotify/sync', {
        method: 'POST'
      })
    })

    // Check that custom event was dispatched
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'spotify-sync-completed',
        detail: {
          message: 'Sync completed successfully',
          synced: {
            recentTracks: 10,
            newArtists: 5,
            newAlbums: 3,
            newTracks: 8,
            listeningEvents: 10,
            errors: []
          }
        }
      })
    )
  })

  it('should show syncing state during sync operation', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })

    // Mock connection status API response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConnected: true,
          isActive: true,
          lastSyncAt: '2025-01-21T10:00:00Z'
        })
      } as Response)
      // Mock slow sync API response
      .mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ message: 'Sync completed' })
          } as Response), 100)
        )
      )

    render(<SpotifyConnectionCard />)

    await waitFor(() => {
      expect(screen.getByText('Sync Now')).toBeInTheDocument()
    })

    const syncButton = screen.getByText('Sync Now')
    fireEvent.click(syncButton)

    // Should show syncing state
    await waitFor(() => {
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    // Button should be disabled during sync
    expect(syncButton).toBeDisabled()
  })

  it('should handle sync errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })

    // Mock connection status API response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConnected: true,
          isActive: true,
          lastSyncAt: '2025-01-21T10:00:00Z'
        })
      } as Response)
      // Mock sync API error
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response)

    render(<SpotifyConnectionCard />)

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

    // Should not emit custom event on error
    expect(mockDispatchEvent).not.toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should render connect button when not connected to Spotify', async () => {
    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2025-12-31' },
      status: 'authenticated'
    })

    // Mock connection status API response - not connected
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isConnected: false,
        isActive: false
      })
    } as Response)

    render(<SpotifyConnectionCard />)

    await waitFor(() => {
      expect(screen.getByText('Connect Spotify')).toBeInTheDocument()
    })

    expect(screen.queryByText('Sync Now')).not.toBeInTheDocument()
  })
})
