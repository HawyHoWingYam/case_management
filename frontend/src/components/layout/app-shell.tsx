'use client'

import { ReactNode, useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { MainContent } from './main-content'
import { Footer } from './footer'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
  showSidebar?: boolean
  showFooter?: boolean
}

export function AppShell({ 
  children, 
  className, 
  showSidebar = true,
  showFooter = true 
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className={cn("min-h-screen bg-background flex flex-col", className)}>
      {/* Header */}
      <Header onMenuClick={handleMenuClick} />
      
      {/* Main layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Desktop sidebar */}
            <div className="hidden md:flex">
              <Sidebar />
            </div>
            
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40 bg-black/50 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                
                {/* Mobile sidebar */}
                <div className="fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] md:hidden">
                  <Sidebar />
                </div>
              </>
            )}
          </>
        )}
        
        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <MainContent>{children}</MainContent>
          {showFooter && <Footer />}
        </div>
      </div>
    </div>
  )
}