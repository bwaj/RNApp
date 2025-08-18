// Performance monitoring and metrics collection

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url?: string
  userId?: string
  metadata?: Record<string, any>
}

interface WebVital {
  name: 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  id: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isEnabled: boolean

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    
    if (this.isEnabled) {
      this.initializeWebVitals()
      this.initializeNavigationTiming()
      this.initializeResourceTiming()
    }
  }

  /**
   * Record a custom performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata
    }

    this.metrics.push(metric)
    
    // In production, send to analytics service
    if (this.isEnabled) {
      this.sendToAnalytics(metric)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${name} = ${value}ms`, metadata)
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(operation: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric(`db.${operation}`, duration, {
      type: 'database',
      operation,
      ...metadata
    })
  }

  /**
   * Record API request performance
   */
  recordAPIRequest(endpoint: string, duration: number, status: number, metadata?: Record<string, any>) {
    this.recordMetric(`api.${endpoint}`, duration, {
      type: 'api',
      endpoint,
      status,
      ...metadata
    })
  }

  /**
   * Record component render performance
   */
  recordComponentRender(componentName: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric(`component.${componentName}`, duration, {
      type: 'component',
      component: componentName,
      ...metadata
    })
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals() {
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
      getCLS(this.handleWebVital.bind(this))
      getFCP(this.handleWebVital.bind(this))
      getFID(this.handleWebVital.bind(this))
      getLCP(this.handleWebVital.bind(this))
      getTTFB(this.handleWebVital.bind(this))
    }).catch(() => {
      // Graceful fallback if web-vitals is not available
      console.warn('Web Vitals not available')
    })
  }

  /**
   * Handle Web Vital metric
   */
  private handleWebVital(vital: WebVital) {
    this.recordMetric(`web-vital.${vital.name}`, vital.value, {
      type: 'web-vital',
      rating: vital.rating,
      id: vital.id
    })
  }

  /**
   * Initialize Navigation Timing monitoring
   */
  private initializeNavigationTiming() {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navTiming) {
          this.recordMetric('navigation.domContentLoaded', navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart)
          this.recordMetric('navigation.loadComplete', navTiming.loadEventEnd - navTiming.loadEventStart)
          this.recordMetric('navigation.responseTime', navTiming.responseEnd - navTiming.requestStart)
          this.recordMetric('navigation.domInteractive', navTiming.domInteractive - navTiming.navigationStart)
        }
      }, 0)
    })
  }

  /**
   * Initialize Resource Timing monitoring
   */
  private initializeResourceTiming() {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return

    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          
          // Track slow resources
          if (resourceEntry.duration > 1000) { // > 1 second
            this.recordMetric('resource.slow', resourceEntry.duration, {
              type: 'resource',
              name: resourceEntry.name,
              size: resourceEntry.transferSize,
              cached: resourceEntry.transferSize === 0
            })
          }

          // Track large resources
          if (resourceEntry.transferSize > 500000) { // > 500KB
            this.recordMetric('resource.large', resourceEntry.transferSize, {
              type: 'resource',
              name: resourceEntry.name,
              duration: resourceEntry.duration
            })
          }
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['resource'] })
    } catch {
      // Observer not supported
    }
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric) {
    // In production, you would send to your analytics service
    // Example implementations:
    
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_map: {
          metric_type: metric.metadata?.type || 'custom'
        }
      })
    }

    // Sentry Performance
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.name}: ${metric.value}ms`,
        level: 'info',
        data: metric.metadata
      })
    }

    // Custom endpoint
    if (this.isEnabled) {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      }).catch(() => {
        // Silently fail to avoid affecting user experience
      })
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      averageByType: {} as Record<string, number>,
      slowestOperations: this.metrics
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    }

    // Calculate averages by type
    const metricsByType = this.metrics.reduce((acc, metric) => {
      const type = metric.metadata?.type || 'custom'
      if (!acc[type]) acc[type] = []
      acc[type].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    for (const [type, values] of Object.entries(metricsByType)) {
      summary.averageByType[type] = values.reduce((sum, val) => sum + val, 0) / values.length
    }

    return summary
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics() {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Performance timing decorator for functions
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  metadata?: Record<string, any>
): T {
  return ((...args: any[]) => {
    const start = performance.now()
    
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          performanceMonitor.recordMetric(name, duration, metadata)
        })
      }
      
      // Handle sync functions
      const duration = performance.now() - start
      performanceMonitor.recordMetric(name, duration, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      performanceMonitor.recordMetric(name, duration, { ...metadata, error: true })
      throw error
    }
  }) as T
}

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now()
  
  return {
    recordRender: (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime
      performanceMonitor.recordComponentRender(componentName, duration, metadata)
    }
  }
}
