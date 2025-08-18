import { render, screen, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import StatsOverview from '../stats-overview'

// Mock next-auth
jest.mock('next-auth/react')
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>

// Mock fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('StatsOverview', () => {
  const mockUserId = 'user123'
  const mockStats = {
    totalTracks: 1250,
    totalListeningTime: 7200000, // 2 hours in ms
    totalArtists: 89,
    totalListeningEvents: 2340,
    averageTrackLength: 180000
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { id: mockUserId } },
      status: 'authenticated'
    } as any)
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<StatsOverview userId={mockUserId} />)

    expect(screen.getAllByTestId(/skeleton|loading/i)).toHaveLength(4)
  })

  it('renders stats cards when data is loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    } as Response)

    render(<StatsOverview userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('1.3K')).toBeInTheDocument() // Total tracks formatted
      expect(screen.getByText('2h 0m')).toBeInTheDocument() // Listening time formatted
      expect(screen.getByText('89')).toBeInTheDocument() // Total artists
      expect(screen.getByText('2.3K')).toBeInTheDocument() // Play count formatted
    })
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<StatsOverview userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })

  it('shows no data message when stats are empty', async () => {
    const emptyStats = {
      totalTracks: 0,
      totalListeningTime: 0,
      totalArtists: 0,
      totalListeningEvents: 0,
      averageTrackLength: 0
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyStats
    } as Response)

    render(<StatsOverview userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('No listening data available yet')).toBeInTheDocument()
    })
  })

  it('formats numbers correctly', async () => {
    const largeStats = {
      totalTracks: 12500,
      totalListeningTime: 3661000, // 1h 1m 1s
      totalArtists: 1250,
      totalListeningEvents: 25000,
      averageTrackLength: 180000
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => largeStats
    } as Response)

    render(<StatsOverview userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('12.5K')).toBeInTheDocument() // Total tracks
      expect(screen.getByText('1h 1m')).toBeInTheDocument() // Listening time
      expect(screen.getByText('1.3K')).toBeInTheDocument() // Total artists
      expect(screen.getByText('25.0K')).toBeInTheDocument() // Play count
    })
  })

  it('makes API call with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats
    } as Response)

    render(<StatsOverview userId={mockUserId} />)

    expect(mockFetch).toHaveBeenCalledWith(
      `/api/dashboard/stats?userId=${mockUserId}`
    )
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<StatsOverview userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load statistics')).toBeInTheDocument()
    })
  })
})
