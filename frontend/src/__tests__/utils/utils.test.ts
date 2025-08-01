import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      const result = cn('always', true && 'conditional', false && 'never')
      expect(result).toBe('always conditional')
    })

    it('handles undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toBe('class1 class2')
    })

    it('handles array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })

    it('merges conflicting Tailwind classes correctly', () => {
      // tailwind-merge should resolve conflicts
      const result = cn('p-4', 'p-2')
      expect(result).toBe('p-2')
    })

    it('handles empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles complex combinations', () => {
      const isActive = true
      const size = 'large'
      
      const result = cn(
        'base-class',
        {
          'active-class': isActive,
          'inactive-class': !isActive,
        },
        size === 'large' && 'large-class',
        ['additional', 'classes']
      )
      
      expect(result).toBe('base-class active-class large-class additional classes')
    })
  })
})