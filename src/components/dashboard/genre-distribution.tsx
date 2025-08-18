'use client'

import { useState, useEffect } from 'react'
import { GenreData } from '@/lib/db/queries'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface GenreDistributionProps {
  userId: string
}

const COLORS = [
  '#F59E0B', // orange
  '#EF4444', // red  
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#F97316', // orange-600
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#6366F1', // indigo
]

export default function GenreDistribution({ userId }: GenreDistributionProps) {
  const [genres, setGenres] = useState<GenreData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGenres()
  }, [userId])

  const fetchGenres = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ userId })
      
      const response = await fetch(`/api/dashboard/genres?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch genre distribution')
      }
      
      const data = await response.json()
      setGenres(data)
    } catch (error) {
      console.error('Error fetching genres:', error)
      setError('Failed to load genre distribution')
    } finally {
      setIsLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.payload.genre}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.payload.trackCount}</span> tracks ({data.payload.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-xs text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Genre Distribution</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Genre Distribution</h2>
        <button
          onClick={fetchGenres}
          disabled={isLoading}
          className="text-sm text-orange-600 hover:text-orange-700 disabled:text-gray-400"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-48 h-48 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="flex justify-center space-x-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded w-16"></div>
              ))}
            </div>
          </div>
        </div>
      ) : genres.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-center">
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No genre data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Listen to more music to see your genre preferences.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genres}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="trackCount"
                nameKey="genre"
                label={({ genre, percentage }) => `${genre}: ${percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {genres.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Genre List */}
          <div className="mt-6 space-y-2">
            {genres.slice(0, 5).map((genre, index) => (
              <div key={genre.genre} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {genre.genre}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {genre.percentage.toFixed(1)}%
                  </span>
                  <p className="text-xs text-gray-500">
                    {genre.trackCount} tracks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
