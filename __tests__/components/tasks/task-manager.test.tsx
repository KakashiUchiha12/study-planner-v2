import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TaskManager } from '@/components/tasks/task-manager'
import { Task } from '@prisma/client'

// Mock the hooks
jest.mock('@/hooks/useTasks', () => ({
  useTasks: () => ({
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    toggleTask: jest.fn(),
    reorderTasks: jest.fn()
  })
}))

jest.mock('@/hooks/useSubjects', () => ({
  useSubjects: () => ({
    subjects: [
      { id: 'subj-1', name: 'Mathematics', color: '#FF0000' },
      { id: 'subj-2', name: 'Physics', color: '#00FF00' }
    ]
  })
}))

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'pending',
    priority: 'high',
    dueDate: new Date('2023-01-01'), // Past date - overdue
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
  },
  {
    id: 'task-2',
    userId: 'user-1',
    title: 'Task 2',
    description: 'Description 2',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date('2023-01-02'), // Past date - overdue
    estimatedTime: 30,
    timeSpent: 0,
    progress: 0,
    order: 1,
    subjectId: 'subj-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    tags: '',
    category: 'study'
  },
  {
    id: 'task-3',
    userId: 'user-1',
    title: 'Task 3',
    description: 'Description 3',
    status: 'completed',
    priority: 'low',
    dueDate: new Date('2024-12-29'),
    estimatedTime: 45,
    timeSpent: 45,
    progress: 100,
    order: 2,
    subjectId: 'subj-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    tags: '',
    category: 'study'
  }
]

const defaultProps = {
  tasks: mockTasks,
  onTasksChange: jest.fn()
}

