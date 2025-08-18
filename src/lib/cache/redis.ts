// Redis caching utilities for performance optimization
// Note: This is a development setup. In production, use a proper Redis instance.

interface CacheItem {
  data: any
  timestamp: number
  ttl: number
}

class InMemoryCache {
  private cache = new Map<string, CacheItem>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  set(key: string, data: any, ttlSeconds = 300): void {
    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    }
    this.cache.set(key, item)
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clear()
  }
}

// Global cache instance
const cache = new InMemoryCache()

export class CacheService {
  /**
   * Cache user statistics with 5 minute TTL
   */
  static async getUserStats(userId: string, fetcher: () => Promise<any>) {
    const cacheKey = `user_stats:${userId}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 300) // 5 minutes
    return data
  }

  /**
   * Cache top artists with 10 minute TTL
   */
  static async getTopArtists(userId: string, timeRange: string, limit: number, fetcher: () => Promise<any>) {
    const cacheKey = `top_artists:${userId}:${timeRange}:${limit}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 600) // 10 minutes
    return data
  }

  /**
   * Cache top tracks with 10 minute TTL
   */
  static async getTopTracks(userId: string, timeRange: string, limit: number, fetcher: () => Promise<any>) {
    const cacheKey = `top_tracks:${userId}:${timeRange}:${limit}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 600) // 10 minutes
    return data
  }

  /**
   * Cache recent tracks with 2 minute TTL (more frequent updates)
   */
  static async getRecentTracks(userId: string, limit: number, offset: number, fetcher: () => Promise<any>) {
    const cacheKey = `recent_tracks:${userId}:${limit}:${offset}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 120) // 2 minutes
    return data
  }

  /**
   * Cache listening trends with 15 minute TTL
   */
  static async getListeningTrends(userId: string, days: number, fetcher: () => Promise<any>) {
    const cacheKey = `listening_trends:${userId}:${days}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 900) // 15 minutes
    return data
  }

  /**
   * Cache genre distribution with 30 minute TTL
   */
  static async getGenreDistribution(userId: string, fetcher: () => Promise<any>) {
    const cacheKey = `genre_distribution:${userId}`
    const cached = cache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const data = await fetcher()
    cache.set(cacheKey, data, 1800) // 30 minutes
    return data
  }

  /**
   * Invalidate all cache entries for a user
   */
  static invalidateUserCache(userId: string) {
    const keysToDelete = []
    for (const [key] of (cache as any).cache.entries()) {
      if (key.includes(userId)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => cache.delete(key))
  }

  /**
   * Clear all cache
   */
  static clearAll() {
    cache.clear()
  }
}

// Cleanup on process exit
process.on('SIGINT', () => {
  cache.destroy()
})

process.on('SIGTERM', () => {
  cache.destroy()
})
