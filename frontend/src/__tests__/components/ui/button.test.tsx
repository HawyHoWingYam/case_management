import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled button</Button>)
    
    const button = screen.getByRole('button', { name: /disabled button/i })
    expect(button).toBeDisabled()
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    
    let button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')
    
    rerender(<Button variant="outline">Outlined</Button>)
    
    button = screen.getByRole('button', { name: /outlined/i })
    expect(button).toHaveClass('border-input')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    
    let button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('h-8')
    
    rerender(<Button size="lg">Large</Button>)
    
    button = screen.getByRole('button', { name: /large/i })
    expect(button).toHaveClass('h-10')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    
    render(<Button ref={ref}>Button with ref</Button>)
    
    expect(ref).toHaveBeenCalled()
  })
})