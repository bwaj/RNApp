'use client'

import { useState, useEffect } from 'react'
import { TopArtistData } from '@/lib/db/queries'
import Image from 'next/image'

interface TopArtistsProps {
  userId: string
  timeRange?: 'week' | 'month' | 'year' | 'all'
  limit?: number
}

export default function TopArtists({ userId, timeRange = 'month', limit = 10 }: TopArtistsProps) {
  const [artists, setArtists] = useState<TopArtistData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)

  useEffect(() => {
    fetchTopArtists()
  }, [userId, selectedTimeRange, limit])

  const fetchTopArtists = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        userId,
        timeRange: selectedTimeRange,
        limit: limit.toString()
      })
      
      const response = await fetch(`/api/dashboard/top-artists?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch top artists')
      }
      
      const data = await response.json()
      setArtists(data)
    } catch (error) {
      console.error('Error fetching top artists:', error)
      setError('Failed to load top artists')
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

  const formatListeningTime = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Artists</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Top Artists</h2>
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
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No artists found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start listening to music to see your top artists here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {artists.map((artistData, index) => (
            <div key={artistData.artist.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-500 text-white text-sm font-medium">
                  {index + 1}
                </span>
              </div>
              
              <div className="flex-shrink-0">
                {artistData.artist.imageUrl ? (
                  <Image
                    src={artistData.artist.imageUrl}
                    alt={artistData.artist.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {artistData.artist.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {artistData.artist.genres.slice(0, 2).join(', ') || 'Various genres'}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatPlayCount(artistData.playCount)} plays
                </p>
                {artistData.totalListeningTime > 0 && (
                  <p className="text-sm text-gray-500">
                    {formatListeningTime(artistData.totalListeningTime)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
