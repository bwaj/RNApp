import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = '/og-image.png',
    url = 'https://music-tracker.app',
    type = 'website'
  } = config

  return {
    title: `${title} | Music Tracker`,
    description,
    keywords: ['music tracker', 'spotify analytics', 'listening habits', ...keywords],
    authors: [{ name: 'Music Tracker Team' }],
    creator: 'Music Tracker',
    publisher: 'Music Tracker',
    
    // Open Graph
    openGraph: {
      type,
      title: `${title} | Music Tracker`,
      description,
      url,
      siteName: 'Music Tracker',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
    },
    
    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Music Tracker`,
      description,
      images: [image],
      creator: '@musictracker',
    },
    
    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    
    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    
    // App-specific
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Music Tracker',
    },
    
    // Manifest
    manifest: '/manifest.json',
    
    // Icons
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#f59e0b' },
      ],
    },
  }
}

// Predefined metadata for common pages
export const homeMetadata = generateMetadata({
  title: 'Track Your Music Journey',
  description: 'Discover insights about your music listening habits with detailed analytics, top artists, favorite songs, and personalized recommendations.',
  keywords: ['music analytics', 'spotify dashboard', 'listening statistics', 'music discovery'],
  type: 'website'
})

export const dashboardMetadata = generateMetadata({
  title: 'Dashboard',
  description: 'View your personalized music dashboard with listening statistics, top artists, favorite tracks, and detailed analytics.',
  keywords: ['music dashboard', 'listening stats', 'top artists', 'music analytics'],
  type: 'website'
})

export const analyticsMetadata = generateMetadata({
  title: 'Music Analytics',
  description: 'Deep dive into your listening patterns with comprehensive analytics, genre distribution, listening trends, and detailed insights.',
  keywords: ['music analytics', 'listening trends', 'genre analysis', 'music insights'],
  type: 'website'
})

export const profileMetadata = generateMetadata({
  title: 'Profile Settings',
  description: 'Manage your Music Tracker profile, connected accounts, privacy settings, and personalization preferences.',
  keywords: ['profile settings', 'account management', 'privacy settings'],
  type: 'profile'
})

// JSON-LD structured data for rich snippets
export function generateStructuredData(type: 'WebApplication' | 'Organization' | 'Person', data: any) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
  }

  switch (type) {
    case 'WebApplication':
      return {
        ...baseSchema,
        name: 'Music Tracker',
        description: 'Track and analyze your music listening habits with detailed insights and beautiful visualizations.',
        url: 'https://music-tracker.app',
        applicationCategory: 'Music & Audio',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Spotify Integration',
          'Listening Analytics',
          'Music Discovery',
          'Personalized Insights',
          'Genre Analysis',
          'Listening Trends'
        ],
        screenshot: 'https://music-tracker.app/screenshots/dashboard.png',
        ...data
      }

    case 'Organization':
      return {
        ...baseSchema,
        name: 'Music Tracker',
        description: 'Helping music lovers understand and explore their listening habits.',
        url: 'https://music-tracker.app',
        logo: 'https://music-tracker.app/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          email: 'support@music-tracker.app'
        },
        ...data
      }

    case 'Person':
      return {
        ...baseSchema,
        ...data
      }

    default:
      return baseSchema
  }
}

// Breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  }
}