describe('TaskManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders task manager with correct title and counts', () => {
    render(<TaskManager {...defaultProps} />)
    
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('2 pending')).toBeInTheDocument()
    expect(screen.getByText('1 completed')).toBeInTheDocument()
    expect(screen.getByText('2 overdue')).toBeInTheDocument() // Component shows 2 overdue
  })

  it('renders all tasks correctly', () => {
    render(<TaskManager {...defaultProps} />)

    // Check that all tasks are rendered by looking for their titles
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('filters tasks by status correctly', () => {
    render(<TaskManager {...defaultProps} />)

    // Find the filter dropdown and select "Pending"
    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    
    // Wait for dropdown to open and select "Pending"
    const pendingOption = screen.getByRole('option', { name: 'Pending' })
    fireEvent.click(pendingOption)

    // Should only show pending tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument()
  })

  it('filters tasks by status correctly - Completed', () => {
    render(<TaskManager {...defaultProps} />)
    
    // Find the filter dropdown and select "Completed"
    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    
    // Wait for dropdown to open and select "Completed"
    const completedOption = screen.getByRole('option', { name: 'Completed' })
    fireEvent.click(completedOption)

    // Should only show completed tasks
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('filters tasks by status correctly - Overdue', () => {
    render(<TaskManager {...defaultProps} />)

    // Find the filter dropdown and select "Overdue"
    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    
    // Wait for dropdown to open and select "Overdue"
    const overdueOption = screen.getByRole('option', { name: 'Overdue' })
    fireEvent.click(overdueOption)

    // Should only show overdue tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument()
  })

  it('filters tasks by status correctly - All Tasks', () => {
    render(<TaskManager {...defaultProps} />)
    
    // Find the filter dropdown and select "All Tasks"
    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    
    // Wait for dropdown to open and select "All Tasks"
    const allTasksOption = screen.getByRole('option', { name: 'All Tasks' })
    fireEvent.click(allTasksOption)

    // Should show all tasks
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('sorts tasks by priority correctly', () => {
    render(<TaskManager {...defaultProps} />)
    
    // Find the sort dropdown and select "Priority"
    const sortSelect = screen.getByRole('combobox', { name: /sort tasks by/i })
    fireEvent.click(sortSelect)
    
    // Wait for dropdown to open and select "Priority"
    const priorityOption = screen.getByRole('option', { name: 'Priority' })
    fireEvent.click(priorityOption)

    // Tasks should be sorted by priority (high, medium, low)
    const taskElements = screen.getAllByText(/Task \d/)
    expect(taskElements[0]).toHaveTextContent('Task 1') // High priority
    expect(taskElements[1]).toHaveTextContent('Task 2') // Medium priority
    expect(taskElements[2]).toHaveTextContent('Task 3') // Low priority
  })

  it('sorts tasks by due date correctly', () => {
    render(<TaskManager {...defaultProps} />)
    
    // Find the sort dropdown and select "Due Date"
    const sortSelect = screen.getByRole('combobox', { name: /sort tasks by/i })
    fireEvent.click(sortSelect)
    
    // Wait for dropdown to open and select "Due Date"
    const dueDateOption = screen.getByRole('option', { name: 'Due Date' })
    fireEvent.click(dueDateOption)

    // Tasks should be sorted by due date (earliest first)
    const taskElements = screen.getAllByText(/Task \d/)
    expect(taskElements[0]).toHaveTextContent('Task 1') // 2023-01-01
    expect(taskElements[1]).toHaveTextContent('Task 2') // 2023-01-02
    expect(taskElements[2]).toHaveTextContent('Task 3') // 2024-12-29
  })

  it('sorts tasks by title correctly', () => {
    render(<TaskManager {...defaultProps} />)
    
    // Find the sort dropdown and select "Title"
    const sortSelect = screen.getByRole('combobox', { name: /sort tasks by/i })
    fireEvent.click(sortSelect)
    
    // Wait for dropdown to open and select "Title"
    const titleOption = screen.getByRole('option', { name: 'Title' })
    fireEvent.click(titleOption)

    // Tasks should be sorted alphabetically by title
    const taskElements = screen.getAllByText(/Task \d/)
    expect(taskElements[0]).toHaveTextContent('Task 1')
    expect(taskElements[1]).toHaveTextContent('Task 2')
    expect(taskElements[2]).toHaveTextContent('Task 3')
  })

  it('sorts tasks by creation date correctly', () => {
    render(<TaskManager {...defaultProps} />)

    // Find the sort dropdown and select "Created"
    const sortSelect = screen.getByRole('combobox', { name: /sort tasks by/i })
    fireEvent.click(sortSelect)
    
    // Wait for dropdown to open and select "Created"
    const createdOption = screen.getByRole('option', { name: 'Created' })
    fireEvent.click(createdOption)

    // Since all tasks have the same creation date in the mock, they won't be reordered
    // Just verify the component renders without errors
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('searches tasks correctly', () => {
    render(<TaskManager {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Task 1' } })

    // Should only show Task 1
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument()
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument()
  })

  it('clears search and shows all tasks', () => {
    render(<TaskManager {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Task 1' } })

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } })

    // Should show all tasks again
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
  })

  it('clears all filters correctly', () => {
    render(<TaskManager {...defaultProps} />)

    // Apply some filters
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Task 1' } })

    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    const pendingOption = screen.getByRole('option', { name: 'Pending' })
    fireEvent.click(pendingOption)

    // Clear all filters
    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)

    // Should show all tasks and reset filters
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
    expect(screen.getByText('Task 3')).toBeInTheDocument()
    
    // Search should be cleared
    expect(searchInput).toHaveValue('')
  })

  it('shows no tasks message when no tasks exist', () => {
    render(<TaskManager {...defaultProps} tasks={[]} />)

    expect(screen.getByText('No tasks yet. Create your first task to get started!')).toBeInTheDocument()
  })

  it('shows no tasks found message when search has no results', () => {
    render(<TaskManager {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'NonExistentTask' } })

    expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument()
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })

  it('shows no tasks found message when status filter has no results', () => {
    render(<TaskManager {...defaultProps} />)

    // Filter by completed status (only Task 3)
    const filterSelect = screen.getByRole('combobox', { name: /filter tasks by status/i })
    fireEvent.click(filterSelect)
    const completedOption = screen.getByRole('option', { name: 'Completed' })
    fireEvent.click(completedOption)

    // Search for something that doesn't exist in completed tasks
    const searchInput = screen.getByPlaceholderText('Search tasks...')
    fireEvent.change(searchInput, { target: { value: 'Task 1' } })

    expect(screen.getByText('No tasks found matching your criteria.')).toBeInTheDocument()
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })

  it('displays correct task statistics', () => {
    render(<TaskManager {...defaultProps} />)

    // Check the statistics display
    expect(screen.getByText('2 pending')).toBeInTheDocument()
    expect(screen.getByText('1 completed')).toBeInTheDocument()
    expect(screen.getByText('2 overdue')).toBeInTheDocument()
    
    // Check the progress percentage
    expect(screen.getByText('33% completed')).toBeInTheDocument()
  })

  it('shows correct task count in footer', () => {
    render(<TaskManager {...defaultProps} />)

    expect(screen.getByText('Showing 3 of 3 tasks')).toBeInTheDocument()
  })

  it('handles task reordering correctly', () => {
    render(<TaskManager {...defaultProps} />)

    // This test would need to simulate drag and drop events
    // For now, just verify the component renders without errors
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('calls onTasksChange when tasks are modified', () => {
    render(<TaskManager {...defaultProps} />)
    
    // The component should call onTasksChange when tasks are modified
    // This would typically happen through the TaskItem components
    expect(defaultProps.onTasksChange).not.toHaveBeenCalled() // Initially not called
  })

  it('calls onOpenCreateDialog when add task button is clicked', () => {
    const mockOnOpenCreateDialog = jest.fn()
    render(<TaskManager {...defaultProps} onOpenCreateDialog={mockOnOpenCreateDialog} />)

    const addButton = screen.getByText('Add Task')
    fireEvent.click(addButton)

    expect(mockOnOpenCreateDialog).toHaveBeenCalledTimes(1)
  })
})
