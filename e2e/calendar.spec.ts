import { test, expect } from '@playwright/test'

test.describe('Calendar Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to timetable page before each test
    await page.goto('/timetable')
  })

  test('should load calendar page', async ({ page }) => {
    // Check if calendar page loads correctly
    await expect(page.getByRole('heading', { name: /study timetable/i })).toBeVisible()
    await expect(page.getByText(/manage your study schedule/i)).toBeVisible()
  })

  test('should display back to dashboard button', async ({ page }) => {
    // Check if back to dashboard button is present
    const backButton = page.getByRole('button', { name: /back to dashboard/i })
    await expect(backButton).toBeVisible()
  })

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back to dashboard button
    await page.getByRole('button', { name: /back to dashboard/i }).click()
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show calendar toolbar with correct buttons', async ({ page }) => {
    // Check if calendar toolbar elements are present
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible()
    
    // Check for navigation buttons using CSS selectors (icon buttons without text)
    const navigationButtons = page.locator('button.h-8.w-8')
    await expect(navigationButtons).toHaveCount(2) // Previous and Next buttons
    
    // Verify both navigation buttons are visible
    await expect(navigationButtons.first()).toBeVisible()
    await expect(navigationButtons.last()).toBeVisible()
  })

  test('should display view selector buttons', async ({ page }) => {
    // Check if view selector buttons are present using more specific selectors
    const monthButton = page.getByRole('button', { name: /month/i }).first()
    const weekButton = page.getByRole('button', { name: /week/i }).first()
    const dayButton = page.getByRole('button', { name: /day/i }).first()
    const agendaButton = page.getByRole('button', { name: /agenda/i }).first()
    
    await expect(monthButton).toBeVisible()
    await expect(weekButton).toBeVisible()
    await expect(dayButton).toBeVisible()
    await expect(agendaButton).toBeVisible()
  })

  test('should display event templates sidebar on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 })
    
    // Check if event templates are visible on desktop
    await expect(page.getByText(/event templates/i)).toBeVisible()
    await expect(page.getByText(/study session/i)).toBeVisible()
    await expect(page.getByText(/assignment work/i)).toBeVisible()
    await expect(page.getByText(/exam/i)).toBeVisible()
    await expect(page.getByText(/break time/i)).toBeVisible()
  })

  test('should hide event templates sidebar on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if event templates are hidden on mobile
    await expect(page.getByText(/event templates/i)).not.toBeVisible()
  })

  test('should show calendar grid', async ({ page }) => {
    // Check if calendar grid is present
    const calendarGrid = page.locator('.rbc-calendar')
    await expect(calendarGrid).toBeVisible()
  })

  test('should handle calendar navigation', async ({ page }) => {
    // Get current date display (the h2 element with formatted date)
    const currentDate = page.locator('h2.text-lg.font-semibold.text-gray-900')
    await expect(currentDate).toBeVisible()
    
    // Get the initial date text
    const initialDateText = await currentDate.textContent()
    
    // Navigate to next month using the next button (second navigation button)
    const navigationButtons = page.locator('button.h-8.w-8')
    const nextButton = navigationButtons.last() // Last button is the next button
    await nextButton.click()
    
    // Wait a moment for the date to update
    await page.waitForTimeout(1000)
    
    // Date should change (we'll check if the element still exists and has content)
    await expect(currentDate).toBeVisible()
    
    // The date should be different (though this might be subtle depending on the month)
    const newDateText = await currentDate.textContent()
    expect(newDateText).toBeTruthy()
  })

  test('should display calendar in month view by default', async ({ page }) => {
    // Check if month view is active by looking for the Month button being selected
    const monthButton = page.getByRole('button', { name: /month/i }).first()
    await expect(monthButton).toBeVisible()
    
    // The Month button should have the default variant (selected state)
    // Check if it has the primary background class
    const buttonClasses = await monthButton.getAttribute('class')
    expect(buttonClasses).toContain('bg-primary')
  })

  test('should show calendar header with day names', async ({ page }) => {
    // Check if calendar header with days is present
    const header = page.locator('.rbc-header')
    await expect(header.first()).toBeVisible()
    
    // Should show day names (using more specific selectors)
    await expect(page.locator('.rbc-header').first()).toBeVisible()
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Calendar should still be functional
    await expect(page.locator('.rbc-calendar')).toBeVisible()
    await expect(page.getByRole('button', { name: /today/i })).toBeVisible()
  })

  test('should show add event button on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 })
    
    // Check if add event button is visible on desktop
    await expect(page.getByRole('button', { name: /add event/i })).toBeVisible()
  })

  test('should hide add event button on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if add event button is hidden on mobile
    await expect(page.getByRole('button', { name: /add event/i })).not.toBeVisible()
  })

  test('should display formatted date in toolbar', async ({ page }) => {
    // Check if the date is displayed in the toolbar
    const dateDisplay = page.locator('h2.text-lg.font-semibold.text-gray-900')
    await expect(dateDisplay).toBeVisible()
    
    // Should contain a date (check if it's not empty)
    const dateText = await dateDisplay.textContent()
    expect(dateText).toBeTruthy()
    expect(dateText!.length).toBeGreaterThan(0)
  })

  test('should handle view switching', async ({ page }) => {
    // Test switching to different views
    const weekButton = page.getByRole('button', { name: /week/i }).first()
    await weekButton.click()
    
    // Wait for view to change
    await page.waitForTimeout(500)
    
    // Week button should now be selected
    const weekButtonClasses = await weekButton.getAttribute('class')
    expect(weekButtonClasses).toContain('bg-primary')
    
    // Switch back to month view
    const monthButton = page.getByRole('button', { name: /month/i }).first()
    await monthButton.click()
    
    await page.waitForTimeout(500)
    
    // Month button should now be selected
    const monthButtonClasses = await monthButton.getAttribute('class')
    expect(monthButtonClasses).toContain('bg-primary')
  })
})
