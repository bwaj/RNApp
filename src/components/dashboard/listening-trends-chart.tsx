'use client'

import { useState, useEffect } from 'react'
import { ListeningTrendData } from '@/lib/db/queries'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface ListeningTrendsChartProps {
  userId: string
  days?: number
}

export default function ListeningTrendsChart({ userId, days = 30 }: ListeningTrendsChartProps) {
  const [trends, setTrends] = useState<ListeningTrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')
  const [metricType, setMetricType] = useState<'tracks' | 'minutes' | 'artists'>('tracks')

  useEffect(() => {
    fetchTrends()
  }, [userId, days])

  const fetchTrends = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        userId,
        days: days.toString()
      })
      
      const response = await fetch(`/api/dashboard/listening-trends?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch listening trends')
      }
      
      const data = await response.json()
      setTrends(data)
    } catch (error) {
      console.error('Error fetching listening trends:', error)
      setError('Failed to load listening trends')
    } finally {
      setIsLoading(false)
    }
  }

  const formatXAxisLabel = (value: string) => {
    const date = new Date(value)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getYAxisKey = () => {
    switch (metricType) {
      case 'minutes': return 'totalMinutes'
      case 'artists': return 'uniqueArtists'
      default: return 'totalTracks'
    }
  }

  const getYAxisLabel = () => {
    switch (metricType) {
      case 'minutes': return 'Minutes Listened'
      case 'artists': return 'Unique Artists'
      default: return 'Tracks Played'
    }
  }

  const getLineColor = () => {
    switch (metricType) {
      case 'minutes': return '#10B981' // green
      case 'artists': return '#8B5CF6' // purple
      default: return '#F59E0B' // orange
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {formatXAxisLabel(label)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.totalTracks}</span> tracks played
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.totalMinutes}</span> minutes listened
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{data.uniqueArtists}</span> unique artists
          </p>
        </div>
      )
    }
    return null
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Listening Trends</h2>
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
        <h2 className="text-xl font-semibold text-gray-900">Listening Trends</h2>
        <div className="flex items-center space-x-4">
          {/* Metric Type Selector */}
          <select
            value={metricType}
            onChange={(e) => setMetricType(e.target.value as any)}
            className="block w-36 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md"
          >
            <option value="tracks">Tracks</option>
            <option value="minutes">Minutes</option>
            <option value="artists">Artists</option>
          </select>

          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded" style={{ width: `${Math.random() * 100 + 50}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      ) : trends.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-center">
          <div>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start listening to music to see your trends here.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey={getYAxisKey()}
                  stroke={getLineColor()}
                  strokeWidth={2}
                  dot={{ fill: getLineColor(), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: getLineColor(), strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxisLabel}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey={getYAxisKey()}
                  fill={getLineColor()}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
