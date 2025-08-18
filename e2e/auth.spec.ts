import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show sign in page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check sign in page elements
    await expect(page.getByRole('heading', { name: /sign in to music tracker/i })).toBeVisible()
    await expect(page.getByText(/connect your spotify account/i)).toBeVisible()
    
    // Check Google sign in button
    const googleSignInButton = page.getByRole('button', { name: /sign in with google/i })
    await expect(googleSignInButton).toBeVisible()
    await expect(googleSignInButton).toBeEnabled()
  })

  test('should handle authentication errors', async ({ page }) => {
    await page.goto('/auth/error?error=Configuration')
    
    // Check error page elements
    await expect(page.getByRole('heading', { name: /authentication error/i })).toBeVisible()
    await expect(page.getByText(/there was a problem/i)).toBeVisible()
    
    // Check return to sign in link
    await expect(page.getByRole('link', { name: /try again/i })).toBeVisible()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to sign in page
    await page.waitForURL('/auth/signin')
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should redirect unauthenticated users from analytics page', async ({ page }) => {
    await page.goto('/analytics')
    
    // Should redirect to sign in page
    await page.waitForURL('/auth/signin')
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should redirect unauthenticated users from profile page', async ({ page }) => {
    await page.goto('/profile')
    
    // Should redirect to sign in page
    await page.waitForURL('/auth/signin')
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should have accessible sign in form', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check for proper ARIA labels and roles
    const signInButton = page.getByRole('button', { name: /sign in with google/i })
    await expect(signInButton).toBeVisible()
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Check that the page has a proper title
    await expect(page).toHaveTitle(/sign in/i)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline scenario
    await page.route('**/*', route => route.abort())
    
    await page.goto('/auth/signin')
    
    // Page should still load basic content (cached/static)
    // Even if some dynamic content fails
    await expect(page.getByRole('heading', { name: /sign in to music tracker/i })).toBeVisible()
  })
})
