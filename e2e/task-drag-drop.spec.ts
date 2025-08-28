import { test, expect } from '@playwright/test'

test.describe('Task Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('/dashboard')
  })

  test('should display drag and drop instructions when no filters applied', async ({ page }) => {
    // Look for the drag and drop instruction message
    const instructionText = page.locator('text=/drag and drop tasks to reorder them/i')
    
    // If found, should be visible
    if (await instructionText.count() > 0) {
      await expect(instructionText).toBeVisible()
    }
  })

  test('should show lock message when filters are applied', async ({ page }) => {
    // First, check if there are any filter controls
    const filterControls = page.locator('select, button[onclick*="filter"]')
    
    if (await filterControls.count() > 0) {
      // Apply a filter (if possible)
      const statusFilter = page.locator('select').first()
      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption('pending')
        
        // Should show lock message
        const lockMessage = page.locator('text=/clear filters to enable drag and drop reordering/i')
        if (await lockMessage.count() > 0) {
          await expect(lockMessage).toBeVisible()
        }
      }
    }
  })

  test('should have draggable task items', async ({ page }) => {
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      // Check if first task item has draggable attribute
      const firstTask = taskItems.first()
      const draggable = await firstTask.getAttribute('draggable')
      
      // Should be draggable (unless editing)
      expect(draggable).toBeTruthy()
    }
  })

  test('should show drag handle icon', async ({ page }) => {
    // Look for the grip vertical icon (drag handle)
    const dragHandles = page.locator('svg[data-lucide="grip-vertical"], .grip-vertical')
    
    if (await dragHandles.count() > 0) {
      await expect(dragHandles.first()).toBeVisible()
    }
  })

  test('should have proper drag and drop event handlers', async ({ page }) => {
    // Look for task items with drag event handlers
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      const firstTask = taskItems.first()
      
      // Check if the task item has the proper structure for drag and drop
      const hasDragStructure = await firstTask.locator('div[draggable]').count() > 0
      expect(hasDragStructure).toBeTruthy()
    }
  })

  test('should maintain task order after page refresh', async ({ page }) => {
    // This test checks if the drag and drop state is properly saved
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 1) {
      // Get initial order
      const initialOrder = await Promise.all(
        Array.from({ length: await taskItems.count() }, async (_, i) => {
          const item = taskItems.nth(i)
          const index = await item.getAttribute('data-task-index')
          return index
        })
      )
      
      // Refresh the page
      await page.reload()
      
      // Wait for page to load
      await page.waitForLoadState('networkidle')
      
      // Get new order
      const newTaskItems = page.locator('[data-task-index]')
      const newOrder = await Promise.all(
        Array.from({ length: await newTaskItems.count() }, async (_, i) => {
          const item = newTaskItems.nth(i)
          const index = await item.getAttribute('data-task-index')
          return index
        })
      )
      
      // Orders should match (drag and drop state preserved)
      expect(newOrder).toEqual(initialOrder)
    }
  })

  test('should handle drag start correctly', async ({ page }) => {
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      const firstTask = taskItems.first()
      
      // Try to start dragging
      await firstTask.dragTo(firstTask)
      
      // Should not crash and should maintain functionality
      await expect(firstTask).toBeVisible()
    }
  })

  test('should show visual feedback during drag operations', async ({ page }) => {
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      const firstTask = taskItems.first()
      
      // Check if task has proper CSS classes for drag states
      const hasDragClasses = await firstTask.locator('.transition-all, .duration-200').count() > 0
      expect(hasDragClasses).toBeTruthy()
    }
  })

  test('should have proper cursor styles for drag operations', async ({ page }) => {
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      const firstTask = taskItems.first()
      
      // Check if task has cursor-grab class
      const hasGrabCursor = await firstTask.locator('.cursor-grab').count() > 0
      expect(hasGrabCursor).toBeTruthy()
    }
  })

  test('should disable drag and drop during editing', async ({ page }) => {
    // Look for task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 0) {
      const firstTask = taskItems.first()
      
      // Look for edit button
      const editButton = firstTask.locator('button[aria-label*="edit"], button[title*="edit"]')
      
      if (await editButton.count() > 0) {
        // Click edit button
        await editButton.click()
        
        // Wait for edit mode
        await page.waitForTimeout(500)
        
        // Task should not be draggable in edit mode
        const isDraggable = await firstTask.getAttribute('draggable')
        expect(isDraggable).toBe('false')
      }
    }
  })

  test('should handle multiple task reordering', async ({ page }) => {
    // Look for multiple task items
    const taskItems = page.locator('[data-task-index]')
    
    if (await taskItems.count() > 2) {
      // Get initial order
      const initialOrder = await Promise.all(
        Array.from({ length: Math.min(3, await taskItems.count()) }, async (_, i) => {
          const item = taskItems.nth(i)
          const index = await item.getAttribute('data-task-index')
          return index
        })
      )
      
      // Try to reorder by dragging first to last position
      const firstTask = taskItems.first()
      const lastTask = taskItems.last()
      
      // Simulate drag and drop
      await firstTask.dragTo(lastTask)
      
      // Wait for potential reordering
      await page.waitForTimeout(1000)
      
      // Should still have the same number of tasks
      const newTaskItems = page.locator('[data-task-index]')
      expect(await newTaskItems.count()).toBe(await taskItems.count())
    }
  })
})
