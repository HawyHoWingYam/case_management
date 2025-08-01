'use client'

import { APP_CONFIG } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={cn(
      "border-t bg-background py-4 mt-auto",
      className
    )}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-between space-y-2 text-sm text-muted-foreground md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2">
            <span>© {currentYear} {APP_CONFIG.name}</span>
            <span>•</span>
            <span>v{APP_CONFIG.version}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a 
              href="/docs" 
              className="hover:text-foreground transition-colors"
            >
              Documentation
            </a>
            <a 
              href="/support" 
              className="hover:text-foreground transition-colors"
            >
              Support
            </a>
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground text-center md:text-left">
          {APP_CONFIG.description}
        </div>
      </div>
    </footer>
  )
}