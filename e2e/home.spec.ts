import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /track your music journey/i })).toBeVisible()
    
    // Check description
    await expect(page.getByText(/connect your spotify account and discover insights/i)).toBeVisible()
    
    // Check CTA button
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
    
    // Check features section
    await expect(page.getByRole('heading', { name: /discover your music patterns/i })).toBeVisible()
    
    // Check feature cards
    await expect(page.getByText(/top artists & songs/i)).toBeVisible()
    await expect(page.getByText(/listening analytics/i)).toBeVisible()
    await expect(page.getByText(/history tracking/i)).toBeVisible()
  })

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/')
    
    // Click get started button
    await page.getByRole('link', { name: /get started/i }).click()
    
    // Should navigate to sign in page
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that content is visible and properly formatted
    await expect(page.getByRole('heading', { name: /track your music journey/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible()
    
    // Check that navigation is properly hidden/collapsed on mobile
    const nav = page.locator('nav')
    if (await nav.isVisible()) {
      await expect(nav).toHaveClass(/hidden|md:flex/)
    }
  })

  test('should have proper accessibility features', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    const h2 = page.getByRole('heading', { level: 2 })
    await expect(h2).toBeVisible()
    
    // Check for alt text on images (if any)
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      await expect(img).toHaveAttribute('alt')
    }
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should load quickly (performance)', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for main content to be visible
    await expect(page.getByRole('heading', { name: /track your music journey/i })).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds (reasonable for development)
    expect(loadTime).toBeLessThan(3000)
  })
})
