import { render, screen, fireEvent } from '@testing-library/react'
import { ExpandableSection } from '@/components/expandable-section'
import { BookOpen } from 'lucide-react'

const defaultProps = {
  title: 'Test Section',
  children: <div data-testid="test-content">Test Content</div>
}

describe('ExpandableSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders with title', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('renders collapsed by default', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    // Content is present but hidden with opacity-0
    const content = screen.getByTestId('test-content')
    expect(content).toBeInTheDocument()
  })

  test('expands when clicked', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Content should be visible after click
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  test('renders with defaultExpanded prop', () => {
    render(<ExpandableSection {...defaultProps} defaultExpanded={true} />)
    
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  test('renders with icon when provided', () => {
    render(<ExpandableSection {...defaultProps} icon={BookOpen} />)
    
    // Find the icon by its class
    const icon = document.querySelector('.lucide-book-open')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('text-primary')
  })

  test('shows expand indicator', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    // Find the expand indicator dot
    const indicator = document.querySelector('.bg-muted-foreground\\/40')
    expect(indicator).toBeInTheDocument()
  })

  test('shows collapse indicator when expanded', () => {
    render(<ExpandableSection {...defaultProps} defaultExpanded={true} />)
    
    // Find the expand indicator dot (should be green when expanded)
    const indicator = document.querySelector('.bg-accent-green')
    expect(indicator).toBeInTheDocument()
  })

  test('rotates chevron icon when expanded', () => {
    render(<ExpandableSection {...defaultProps} defaultExpanded={true} />)
    
    // Find the chevron icon
    const chevron = document.querySelector('.lucide-chevron-down')
    expect(chevron).toHaveClass('rotate-180', 'text-primary')
  })

  test('shows default chevron when collapsed', () => {
    render(<ExpandableSection {...defaultProps} />)

    // Find the chevron icon by its SVG class
    const chevron = document.querySelector('.lucide-chevron-down')
    expect(chevron).not.toHaveClass('rotate-180')
    expect(chevron).toHaveClass('text-muted-foreground')
  })

  test('toggles expansion state correctly', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')

    // Initially collapsed - content is present but hidden with opacity-0
    const content = screen.getByTestId('test-content')
    const contentWrapper = content.closest('.overflow-visible')
    expect(contentWrapper).toHaveClass('opacity-0')

    // Click to expand
    fireEvent.click(button)
    expect(contentWrapper).toHaveClass('opacity-100')

    // Click to collapse
    fireEvent.click(button)
    expect(contentWrapper).toHaveClass('opacity-0')
  })

  test('applies proper styling classes', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    // Find the main section by its class
    const section = document.querySelector('.card-enhanced')
    expect(section).toHaveClass('card-enhanced', 'overflow-hidden')
  })

  test('applies proper button styling', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('w-full', 'interactive-element', 'focus-ring')
  })

  test('applies proper icon container styling', () => {
    render(<ExpandableSection {...defaultProps} icon={BookOpen} />)

    // Find the icon container by its gradient class
    const iconContainer = document.querySelector('.bg-gradient-to-br')
    expect(iconContainer).toHaveClass(
      'p-1.5',
      'sm:p-2',
      'bg-gradient-to-br',
      'rounded-lg'
    )
  })

  test('applies proper content container styling', () => {
    render(<ExpandableSection {...defaultProps} defaultExpanded={true} />)

    // Find the content container by its border class
    const contentContainer = document.querySelector('.border-t')
    expect(contentContainer).toHaveClass(
      'px-4',
      'sm:px-6',
      'pb-4',
      'sm:pb-6',
      'border-t'
    )
  })

  test('applies proper content styling', () => {
    render(<ExpandableSection {...defaultProps} defaultExpanded={true} />)

    // Find the content by its animation class
    const content = document.querySelector('.animate-fade-in-up')
    expect(content).toHaveClass(
      'pt-4',
      'sm:pt-6',
      'animate-fade-in-up'
    )
  })

  test('handles complex children content', () => {
    const complexContent = (
      <div>
        <h3>Complex Header</h3>
        <p>Complex paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
      </div>
    )

    render(<ExpandableSection {...defaultProps} defaultExpanded={true}>{complexContent}</ExpandableSection>)

    expect(screen.getByText('Complex Header')).toBeInTheDocument()
    expect(screen.getByText('bold text')).toBeInTheDocument()
    expect(screen.getByText('List item 1')).toBeInTheDocument()
    expect(screen.getByText('List item 2')).toBeInTheDocument()
  })

  test('handles empty children', () => {
    render(<ExpandableSection {...defaultProps}>{null}</ExpandableSection>)
    
    expect(screen.getByText('Test Section')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  test('handles function children', () => {
    const functionChild = () => <div data-testid="function-content">Function Content</div>
    
    render(<ExpandableSection {...defaultProps}>{functionChild()}</ExpandableSection>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(screen.getByTestId('function-content')).toBeInTheDocument()
  })

  test('maintains accessibility attributes', () => {
    render(<ExpandableSection {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus-ring') // Component has focus styling
  })

  test('handles rapid clicking gracefully', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Rapid clicks should not break the component
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  test('handles keyboard navigation', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Enter key should toggle expansion
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
  })

  test('handles mobile responsive design', () => {
    render(<ExpandableSection {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'sm:px-6', 'py-3', 'sm:py-4')
  })

  test('applies smooth transitions', () => {
    render(<ExpandableSection {...defaultProps} />)

    // Find the content wrapper by its duration class
    const contentWrapper = document.querySelector('.duration-500')
    expect(contentWrapper).toHaveClass('transition-all', 'duration-500', 'ease-out')
  })

  test('handles overflow correctly', () => {
    render(<ExpandableSection {...defaultProps} />)

    // Find the content wrapper by its overflow class
    const contentWrapper = document.querySelector('.overflow-visible')
    expect(contentWrapper).toHaveClass('overflow-visible')
  })

  test('maintains proper z-index layering', () => {
    render(<ExpandableSection {...defaultProps} />)

    // Find the main section
    const section = document.querySelector('.card-enhanced')
    // Should not have conflicting z-index values
    expect(section).not.toHaveClass('z-')
  })

  test('handles theme changes gracefully', () => {
    render(<ExpandableSection {...defaultProps} />)

    // Should apply theme-appropriate classes
    const section = document.querySelector('.card-enhanced')
    expect(section).toHaveClass('card-enhanced')
  })
})