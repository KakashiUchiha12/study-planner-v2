import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/dashboard')
  })

  test('should display dashboard elements correctly', async ({ page }) => {
    // Check if main dashboard elements are visible
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByText(/study time today/i)).toBeVisible()
    await expect(page.getByText(/daily goal/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /start studying/i })).toBeVisible()
  })

  test('should show study time statistics', async ({ page }) => {
    // Check if study time stats are displayed
    await expect(page.getByText(/hours/i)).toBeVisible()
    await expect(page.getByText(/minutes/i)).toBeVisible()
    await expect(page.getByText(/progress/i)).toBeVisible()
  })

  test('should display quick action buttons', async ({ page }) => {
    // Check if quick action buttons are present
    await expect(page.getByRole('button', { name: /subjects/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /study sessions/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /test results/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /profile/i })).toBeVisible()
  })

  test('should show expandable sections', async ({ page }) => {
    // Check if expandable sections are present
    await expect(page.getByText(/tasks/i)).toBeVisible()
    await expect(page.getByText(/study progress/i)).toBeVisible()
    await expect(page.getByText(/subjects overview/i)).toBeVisible()
  })

  test('should expand and collapse sections', async ({ page }) => {
    // Test expanding a section
    const tasksSection = page.getByText(/tasks/i).first()
    await tasksSection.click()
    
    // Should show tasks content
    await expect(page.getByText(/drag and drop tasks/i)).toBeVisible()
    
    // Test collapsing the section
    await tasksSection.click()
    
    // Should hide tasks content
    await expect(page.getByText(/drag and drop tasks/i)).not.toBeVisible()
  })

  test('should display settings button in header', async ({ page }) => {
    // Check if settings button is present in header
    const settingsButton = page.getByRole('button', { name: /settings/i })
    await expect(settingsButton).toBeVisible()
  })

  test('should navigate to settings page', async ({ page }) => {
    // Click settings button
    await page.getByRole('button', { name: /settings/i }).click()
    
    // Should navigate to settings page
    await expect(page).toHaveURL('/settings')
  })

  test('should show theme toggle button', async ({ page }) => {
    // Check if theme toggle is present
    const themeToggle = page.getByRole('button', { name: /toggle theme/i })
    await expect(themeToggle).toBeVisible()
  })

  test('should display notification center', async ({ page }) => {
    // Check if notification center is present
    const notificationButton = page.getByRole('button', { name: /notifications/i })
    await expect(notificationButton).toBeVisible()
  })

  test('should show search functionality', async ({ page }) => {
    // Check if search input is present
    const searchInput = page.getByPlaceholder(/search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should display user profile information', async ({ page }) => {
    // Check if user info is displayed
    await expect(page.getByText(/test user/i)).toBeVisible()
    await expect(page.getByText(/computer science/i)).toBeVisible()
  })

  test('should show logout button', async ({ page }) => {
    // Check if logout button is present
    const logoutButton = page.getByRole('button', { name: /logout/i })
    await expect(logoutButton).toBeVisible()
  })

  test('should handle mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be functional on mobile
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /start studying/i })).toBeVisible()
  })

  test('should display urgent tasks section', async ({ page }) => {
    // Check if urgent tasks section is present
    await expect(page.getByText(/urgent tasks/i)).toBeVisible()
  })

  test('should show performance overview', async ({ page }) => {
    // Check if performance metrics are displayed
    await expect(page.getByText(/performance overview/i)).toBeVisible()
  })

  test('should display study time analysis', async ({ page }) => {
    // Check if study time analysis section is present
    await expect(page.getByText(/study time analysis/i)).toBeVisible()
  })

  test('should show subjects overview', async ({ page }) => {
    // Check if subjects overview is displayed
    await expect(page.getByText(/subjects overview/i)).toBeVisible()
  })

  test('should handle back to top functionality', async ({ page }) => {
    // Scroll down to trigger back to top button
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Check if back to top button appears on mobile
    const backToTopButton = page.getByRole('button', { name: /back to top/i })
    
    // On mobile, should be visible
    if (page.viewportSize()!.width <= 768) {
      await expect(backToTopButton).toBeVisible()
    }
  })

  test('should display study timer component', async ({ page }) => {
    // Check if study timer is present
    await expect(page.getByText(/study timer/i)).toBeVisible()
  })

  test('should show task management functionality', async ({ page }) => {
    // Expand tasks section
    await page.getByText(/tasks/i).first().click()
    
    // Check if task management elements are present
    await expect(page.getByText(/add task/i)).toBeVisible()
    await expect(page.getByPlaceholder(/search tasks/i)).toBeVisible()
  })

  test('should handle task creation', async ({ page }) => {
    // Expand tasks section
    await page.getByText(/tasks/i).first().click()
    
    // Click add task button
    await page.getByRole('button', { name: /add task/i }).click()
    
    // Should show task creation form
    await expect(page.getByText(/create new task/i)).toBeVisible()
  })

  test('should display task statistics', async ({ page }) => {
    // Expand tasks section
    await page.getByText(/tasks/i).first().click()
    
    // Check if task stats are shown
    await expect(page.getByText(/pending/i)).toBeVisible()
    await expect(page.getByText(/completed/i)).toBeVisible()
    await expect(page.getByText(/overdue/i)).toBeVisible()
  })

  test('should show study goal progress', async ({ page }) => {
    // Check if study goal progress is displayed
    await expect(page.getByText(/daily goal/i)).toBeVisible()
    
    // Should show progress bar
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()
  })

  test('should handle navigation between sections', async ({ page }) => {
    // Test navigating to different sections
    await page.getByRole('button', { name: /subjects/i }).click()
    await expect(page).toHaveURL('/subjects')
    
    // Go back to dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display proper loading states', async ({ page }) => {
    // Dashboard should load without showing loading spinners indefinitely
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Should not show loading indicators after initial load
    const loadingSpinners = page.locator('[data-testid="loading"]')
    await expect(loadingSpinners).toHaveCount(0)
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Dashboard should not crash if there are errors
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Should not show error messages for normal operation
    const errorMessages = page.locator('[data-testid="error"]')
    await expect(errorMessages).toHaveCount(0)
  })

  test('should maintain state during navigation', async ({ page }) => {
    // Expand a section
    await page.getByText(/tasks/i).first().click()
    
    // Navigate away and back
    await page.goto('/subjects')
    await page.goto('/dashboard')
    
    // Section should maintain its expanded state or be in a consistent state
    await expect(page.getByText(/tasks/i)).toBeVisible()
  })

  test('should display proper accessibility elements', async ({ page }) => {
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    // Check if all expected headings are present
    await expect(headings).toHaveCount(3)
    
    // Check for proper button labels
    const buttons = page.locator('button')
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus should be manageable
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Should not lose focus unexpectedly
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
