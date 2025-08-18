import { requireAuth } from '@/lib/auth/session'
import { 
  LazyListeningTrendsChart,
  LazyGenreDistribution,
  LazyTopArtists,
  LazyTopTracks
} from '@/components/lazy/lazy-dashboard'
import SkipNavigation from '@/components/accessibility/skip-navigation'
import { analyticsMetadata } from '@/lib/seo/metadata'

export const metadata = analyticsMetadata

export default async function AnalyticsPage() {
  const user = await requireAuth()

  return (
    <>
      <SkipNavigation />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 id="main-content" className="text-3xl font-bold text-gray-900" tabIndex={-1}>Music Analytics</h1>
            <p className="text-lg text-gray-600 mt-2">
              Deep dive into your listening patterns and discover insights about your music taste
            </p>
          </div>

          <div className="space-y-8">
            {/* Listening Trends Chart */}
            <LazyListeningTrendsChart userId={user.id} days={30} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Genre Distribution */}
              <LazyGenreDistribution userId={user.id} />
              
              {/* Top Artists (Longer Time Range) */}
              <LazyTopArtists userId={user.id} timeRange="year" limit={10} />
            </div>

            {/* Top Tracks (All Time) */}
            <LazyTopTracks userId={user.id} timeRange="all" limit={20} />
          </div>
        </div>
      </div>
    </>
  )
}
