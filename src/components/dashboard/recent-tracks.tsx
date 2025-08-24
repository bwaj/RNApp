'use client'

import { useState, useEffect } from 'react'
import { RecentTrackData } from '@/lib/db/queries'
import Image from 'next/image'

interface RecentTracksProps {
  userId: string
  limit?: number
}

export default function RecentTracks({ userId, limit = 20 }: RecentTracksProps) {
  const [tracks, setTracks] = useState<RecentTrackData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchRecentTracks(true)
  }, [userId, limit])

  // Listen for sync completion to refresh data
  useEffect(() => {
    const handleSyncCompleted = () => {
      console.log('Refreshing recent tracks after sync...')
      fetchRecentTracks(true)
    }

    window.addEventListener('spotify-sync-completed', handleSyncCompleted)
    return () => window.removeEventListener('spotify-sync-completed', handleSyncCompleted)
  }, [userId])

  const fetchRecentTracks = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true)
        setTracks([])
      } else {
        setIsLoadingMore(true)
      }

      const offset = reset ? 0 : tracks.length
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        offset: offset.toString()
      })
      
      const response = await fetch(`/api/dashboard/recent-tracks?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent tracks')
      }
      
      const data = await response.json()
      
      if (reset) {
        setTracks(data)
      } else {
        setTracks(prev => [...prev, ...data])
      }
      
      // Check if we got fewer results than requested (indicating end of data)
      setHasMore(data.length === limit)
      
    } catch (error) {
      console.error('Error fetching recent tracks:', error)
      setError('Failed to load recent tracks')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchRecentTracks(false)
    }
  }

  const formatPlayedAt = (date: Date): string => {
    const now = new Date()
    const playedAt = new Date(date)
    const diffMs = now.getTime() - playedAt.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) {
      return 'Just now'
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return playedAt.toLocaleDateString()
    }
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Tracks</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Recent Tracks</h2>
        <button
          onClick={() => fetchRecentTracks(true)}
          disabled={isLoading}
          className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No recent tracks</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your listening history will appear here once you connect Spotify and sync your data.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tracks.map((trackData) => (
              <div key={`${trackData.id}-${trackData.playedAt}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 group">
                <div className="flex-shrink-0">
                  {trackData.album?.imageUrl ? (
                    <Image
                      src={trackData.album.imageUrl}
                      alt={trackData.album.name || 'Album cover'}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <svg className="h-3 w-3 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="truncate">{trackData.artist?.name || 'Unknown Artist'}</span>
                    <span>•</span>
                    <span>{formatDuration(trackData.track.durationMs)}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">
                    {formatPlayedAt(trackData.playedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
