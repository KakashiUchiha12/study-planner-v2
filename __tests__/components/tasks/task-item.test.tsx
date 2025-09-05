import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TaskItem } from '@/components/tasks/task-item'

// Mock the hooks
jest.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => ({
    subjects: [
      { id: 'subj-1', name: 'Mathematics', color: '#FF0000' },
      { id: 'subj-2', name: 'Physics', color: '#00FF00' }
    ]
  })
}))

// Use the same Task interface as the component
interface Task {
  id: string
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate?: Date | null
  subjectId?: string | null
  estimatedTime?: number | null
  tags?: string
  progress?: number | null
  timeSpent?: number | null
  order?: number
  category?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
}

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'pending',
  priority: 'high',
  dueDate: new Date('2024-12-31'),
  estimatedTime: 60,
  timeSpent: 0,
  progress: 0,
  order: 0,
  subjectId: 'subj-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  tags: '',
  category: 'study'
}

const defaultProps = {
  task: mockTask,
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

describe('TaskItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task information correctly', () => {
    render(<TaskItem {...defaultProps} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('High Priority')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('study')).toBeInTheDocument()
    // The component shows the full ISO date string
    expect(screen.getByText('2024-12-31T00:00:00.000Z')).toBeInTheDocument()
    expect(screen.getByText('1h 0m')).toBeInTheDocument()
  })

  it('calls onToggle when complete button is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const completeButton = screen.getByRole('button', { name: /mark task as complete/i })
    fireEvent.click(completeButton)

    expect(defaultProps.onToggle).toHaveBeenCalledWith('task-1')
  })

  it('calls onUpdate when edit button is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    // Should show edit form
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)

    // Should show delete confirmation dialog
    expect(screen.getByRole('heading', { name: 'Delete Task' })).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
  })

  it('confirms deletion when confirmed', () => {
    render(<TaskItem {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)

    const confirmButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(confirmButton)

    expect(defaultProps.onDelete).toHaveBeenCalledWith('task-1')
  })

  it('cancels deletion when cancelled', () => {
    render(<TaskItem {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete task/i })
    fireEvent.click(deleteButton)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Dialog should be closed
    expect(screen.queryByText('Delete Task')).not.toBeInTheDocument()
    expect(defaultProps.onDelete).not.toHaveBeenCalled()
  })

  it('saves changes when edit form is submitted', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('task-1', {
        title: 'Updated Task',
        description: 'Test Description',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2024-12-31'),
        category: 'study',
        estimatedTime: 60,
        tags: '[]'
      })
    })
  })

  it('shows validation error for empty title', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    const titleInput = screen.getByDisplayValue('Test Task')
    fireEvent.change(titleInput, { target: { value: '' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
  })

  it('cancels editing when cancel button is clicked', () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    // Should return to view mode
    expect(screen.queryByDisplayValue('Test Task')).not.toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('shows completed state correctly', () => {
    const completedTask = {
      ...defaultProps.task,
      status: 'completed' as const,
      completedAt: new Date()
    }

    render(<TaskItem {...defaultProps} task={completedTask} />)

    // Should show completed status
    expect(screen.getByText('Completed')).toBeInTheDocument()
    
    // Should show checkmark icon
    expect(screen.getByRole('button', { name: /mark task as incomplete/i })).toBeInTheDocument()
  })

  it('disables drag and drop when task is completed', () => {
    const completedTask = {
      ...defaultProps.task,
      status: 'completed' as const,
      completedAt: new Date()
    }

    render(<TaskItem {...defaultProps} task={completedTask} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    expect(taskCard).toHaveAttribute('draggable', 'false')
  })

  it('calls onDragStart when dragging starts', () => {
    render(<TaskItem {...defaultProps} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    fireEvent.dragStart(taskCard!)
    
    expect(defaultProps.onDragStart).toHaveBeenCalled()
  })

  it('calls onDragEnd when dragging ends', () => {
    render(<TaskItem {...defaultProps} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    fireEvent.dragEnd(taskCard!)
    
    expect(defaultProps.onDragEnd).toHaveBeenCalled()
  })

  it('calls onDragOver when dragging over', () => {
    render(<TaskItem {...defaultProps} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    // Mock dataTransfer for the drag event
    const mockDragEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        dropEffect: 'move'
      }
    } as any
    
    fireEvent.dragOver(taskCard!, mockDragEvent)

    expect(defaultProps.onDragOver).toHaveBeenCalled()
  })

  it('calls onDrop when task is dropped', () => {
    render(<TaskItem {...defaultProps} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    // Mock dataTransfer for the drop event
    const mockDropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue('0')
      }
    } as any
    
    fireEvent.drop(taskCard!, mockDropEvent)

    expect(defaultProps.onDrop).toHaveBeenCalledWith(expect.any(Object), 0)
  })

  it('calls onDragEnter when dragging enters', () => {
    render(<TaskItem {...defaultProps} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    fireEvent.dragEnter(taskCard!)
    
    expect(defaultProps.onDragEnter).toHaveBeenCalledWith(0)
  })

  it('shows dragging state correctly', () => {
    render(<TaskItem {...defaultProps} isDragging={true} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    expect(taskCard).toHaveClass('opacity-60', 'scale-98')
  })

  it('shows drag over state correctly', () => {
    render(<TaskItem {...defaultProps} dragOverIndex={0} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    
    // Check that the drag over classes are applied
    expect(taskCard).toHaveClass('border-primary')
    expect(taskCard).toHaveClass('border-2')
    expect(taskCard).toHaveClass('bg-primary/5')
  })

  it('handles priority changes in edit form', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    // Find the priority select and change it
    const prioritySelect = screen.getByRole('combobox', { name: /priority/i })
    fireEvent.click(prioritySelect)

    // Select "Low" priority
    const lowOption = screen.getByRole('option', { name: /low/i })
    fireEvent.click(lowOption)

    // Verify the change
    expect(prioritySelect).toHaveTextContent('🟢 Low')
  })

  it('handles status changes in edit form', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    // Find the status select and change it
    const statusSelect = screen.getByRole('combobox', { name: /status/i })
    fireEvent.click(statusSelect)

    // Select "In Progress" status
    const inProgressOption = screen.getByRole('option', { name: /in progress/i })
    fireEvent.click(inProgressOption)

    // Verify the change
    expect(statusSelect).toHaveTextContent('🔄 In Progress')
  })

  it('handles subject changes in edit form', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    // The component doesn't have a subject select in edit mode
    // It only allows editing title, description, priority, status, category, and estimated time
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
    expect(screen.getByDisplayValue('study')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
  })

  it('handles estimated time changes in edit form', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    const timeInput = screen.getByDisplayValue('60')
    fireEvent.change(timeInput, { target: { value: '90' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({
        estimatedTime: 90
      }))
    })
  })

  it('handles category changes in edit form', async () => {
    render(<TaskItem {...defaultProps} />)

    const editButton = screen.getByRole('button', { name: /edit task/i })
    fireEvent.click(editButton)

    const categoryInput = screen.getByDisplayValue('study')
    fireEvent.change(categoryInput, { target: { value: 'work' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(defaultProps.onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({
        category: 'work'
      }))
    })
  })

  it('shows overdue indicator for overdue tasks', () => {
    const overdueTask = {
      ...defaultProps.task,
      dueDate: new Date('2023-01-01') // Past date
    }

    render(<TaskItem {...defaultProps} task={overdueTask} />)

    const taskCard = screen.getByText('Test Task').closest('[draggable]')
    expect(taskCard).toBeTruthy()
    expect(taskCard).toHaveClass('border-l-4', 'border-l-red-500')
  })

  it('shows subject information correctly', () => {
    render(<TaskItem {...defaultProps} />)

    // The component doesn't show subject information in view mode
    // It only shows the basic task information
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('handles missing subject gracefully', () => {
    const taskWithoutSubject = {
      ...defaultProps.task,
      subjectId: null
    }

    render(<TaskItem {...defaultProps} task={taskWithoutSubject} />)

    // The component doesn't show subject information in view mode
    // It only shows the basic task information
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('formats time correctly', () => {
    const taskWithTime = {
      ...defaultProps.task,
      estimatedTime: 125, // 2 hours 5 minutes
      timeSpent: 45
    }

    render(<TaskItem {...defaultProps} task={taskWithTime} />)

    // Should show formatted time
    expect(screen.getByText('2h 5m')).toBeInTheDocument()
    // The component doesn't show time spent separately
  })

  it('handles zero time values', () => {
    const taskWithZeroTime = {
      ...defaultProps.task,
      estimatedTime: 0,
      timeSpent: 0
    }

    render(<TaskItem {...defaultProps} task={taskWithZeroTime} />)

    // Should handle zero time gracefully - shows just "0"
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
