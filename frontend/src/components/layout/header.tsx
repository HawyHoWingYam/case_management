'use client'

import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Menu, User, Bell, Search } from 'lucide-react'
import { APP_CONFIG } from '@/lib/constants'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}>
      <div className="container flex h-14 items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Logo and title */}
        <div className="mr-4 hidden md:flex">
          <h1 className="text-lg font-semibold text-foreground">
            {APP_CONFIG.name}
          </h1>
        </div>
        
        {/* Mobile title */}
        <div className="mr-4 flex md:hidden">
          <h1 className="text-sm font-semibold text-foreground">
            Case Mgmt
          </h1>
        </div>
        
        {/* Search and actions */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Search */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            >
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline-flex">Search cases...</span>
              <span className="inline-flex lg:hidden">Search...</span>
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>
          
          {/* Action buttons */}
          <nav className="flex items-center space-x-1">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            
            {/* Theme toggle */}
            <ThemeToggle />
            
            {/* User menu */}
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}