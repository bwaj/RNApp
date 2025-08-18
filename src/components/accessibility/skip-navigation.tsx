'use client'

export default function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-orange-600 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

// Focus management hook for accessibility
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
    }
  }

  const focusFirstError = () => {
    const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement
    if (firstError) {
      firstError.focus()
    }
  }

  const announceLiveRegion = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Create or update live region for screen readers
    let liveRegion = document.getElementById('live-region')
    
    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = 'live-region'
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }
    
    liveRegion.textContent = message
    
    // Clear the message after a delay to allow for re-announcements
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = ''
      }
    }, 1000)
  }

  return {
    focusElement,
    focusFirstError,
    announceLiveRegion
  }
}
