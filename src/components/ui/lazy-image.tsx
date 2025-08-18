'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallback?: React.ReactNode
  placeholder?: string
  quality?: number
  priority?: boolean
  sizes?: string
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallback,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE0Ij5JbWFnZTwvdGV4dD48L3N2Zz4=',
  quality = 75,
  priority = false,
  sizes
}: LazyImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    )

    const currentRef = imgRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
      observer.disconnect()
    }
  }, [priority])

  const handleError = () => {
    setImageError(true)
  }

  const handleLoad = () => {
    setIsLoaded(true)
  }

  if (imageError) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    // Default fallback
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {isInView && (
        <>
          {/* Placeholder while loading */}
          {!isLoaded && (
            <div 
              className="absolute inset-0 bg-gray-200 animate-pulse"
              style={{
                backgroundImage: `url(${placeholder})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
          
          {/* Actual image */}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onError={handleError}
            onLoad={handleLoad}
            quality={quality}
            priority={priority}
            sizes={sizes}
            style={{
              width: width ? 'auto' : '100%',
              height: height ? 'auto' : '100%',
              objectFit: 'cover'
            }}
          />
        </>
      )}
    </div>
  )
}

// Progressive JPEG placeholder generator
export function generatePlaceholder(width: number, height: number, color = '#f4f4f4'): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${color}"/>
      <circle cx="${width/2}" cy="${height/2}" r="20" fill="#e0e0e0" opacity="0.5"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

// Hook for creating optimized image URLs
export function useOptimizedImage(src: string, options: { width?: number; height?: number; quality?: number } = {}) {
  const { width, height, quality = 75 } = options
  
  // If it's a Spotify image, we can use their CDN optimization
  if (src.includes('i.scdn.co') || src.includes('mosaic.scdn.co')) {
    const url = new URL(src)
    
    // Spotify supports width and height parameters
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    
    return url.toString()
  }
  
  // For other images, return as-is (Next.js Image component will handle optimization)
  return src
}
