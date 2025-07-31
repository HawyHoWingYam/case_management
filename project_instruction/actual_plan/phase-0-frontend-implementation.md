# Frontend Expert - Phase 0 Implementation Plan

## Overview
Create a comprehensive Next.js frontend implementation plan based on the Phase 0 draft requirements, focusing on modern React development with TypeScript, shadcn/ui components, and responsive design patterns.

## 1. Next.js Project Initialization

### Project Setup Commands
```bash
# Create Next.js project with App Router
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project directory
cd frontend

# Install additional dependencies
npm install @radix-ui/react-icons lucide-react class-variance-authority clsx tailwind-merge
npm install @types/node @types/react @types/react-dom
npm install axios swr @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod
npm install next-themes
npm install @next/bundle-analyzer

# Development dependencies
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

### Package.json Configuration
```json
{
  "name": "case-management-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "analyze": "ANALYZE=true npm run build"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "@radix-ui/react-icons": "^1.3.0",
    "lucide-react": "^0.294.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "axios": "^1.6.0",
    "swr": "^2.2.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.47.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "next-themes": "^0.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

## 2. Project Architecture & File Structure

### Directory Structure
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx           # Home page (health check)
│   │   ├── loading.tsx        # Global loading UI
│   │   ├── error.tsx          # Global error UI
│   │   └── not-found.tsx      # 404 page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── app-shell.tsx
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── main-content.tsx
│   │   │   └── footer.tsx
│   │   ├── features/           # Feature-specific components
│   │   │   ├── health/
│   │   │   │   ├── health-dashboard.tsx
│   │   │   │   └── health-status-card.tsx
│   │   │   └── common/
│   │   │       ├── loading-spinner.tsx
│   │   │       └── error-boundary.tsx
│   │   └── providers/          # Context providers
│   │       ├── theme-provider.tsx
│   │       ├── query-provider.tsx
│   │       └── toast-provider.tsx
│   ├── lib/
│   │   ├── utils.ts           # Utility functions
│   │   ├── api.ts             # API client configuration
│   │   ├── constants.ts       # Application constants
│   │   ├── validations.ts     # Zod schemas
│   │   └── types.ts           # TypeScript type definitions
│   ├── hooks/
│   │   ├── use-api.ts         # API hooks
│   │   ├── use-health.ts      # Health check hooks
│   │   └── use-local-storage.ts
│   ├── styles/
│   │   └── components.css     # Component-specific styles
│   └── __tests__/
│       ├── components/
│       ├── pages/
│       └── utils/
├── public/
│   ├── icons/
│   ├── images/
│   └── favicon.ico
├── .env.local.example
├── .eslintrc.json
├── .prettierrc
├── jest.config.js
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── components.json             # shadcn/ui config
```

## 3. UI Framework Configuration

### shadcn/ui Setup
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add separator
```

### components.json Configuration
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 4. Layout & Navigation System

### App Shell Component
```typescript
// src/components/layout/app-shell.tsx
'use client'

import { ReactNode } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { MainContent } from './main-content'
import { Footer } from './footer'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <Header />
      <div className="flex">
        <Sidebar />
        <MainContent>
          {children}
        </MainContent>
      </div>
      <Footer />
    </div>
  )
}
```

### Responsive Header Component
```typescript
// src/components/layout/header.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Menu, User, Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <h1 className="text-lg font-semibold">Case Management System</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="ghost"
              className="inline-flex items-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
            >
              <span className="hidden lg:inline-flex">Search cases...</span>
              <span className="inline-flex lg:hidden">Search...</span>
            </Button>
          </div>
          
          <nav className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

### Responsive Sidebar Component
```typescript
// src/components/layout/sidebar.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const navigationItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Cases', href: '/cases' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "relative flex h-[calc(100vh-3.5rem)] flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <h2 className="text-lg font-semibold">Navigation</h2>
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
        </Button>
      </div>
      
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed && "justify-center px-2"
            )}
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span className="ml-2">{item.label}</span>}
          </Button>
        ))}
      </nav>
      
      <Separator />
      
      <div className="p-4">
        <div className={cn("text-xs text-muted-foreground", collapsed && "text-center")}>
          {collapsed ? "v1.0" : "Version 1.0.0"}
        </div>
      </div>
    </div>
  )
}
```

## 5. API Integration Architecture

### API Client Configuration
```typescript
// src/lib/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export interface ApiError {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }
}

