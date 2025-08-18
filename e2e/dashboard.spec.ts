import { test, expect } from '@playwright/test'

// Mock authentication for testing dashboard
test.describe('Dashboard (Mocked Auth)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication session
    await page.addInitScript(() => {
      // Mock NextAuth session
      window.localStorage.setItem('nextauth.message', JSON.stringify({
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com'
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }))
    })

    // Mock API responses
    await page.route('**/api/dashboard/stats**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalTracks: 1250,
          totalListeningTime: 7200000,
          totalArtists: 89,
          totalListeningEvents: 2340,
          averageTrackLength: 180000
        })
      })
    })

    await page.route('**/api/dashboard/top-artists**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            artist: {
              id: 'artist1',
              name: 'The Beatles',
              imageUrl: 'https://example.com/beatles.jpg',
              genres: ['rock', 'pop'],
              spotifyId: 'spotify1'
            },
            playCount: 150,
            totalListeningTime: 9000000
          }
        ])
      })
    })

    await page.route('**/api/dashboard/top-tracks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            track: {
              id: 'track1',
              name: 'Yesterday',
              spotifyId: 'spotify1',
              durationMs: 180000,
              popularity: 85,
              previewUrl: null
            },
            artist: {
              id: 'artist1',
              name: 'The Beatles',
              imageUrl: 'https://example.com/beatles.jpg'
            },
            album: {
              id: 'album1',
              name: 'Help!',
              imageUrl: 'https://example.com/help.jpg'
            },
            playCount: 75,
            lastPlayed: new Date().toISOString()
          }
        ])
      })
    })

    await page.route('**/api/dashboard/recent-tracks**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'history1',
            playedAt: new Date().toISOString(),
            track: {
              id: 'track1',
              name: 'Yesterday',
              spotifyId: 'spotify1',
              durationMs: 180000,
              previewUrl: null
            },
            artist: {
              id: 'artist1',
              name: 'The Beatles',
              imageUrl: 'https://example.com/beatles.jpg'
            },
            album: {
              id: 'album1',
              name: 'Help!',
              imageUrl: 'https://example.com/help.jpg'
            }
          }
        ])
      })
    })
  })

  test('should display dashboard with user data', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check page title and welcome message
    await expect(page.getByRole('heading', { name: /welcome back, test user/i })).toBeVisible()
    
    // Check Spotify connection card
    await expect(page.getByText(/spotify connection/i)).toBeVisible()
    
    // Wait for stats to load and check stats cards
    await expect(page.getByText(/1.3k/i)).toBeVisible() // Total tracks formatted
    await expect(page.getByText(/2h 0m/i)).toBeVisible() // Listening time formatted
    await expect(page.getByText(/89/i)).toBeVisible() // Total artists
    
    // Check top artists section
    await expect(page.getByText(/top artists/i)).toBeVisible()
    await expect(page.getByText(/the beatles/i)).toBeVisible()
    
    // Check top tracks section
    await expect(page.getByText(/top tracks/i)).toBeVisible()
    await expect(page.getByText(/yesterday/i)).toBeVisible()
    
    // Check recent tracks section
    await expect(page.getByText(/recent tracks/i)).toBeVisible()
  })

  test('should handle loading states', async ({ page }) => {
    // Delay API responses to test loading states
    await page.route('**/api/dashboard/stats**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalTracks: 1250,
          totalListeningTime: 7200000,
          totalArtists: 89,
          totalListeningEvents: 2340,
          averageTrackLength: 180000
        })
      })
    })

    await page.goto('/dashboard')
    
    // Should show loading skeletons initially
    await expect(page.locator('.animate-pulse')).toBeVisible()
    
    // After loading, should show actual data
    await expect(page.getByText(/1.3k/i)).toBeVisible({ timeout: 5000 })
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/stats**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.goto('/dashboard')
    
    // Should show error message
    await expect(page.getByText(/failed to load/i)).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    // Check that main content is visible
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    
    // Check that cards stack properly on mobile
    const statsCards = page.locator('[data-testid="stats-card"]')
    if (await statsCards.count() > 0) {
      // Cards should be stacked vertically on mobile
      const firstCard = statsCards.first()
      const secondCard = statsCards.nth(1)
      
      if (await secondCard.isVisible()) {
        const firstCardBox = await firstCard.boundingBox()
        const secondCardBox = await secondCard.boundingBox()
        
        if (firstCardBox && secondCardBox) {
          // Second card should be below first card on mobile
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10)
        }
      }
    }
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check skip navigation link
    await page.keyboard.press('Tab')
    const skipLink = page.getByText(/skip to main content/i)
    await expect(skipLink).toBeFocused()
    
    // Test skip link functionality
    await skipLink.click()
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeFocused()
    
    // Check that main content has proper heading structure
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
  })

  test('should navigate between sections', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Check navigation links in header
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible()
    
    // Navigate to analytics
    await page.getByRole('link', { name: /analytics/i }).click()
    await expect(page).toHaveURL('/analytics')
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })
})
