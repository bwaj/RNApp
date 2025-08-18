import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import TopArtists from '../top-artists'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

// Mock fetch
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('TopArtists', () => {
  const mockUserId = 'user123'
  const mockArtists = [
    {
      artist: {
        id: 'artist1',
        name: 'The Beatles',
        imageUrl: 'https://example.com/beatles.jpg',
        genres: ['rock', 'pop'],
        spotifyId: 'spotify1'
      },
      playCount: 150,
      totalListeningTime: 9000000 // 2.5 hours
    },
    {
      artist: {
        id: 'artist2',
        name: 'Taylor Swift',
        imageUrl: null,
        genres: ['pop', 'country'],
        spotifyId: 'spotify2'
      },
      playCount: 89,
      totalListeningTime: 5400000 // 1.5 hours
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<TopArtists userId={mockUserId} />)

    expect(screen.getByText('Top Artists')).toBeInTheDocument()
    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(5)
  })

  it('renders artist list when data is loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtists
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument()
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument()
      expect(screen.getByText('150 plays')).toBeInTheDocument()
      expect(screen.getByText('89 plays')).toBeInTheDocument()
    })
  })

  it('changes time range when dropdown is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockArtists
    } as Response)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('The Beatles')).toBeInTheDocument()
    })

    const dropdown = screen.getByDisplayValue('This Month')
    fireEvent.change(dropdown, { target: { value: 'week' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=week')
      )
    })
  })

  it('shows empty state when no artists found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('No artists found')).toBeInTheDocument()
      expect(screen.getByText('Start listening to music to see your top artists here.')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load top artists')).toBeInTheDocument()
    })
  })

  it('renders artist without image using fallback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockArtists[1]] // Taylor Swift without image
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument()
      // Should render fallback SVG icon instead of image
      expect(screen.getByRole('img', { name: 'Taylor Swift' })).toHaveAttribute('src', null)
    })
  })

  it('formats large play counts correctly', async () => {
    const artistWithLargePlays = {
      artist: {
        id: 'artist3',
        name: 'Popular Artist',
        imageUrl: null,
        genres: ['pop'],
        spotifyId: 'spotify3'
      },
      playCount: 2500,
      totalListeningTime: 15000000
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [artistWithLargePlays]
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('2.5K plays')).toBeInTheDocument()
    })
  })

  it('shows genres correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockArtists[0]] // The Beatles with rock, pop genres
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('rock, pop')).toBeInTheDocument()
    })
  })

  it('handles artists with no genres', async () => {
    const artistNoGenres = {
      artist: {
        id: 'artist4',
        name: 'Unknown Genre Artist',
        imageUrl: null,
        genres: [],
        spotifyId: 'spotify4'
      },
      playCount: 50,
      totalListeningTime: 3000000
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [artistNoGenres]
    } as Response)

    render(<TopArtists userId={mockUserId} />)

    await waitFor(() => {
      expect(screen.getByText('Various genres')).toBeInTheDocument()
    })
  })
})
