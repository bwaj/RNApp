'use client'

import { useState, useEffect } from 'react'
import { TopTrackData } from '@/lib/db/queries'
import Image from 'next/image'

interface TopTracksProps {
  userId: string
  timeRange?: 'week' | 'month' | 'year' | 'all'
  limit?: number
}

export default function TopTracks({ userId, timeRange = 'month', limit = 10 }: TopTracksProps) {
  const [tracks, setTracks] = useState<TopTrackData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  useEffect(() => {
    fetchTopTracks()
  }, [userId, selectedTimeRange, limit])

  // Listen for sync completion to refresh data
  useEffect(() => {
    const handleSyncCompleted = () => {
      console.log('Refreshing top tracks after sync...')
      fetchTopTracks()
    }

    window.addEventListener('spotify-sync-completed', handleSyncCompleted)
    return () => window.removeEventListener('spotify-sync-completed', handleSyncCompleted)
  }, [userId, selectedTimeRange])

  const fetchTopTracks = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        userId,
        timeRange: selectedTimeRange,
        limit: limit.toString()
      })
      
      const response = await fetch(`/api/dashboard/top-tracks?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch top tracks')
      }
      
      const data = await response.json()
      setTracks(data)
    } catch (error) {
      console.error('Error fetching top tracks:', error)
      setError('Failed to load top tracks')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPlayCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatLastPlayed = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - new Date(date).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return new Date(date).toLocaleDateString()
    }
  }

  const timeRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' }
  ]

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Tracks</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Top Tracks</h2>
        <select
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value as any)}
          className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tracks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start listening to music to see your top tracks here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tracks.map((trackData, index) => (
            <div key={`${trackData.track.id}-${index}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 group">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-500 text-white text-sm font-medium">
                  {index + 1}
                </span>
              </div>
              
              <div className="flex-shrink-0">
                {trackData.album?.imageUrl ? (
                  <Image
                    src={trackData.album.imageUrl}
                    alt={trackData.album.name || 'Album cover'}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {trackData.track.name}
                  </p>
                  {trackData.track.previewUrl && (
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="truncate">{trackData.artist?.name || 'Unknown Artist'}</span>
                  {trackData.album?.name && (
                    <>
                      <span>•</span>
                      <span className="truncate">{trackData.album.name}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatDuration(trackData.track.durationMs)}</span>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatPlayCount(trackData.playCount)} plays
                </p>
                <p className="text-sm text-gray-500">
                  {formatLastPlayed(trackData.lastPlayed)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