export const apiClient = new ApiClient()
```

### Health Check Integration
```typescript
// src/hooks/use-health.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

export interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  services?: {
    database: {
      status: string
      responseTime?: number
    }
    memory: {
      used: number
      total: number
      unit: string
    }
  }
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthStatus>('/health'),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
  })
}

export function useDetailedHealth() {
  return useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: () => apiClient.get<HealthStatus>('/health/detailed'),
    refetchInterval: 60000, // Refetch every minute
    retry: 2,
  })
}
```

## 6. State Management Strategy

### Query Provider Setup
```typescript
// src/components/providers/query-provider.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 404) return false
              return failureCount < 3
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
```

### Theme Provider
```typescript
// src/components/providers/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

## 7. Component Library Setup

### Health Dashboard Component
```typescript
// src/components/features/health/health-dashboard.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealth, useDetailedHealth } from '@/hooks/use-health'
import { HealthStatusCard } from './health-status-card'
import { RefreshCw, Activity, Database, Memory } from 'lucide-react'

export function HealthDashboard() {
  const { data: basicHealth, isLoading: basicLoading, refetch: refetchBasic } = useHealth()
  const { data: detailedHealth, isLoading: detailedLoading, refetch: refetchDetailed } = useDetailedHealth()

  const handleRefresh = () => {
    refetchBasic()
    refetchDetailed()
  }

  if (basicLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor the health and status of all system components
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <HealthStatusCard
          title="System Status"
          icon={<Activity className="h-4 w-4" />}
          status={basicHealth?.status || 'unknown'}
          value={basicHealth?.status === 'ok' ? 'Healthy' : 'Issues Detected'}
          description={`Uptime: ${Math.floor((basicHealth?.uptime || 0) / 3600)}h`}
        />

        {detailedHealth?.services?.database && (
          <HealthStatusCard
            title="Database"
            icon={<Database className="h-4 w-4" />}
            status={detailedHealth.services.database.status}
            value={detailedHealth.services.database.status === 'connected' ? 'Connected' : 'Disconnected'}
            description={
              detailedHealth.services.database.responseTime
                ? `Response: ${detailedHealth.services.database.responseTime}ms`
                : 'No response time available'
            }
          />
        )}

        {detailedHealth?.services?.memory && (
          <HealthStatusCard
            title="Memory Usage"
            icon={<Memory className="h-4 w-4" />}
            status="info"
            value={`${detailedHealth.services.memory.used}/${detailedHealth.services.memory.total} MB`}
            description={`${Math.round((detailedHealth.services.memory.used / detailedHealth.services.memory.total) * 100)}% used`}
          />
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {basicHealth?.timestamp ? new Date(basicHealth.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {basicHealth?.timestamp ? new Date(basicHealth.timestamp).toLocaleDateString() : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* n8n Integration Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>n8n Integration Test</CardTitle>
          <CardDescription>
            Test the connection between the frontend, backend, and n8n automation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {/* TODO: Implement n8n test */}}>
            Test n8n Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 8. Development Environment

### Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

// Bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Environment Configuration
```bash
# .env.local.example
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME="Case Management System"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

## Implementation Timeline

### Phase 0.1 (Week 1): Foundation
1. Next.js project initialization with TypeScript and Tailwind CSS
2. shadcn/ui component library setup and configuration
3. Basic project structure and routing setup
4. Theme provider and basic styling implementation

### Phase 0.2 (Week 2): Components & Integration
1. Layout components (AppShell, Header, Sidebar, Footer)
2. API client setup and React Query integration
3. Health dashboard implementation
4. Responsive design and mobile optimization

### Phase 0.3 (Week 3): Testing & Optimization
1. Component testing setup with Jest and Testing Library
2. E2E testing preparation
3. Performance optimization and bundle analysis
4. Documentation and code review

This comprehensive frontend plan establishes a modern, scalable, and maintainable React application using Next.js, TypeScript, and shadcn/ui components, providing a solid foundation for the Case Management System.