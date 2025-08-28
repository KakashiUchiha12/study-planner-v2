import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskItem } from '@/components/tasks/task-item'

describe('TaskItem', () => {
  const defaultProps = {
    task: {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      completed: false,
      createdAt: new Date('2024-01-01'),
      dueDate: new Date('2024-12-31'),
      priority: 'high' as const,
      category: 'Study',
      estimatedTime: 60,
      tags: [],
      subject: 'Math',
      progress: 0,
      timeSpent: 0
    },
    index: 0,
    onToggle: jest.fn(),
    onUpdate: jest.fn(),
    onDelete: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onDragOver: jest.fn(),
    onDrop: jest.fn(),
    onDragEnter: jest.fn(),
    isDragging: false,
    dragOverIndex: null
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task information correctly', () => {
    render(<TaskItem {...defaultProps} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Dec 31')).toBeInTheDocument()
    expect(screen.getByText('60min')).toBeInTheDocument()
    expect(screen.getByText('Study')).toBeInTheDocument()
  })

  it('handles task completion toggle', () => {
    render(<TaskItem {...defaultProps} />)
    
    // Initially the task is not completed, so button should say "Mark as complete"
    const toggleButton = screen.getByRole('button', { name: /mark task as complete/i })
    fireEvent.click(toggleButton)
    
    expect(defaultProps.onToggle).toHaveBeenCalledWith('1')
  })

  it('shows edit dialog when edit button is clicked', () => {
    render(<TaskItem {...defaultProps} />)
    
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
  })

  it('saves task changes when save button is clicked', async () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Change title
    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } })
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('1', {
        title: 'Updated Task',
        description: 'Test Description',
        priority: 'high',
        category: 'Study',
        estimatedTime: 60
      })
    })
  })

  it('cancels edit mode when cancel button is clicked', () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Cancel edit
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(screen.queryByDisplayValue('Test Task')).not.toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog', () => {
    render(<TaskItem {...defaultProps} />)
    
    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    expect(screen.getByText('"Test Task"')).toBeInTheDocument()
  })

  it('deletes task when confirmed', () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open delete dialog
    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)
    
    expect(defaultProps.onDelete).toHaveBeenCalledWith('1')
  })

  it('cancels deletion when cancel button is clicked', () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open delete dialog
    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)
    
    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(screen.queryByText('Delete Task')).not.toBeInTheDocument()
  })

  it('handles drag and drop events', () => {
    render(<TaskItem {...defaultProps} />)
    
    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toHaveAttribute('draggable', 'true')
    
    // Test drag start
    fireEvent.dragStart(taskCard!)
    expect(defaultProps.onDragStart).toHaveBeenCalled()
    
    // Test drag end
    fireEvent.dragEnd(taskCard!)
    expect(defaultProps.onDragEnd).toHaveBeenCalled()
  })

  it('applies dragging styles when isDragging is true', () => {
    render(<TaskItem {...defaultProps} isDragging={true} />)
    
    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toHaveClass('opacity-60', 'scale-98', 'shadow-lg')
  })

  it('applies drag over styles when dragOverIndex matches', () => {
    render(<TaskItem {...defaultProps} dragOverIndex={0} />)
    
    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toHaveClass('border-primary', 'border-2')
  })

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...defaultProps.task,
      dueDate: new Date('2023-01-01'),
      completed: false
    }
    
    render(<TaskItem {...defaultProps} task={overdueTask} />)
    
    expect(screen.getByText('(Overdue)')).toBeInTheDocument()
  })

  it('shows due date when available', () => {
    render(<TaskItem {...defaultProps} />)
    
    expect(screen.getByText('Dec 31')).toBeInTheDocument()
  })

  it('shows estimated time when available', () => {
    render(<TaskItem {...defaultProps} />)
    
    expect(screen.getByText('60min')).toBeInTheDocument()
  })

  it('shows category badge when available', () => {
    render(<TaskItem {...defaultProps} />)
    
    const categoryBadge = screen.getByText('Study')
    expect(categoryBadge).toBeInTheDocument()
  })

  it('handles tasks without description', () => {
    const minimalTask = {
      ...defaultProps.task,
      description: undefined
    }
    
    render(<TaskItem {...defaultProps} task={minimalTask} />)
    
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument()
  })

  it('handles tasks without due date', () => {
    const taskWithoutDate = {
      ...defaultProps.task,
      dueDate: undefined
    }
    
    render(<TaskItem {...defaultProps} task={taskWithoutDate} />)
    
    expect(screen.queryByText('Dec 31')).not.toBeInTheDocument()
  })

  it('handles tasks without estimated time', () => {
    const taskWithoutTime = {
      ...defaultProps.task,
      estimatedTime: undefined
    }
    
    render(<TaskItem {...defaultProps} task={taskWithoutTime} />)
    
    expect(screen.queryByText('0min')).not.toBeInTheDocument()
  })

  it('handles priority changes', async () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Find priority select and change value using onValueChange
    const prioritySelect = screen.getByRole('combobox')
    
    // Simulate the Select component's onValueChange
    const selectTrigger = prioritySelect.querySelector('[data-radix-collection-item]') || prioritySelect
    fireEvent.click(selectTrigger)
    
    // Find and click the medium option
    const mediumOption = screen.getByText('🟡 Medium')
    fireEvent.click(mediumOption)
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('1', {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        category: 'Study',
        estimatedTime: 60
      })
    })
  })

  it('handles category changes', async () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Change category
    const categoryInput = screen.getByDisplayValue('Study')
    fireEvent.change(categoryInput, { target: { value: 'Assignment' } })
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('1', {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        category: 'Assignment',
        estimatedTime: 60
      })
    })
  })

  it('shows progress indicator when available', () => {
    const taskWithProgress = {
      ...defaultProps.task,
      progress: 75
    }
    
    render(<TaskItem {...defaultProps} task={taskWithProgress} />)
    
    expect(screen.getByText('75% complete')).toBeInTheDocument()
  })

  it('disables drag and drop when editing', () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Find the task card by looking for the draggable attribute
    const taskCard = screen.getByDisplayValue('Test Task').closest('[draggable]')
    expect(taskCard).toHaveAttribute('draggable', 'false')
  })

  it('handles empty title validation', async () => {
    render(<TaskItem {...defaultProps} />)
    
    // Open edit mode
    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)
    
    // Clear title
    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: '' } })
    
    // Try to save
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)
    
    // Should show validation error
    expect(screen.getByText('Title is required')).toBeInTheDocument()
  })

  it('handles button hover states', () => {
    render(<TaskItem {...defaultProps} />)
    
    const editButton = screen.getByRole('button', { name: /edit task/i })
    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    
    expect(editButton).toHaveClass('hover:bg-blue-50', 'hover:text-blue-600')
    expect(deleteButton).toHaveClass('hover:bg-red-50', 'hover:text-red-700')
  })
})
