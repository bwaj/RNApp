'use client'

import { lazy, Suspense } from 'react'
import { ErrorBoundary, DashboardErrorFallback } from '@/components/ui/error-boundary'

// Lazy load dashboard components for better performance
const StatsOverview = lazy(() => import('@/components/dashboard/stats-overview'))
const TopArtists = lazy(() => import('@/components/dashboard/top-artists'))
const TopTracks = lazy(() => import('@/components/dashboard/top-tracks'))
const RecentTracks = lazy(() => import('@/components/dashboard/recent-tracks'))
const ListeningTrendsChart = lazy(() => import('@/components/dashboard/listening-trends-chart'))
const GenreDistribution = lazy(() => import('@/components/dashboard/genre-distribution'))

// Loading skeletons for each component
const StatsOverviewSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
)

const TopContentSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const ChartSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="h-80 bg-gray-200 rounded"></div>
    </div>
  </div>
)

// Lazy-loaded dashboard components with error boundaries
interface LazyDashboardProps {
  userId: string
}

export function LazyStatsOverview({ userId }: LazyDashboardProps) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<StatsOverviewSkeleton />}>
        <StatsOverview userId={userId} />
      </Suspense>
    </ErrorBoundary>
  )
}

export function LazyTopArtists({ userId, limit = 8 }: LazyDashboardProps & { limit?: number }) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<TopContentSkeleton />}>
        <TopArtists userId={userId} limit={limit} />
      </Suspense>
    </ErrorBoundary>
  )
}

export function LazyTopTracks({ userId, limit = 8 }: LazyDashboardProps & { limit?: number }) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<TopContentSkeleton />}>
        <TopTracks userId={userId} limit={limit} />
      </Suspense>
    </ErrorBoundary>
  )
}

export function LazyRecentTracks({ userId, limit = 15 }: LazyDashboardProps & { limit?: number }) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<TopContentSkeleton />}>
        <RecentTracks userId={userId} limit={limit} />
      </Suspense>
    </ErrorBoundary>
  )
}

export function LazyListeningTrendsChart({ userId, days = 30 }: LazyDashboardProps & { days?: number }) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<ChartSkeleton />}>
        <ListeningTrendsChart userId={userId} days={days} />
      </Suspense>
    </ErrorBoundary>
  )
}

export function LazyGenreDistribution({ userId }: LazyDashboardProps) {
  return (
    <ErrorBoundary fallback={DashboardErrorFallback}>
      <Suspense fallback={<ChartSkeleton />}>
        <GenreDistribution userId={userId} />
      </Suspense>
    </ErrorBoundary>
  )
}
