# Phase 0 UI/UX Design System & Implementation Plan

## Overview
Create a comprehensive design system for the case management system using shadcn/ui + Tailwind CSS, focusing on accessibility, mobile-first responsive design, and role-based user experiences for Clerk, Chair, and Caseworker roles.

## 1. Design System Foundation

### Core Design Tokens
- **Color System**: Professional legal/administrative palette with WCAG AA compliance
  - Primary: Blue-based for trust and professionalism 
  - Secondary: Gray-based for neutral elements
  - Semantic colors: Success (green), Warning (amber), Error (red), Info (blue)
  - Dark mode support with proper contrast ratios

- **Typography Scale**: 
  - Font family: Inter for readability and professional appearance
  - Scale: 12px-48px with consistent line heights
  - Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

- **Spacing System**: 
  - Based on 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80px)
  - Consistent margins and padding throughout the application

- **Border Radius**: 
  - Small: 4px, Medium: 8px, Large: 12px
  - Consistent with shadcn/ui default styling

### Component Architecture
- **shadcn/ui Integration**: 
  - Initialize with `npx shadcn@latest init`
  - Core components: Button, Input, Card, Table, Dialog, Form, Select, Sidebar
  - Advanced components: Calendar, DataTable, Breadcrumb, Navigation Menu
  
- **Custom Component Extensions**:
  - CaseStatusBadge component with color-coded status indicators
  - RoleBasedLayout wrapper for different user interfaces
  - DataVisualization components for reporting dashboards

## 2. Responsive Layout Architecture

### Grid System
- **Mobile-first approach**: Starting from 320px viewport
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Layout patterns**: 
  - Mobile: Single column stack
  - Tablet: Sidebar collapsible, main content responsive
  - Desktop: Full sidebar + main content with optional right panel

### Layout Components
- **AppShell**: Main application wrapper with header, sidebar, and content areas
- **ResponsiveSidebar**: Collapsible on mobile, persistent on desktop
- **ContentArea**: Flexible main content with proper spacing and constraints
- **HeaderBar**: Global navigation with user menu and notifications

## 3. User Experience Design for Phase 0

### Landing/Health Check Page
- **Purpose**: Validate frontend-backend communication and n8n integration
- **Design**: Clean, minimal interface with system status indicators
- **Components**: Status cards, connection indicators, simple test buttons
- **Responsive**: Single column on mobile, card grid on desktop

### Authentication Flow (Preparation)
- **Login form**: Clean, accessible with proper validation states
- **Error handling**: Clear, contextual error messages
- **Loading states**: Skeleton components and progress indicators

### Role-Based Interface Preparation
- **Clerk Interface**: Streamlined, efficiency-focused design
- **Chair Interface**: Executive dashboard with overview cards and key metrics
- **Caseworker Interface**: Detailed, comprehensive case management tools

## 4. Accessibility & WCAG Compliance

### WCAG 2.1 AA Standards
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation**: Full tab order, focus indicators, skip links
- **Screen reader support**: Proper ARIA labels, semantic HTML, live regions
- **Alternative text**: All images and icons with descriptive alt text

### Inclusive Design Features
- **Focus management**: Clear focus rings, logical tab order
- **Text scaling**: Support up to 200% zoom without horizontal scrolling
- **Motion preferences**: Respect `prefers-reduced-motion`
- **Color blindness**: Information not conveyed by color alone

## 5. Design System Documentation

### Component Library
- **Storybook setup**: Interactive component documentation
- **Usage guidelines**: When and how to use each component
- **Code examples**: Copy-paste ready implementation examples
- **Accessibility notes**: ARIA patterns and keyboard interactions

### Design Tokens Documentation
- **CSS Custom Properties**: Centralized design token definitions
- **Tailwind configuration**: Extended theme with custom design tokens
- **Dark mode implementation**: Systematic color variable definitions

## 6. Implementation Strategy

### Phase 0 Deliverables
1. `components.json` configuration file
2. Base layout components (AppShell, ResponsiveSidebar)
3. Core shadcn/ui components setup (Button, Input, Card, Form)
4. Theme provider with dark mode support
5. Responsive utilities and mobile-first CSS
6. Accessibility foundation (focus management, ARIA patterns)
7. Health check page design and implementation

### File Structure
```
frontend/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── forms/             # Form components
│   └── common/            # Shared components
├── styles/
│   ├── globals.css        # Global styles with design tokens
│   └── components.css     # Component-specific styles
├── lib/
│   ├── utils.ts          # Utility functions
│   └── constants.ts      # Design constants
└── hooks/                # Custom React hooks
```

### Quality Assurance
- **Design-to-code consistency**: 95%+ match between designs and implementation
- **Accessibility audits**: Automated testing with axe-core
- **Performance budgets**: Core Web Vitals compliance
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Device testing**: Mobile, tablet, desktop viewports

This plan establishes a solid foundation for the case management system's UI/UX, ensuring professional appearance, accessibility compliance, and scalable architecture for future development phases.

## Detailed Design System Implementation

### Design Token System

