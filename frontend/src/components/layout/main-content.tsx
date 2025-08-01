'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface MainContentProps {
  children: ReactNode
  className?: string
}

export function MainContent({ children, className }: MainContentProps) {
  return (
    <main 
      className={cn(
        "flex-1 overflow-auto bg-background",
        "min-h-[calc(100vh-3.5rem)]", // Subtract header height
        className
      )}
    >
      <div className="container mx-auto p-6 space-y-6">
        {children}
      </div>
    </main>
  )
}