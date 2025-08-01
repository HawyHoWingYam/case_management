'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { APP_CONFIG } from '@/lib/constants'
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  FolderOpen,
  UserCheck,
  TrendingUp,
} from 'lucide-react'

const navigationItems = [
  { 
    icon: Home, 
    label: 'Dashboard', 
    href: '/', 
    badge: null,
    description: 'Overview and quick actions'
  },
  { 
    icon: FileText, 
    label: 'Cases', 
    href: '/cases', 
    badge: '12',
    description: 'Manage and track cases'
  },
  { 
    icon: Users, 
    label: 'Users', 
    href: '/users', 
    badge: null,
    description: 'User management'
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    href: '/reports', 
    badge: null,
    description: 'Analytics and reporting'
  },
  { 
    icon: Activity, 
    label: 'Health', 
    href: '/health', 
    badge: null,
    description: 'System health monitoring'
  },
]

const bottomNavigationItems = [
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/settings', 
    badge: null,
    description: 'Application settings'
  },
]

interface SidebarProps {
  className?: string
  defaultCollapsed?: boolean
}

export function Sidebar({ className, defaultCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <div
      className={cn(
        "relative flex h-[calc(100vh-3.5rem)] flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <p className="text-xs text-muted-foreground">v{APP_CONFIG.version}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("ml-auto", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
          <span className="sr-only">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </span>
        </Button>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => (
          <div key={item.href} className="relative">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-10",
                collapsed && "justify-center px-2"
              )}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="ml-3 flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </a>
            </Button>
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full top-0 ml-2 hidden group-hover:block">
                <div className="rounded-md bg-popover px-3 py-2 text-sm shadow-md border">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      
      <Separator />
      
      {/* Bottom Navigation */}
      <div className="p-4 space-y-1">
        {bottomNavigationItems.map((item) => (
          <div key={item.href} className="relative">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-10",
                collapsed && "justify-center px-2"
              )}
              asChild
            >
              <a href={item.href}>
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && (
                  <span className="ml-3 flex-1 text-left">{item.label}</span>
                )}
              </a>
            </Button>
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full top-0 ml-2 hidden group-hover:block">
                <div className="rounded-md bg-popover px-3 py-2 text-sm shadow-md border">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <Separator />
      <div className="p-4">
        <div className={cn(
          "text-xs text-muted-foreground", 
          collapsed ? "text-center" : "space-y-1"
        )}>
          {collapsed ? (
            <div>v{APP_CONFIG.version}</div>
          ) : (
            <>
              <div className="font-medium">{APP_CONFIG.name}</div>
              <div>Version {APP_CONFIG.version}</div>
              <div className="text-[10px] opacity-70">
                Built with Next.js & shadcn/ui
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}