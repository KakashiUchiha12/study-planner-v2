import { test, expect } from '@playwright/test'

test.describe('Calendar Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to timetable page before each test
    await page.goto('/timetable')
  })

  test('should load timetable page successfully', async ({ page }) => {
    // Basic page load test
    await expect(page.locator('body')).toBeVisible()
    
    // Check for main heading
    const heading = page.getByRole('heading', { name: /study timetable/i })
    await expect(heading).toBeVisible()
  })

  test('should display calendar component', async ({ page }) => {
    // Check if React Big Calendar is rendered
    const calendar = page.locator('.rbc-calendar')
    await expect(calendar).toBeVisible()
    
    // Calendar should have some content
    await expect(calendar).not.toBeEmpty()
  })

  test('should show navigation elements', async ({ page }) => {
    // Check for back to dashboard button
    const backButton = page.getByRole('button', { name: /back to dashboard/i })
    await expect(backButton).toBeVisible()
    
    // Check for some form of navigation (buttons or links)
    const navigationElements = page.locator('button, a')
    await expect(navigationElements.first()).toBeVisible()
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.rbc-calendar')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(page.locator('.rbc-calendar')).toBeVisible()
  })

  test('should display event templates on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 })
    
    // Look for event templates section
    const templatesSection = page.locator('text=/event templates/i')
    await expect(templatesSection).toBeVisible()
  })

  test('should hide event templates on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Event templates should be hidden on mobile
    const templatesSection = page.locator('text=/event templates/i')
    await expect(templatesSection).not.toBeVisible()
  })

  test('should show calendar grid structure', async ({ page }) => {
    // Check for calendar grid elements
    const calendarGrid = page.locator('.rbc-calendar')
    await expect(calendarGrid).toBeVisible()
    
    // Should have some calendar content
    const calendarContent = page.locator('.rbc-month-view, .rbc-time-view, .rbc-agenda-view')
    await expect(calendarContent.first()).toBeVisible()
  })

  test('should handle page refresh', async ({ page }) => {
    // Refresh the page
    await page.reload()
    
    // Calendar should still be visible
    await expect(page.locator('.rbc-calendar')).toBeVisible()
  })

  test('should not show error messages', async ({ page }) => {
    // Should not show error messages or crash
    const errorMessages = page.locator('text=/error/i, text=/failed/i, text=/crash/i')
    
    // If error messages exist, they should not be visible
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).not.toBeVisible()
    }
  })

  test('should maintain calendar state on navigation', async ({ page }) => {
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/timetable')
    
    // Calendar should still be visible
    await expect(page.locator('.rbc-calendar')).toBeVisible()
  })
})