#### Color Palette
```css
/* globals.css - CSS Custom Properties */
:root {
  /* Primary Colors - Professional Blue */
  --primary-50: 239 246 255;
  --primary-100: 219 234 254;
  --primary-500: 59 130 246;
  --primary-600: 37 99 235;
  --primary-900: 30 58 138;

  /* Neutral Colors - Sophisticated Gray */
  --neutral-50: 250 250 250;
  --neutral-100: 244 244 245;
  --neutral-200: 228 228 231;
  --neutral-500: 113 113 122;
  --neutral-800: 39 39 42;
  --neutral-900: 24 24 27;

  /* Semantic Colors */
  --success-50: 240 253 244;
  --success-500: 34 197 94;
  --success-600: 22 163 74;

  --warning-50: 255 251 235;
  --warning-500: 245 158 11;
  --warning-600: 217 119 6;

  --error-50: 254 242 242;
  --error-500: 239 68 68;
  --error-600: 220 38 38;

  /* Surface Colors */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

#### Typography System
```css
/* Typography Scale */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }

/* Font Weights */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

### Core Component Library

#### Health Status Card Component
```typescript
// components/ui/health-status-card.tsx
import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface HealthStatusCardProps {
  title: string
  icon: ReactNode
  status: 'ok' | 'connected' | 'disconnected' | 'warning' | 'error' | 'info'
  value: string
  description?: string
  className?: string
}

const statusConfig = {
  ok: { 
    variant: 'default' as const, 
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300' 
  },
  connected: { 
    variant: 'default' as const, 
    className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300' 
  },
  disconnected: { 
    variant: 'destructive' as const, 
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300' 
  },
  warning: { 
    variant: 'secondary' as const, 
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300' 
  },
  error: { 
    variant: 'destructive' as const, 
    className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300' 
  },
  info: { 
    variant: 'secondary' as const, 
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300' 
  },
}

export function HealthStatusCard({ 
  title, 
  icon, 
  status, 
  value, 
  description, 
  className 
}: HealthStatusCardProps) {
  const config = statusConfig[status]

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          <Badge 
            variant={config.variant}
            className={cn(config.className, 'text-xs')}
          >
            {status}
          </Badge>
        </div>
        {description && (
          <CardDescription className="mt-1 text-xs">
            {description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
```

#### Case Status Badge Component (Future Use)
```typescript
// components/ui/case-status-badge.tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type CaseStatus = 'new' | 'pending_review' | 'assigned' | 'in_progress' | 'pending_completion' | 'completed'

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300'
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300'
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950 dark:text-orange-300'
  },
  pending_completion: {
    label: 'Pending Completion',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300'
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950 dark:text-green-300'
  }
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  )
}
```

### Layout Component System

#### App Shell Component
```typescript
// components/layout/app-shell.tsx
'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
  showSidebar?: boolean
}

export function AppShell({ children, className, showSidebar = true }: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      <Header />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {showSidebar && <Sidebar />}
        <main className={cn(
          'flex-1 overflow-y-auto',
          showSidebar ? 'lg:ml-64' : ''
        )}>
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

#### Responsive Header
```typescript
// components/layout/header.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Menu, Search, User, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo and Title */}
        <div className="mr-4 flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="hidden text-lg font-semibold md:block">
            Case Management System
          </h1>
          <h1 className="text-sm font-semibold md:hidden">CMS</h1>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 px-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Search cases..."
            />
          </div>
        </div>
        
        {/* Actions */}
        <nav className="flex items-center space-x-1">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
```

### Accessibility Implementation

#### Focus Management
```css
/* Focus Styles */
.focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background;
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .card {
    @apply border-2 border-black dark:border-white;
  }
  
  .button {
    @apply border-2 border-current;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### Screen Reader Support
```typescript
// components/common/sr-only.tsx
import { cn } from '@/lib/utils'

interface SROnlyProps {
  children: React.ReactNode
  className?: string
}

export function SROnly({ children, className }: SROnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  )
}

// Usage in components
<button aria-describedby="refresh-help">
  <RefreshCw className="h-4 w-4" />
  <SROnly>Refresh health data</SROnly>
</button>
<div id="refresh-help" className="sr-only">
  Click to refresh all system health indicators
</div>
```

### Responsive Design System

#### Breakpoint Utilities
```typescript
// lib/responsive.ts
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export type Breakpoint = keyof typeof breakpoints

export function useBreakpoint(breakpoint: Breakpoint) {
  // Custom hook for responsive behavior
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${breakpoints[breakpoint]})`)
    setMatches(media.matches)
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [breakpoint])
  
  return matches
}
```

#### Mobile-First Components
```typescript
// components/layout/responsive-grid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, md: 2, lg: 3 }, 
  gap = 4,
  className 
}: ResponsiveGridProps) {
  const gridCols = cn(
    `grid gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  )
  
  return (
    <div className={gridCols}>
      {children}
    </div>
  )
}
```

### Performance & Optimization

#### Component Lazy Loading
```typescript
// components/lazy/index.ts
import { lazy } from 'react'

export const LazyHealthDashboard = lazy(() => 
  import('../features/health/health-dashboard').then(module => ({
    default: module.HealthDashboard
  }))
)

export const LazyAdminPanel = lazy(() => 
  import('../features/admin/admin-panel').then(module => ({
    default: module.AdminPanel
  }))
)
```

#### Image Optimization
```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn('rounded-md object-cover', className)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  )
}
```

This comprehensive design system ensures a professional, accessible, and scalable user interface foundation for the Case Management System, supporting efficient development and excellent user experience across all device types and user needs.