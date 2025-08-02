'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import Header from './Header'
import { HealthStatus } from '../HealthStatus'

interface LayoutProps {
  children: React.ReactNode
}

// 不需要认证的页面路径
const publicPaths = ['/login', '/register', '/forgot-password']

// 不显示Header的页面路径
const noHeaderPaths = ['/login', '/register', '/forgot-password']

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, token } = useAuthStore()

  console.log('🔍 [Layout] Current state:', {
    pathname,
    isAuthenticated,
    hasUser: !!user,
    hasToken: !!token
  })

  // 检查当前路径是否需要认证
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const shouldShowHeader = !noHeaderPaths.some(path => pathname.startsWith(path))

  // 认证检查和重定向逻辑
  useEffect(() => {
    console.log('🔍 [Layout] Authentication check:', {
      isAuthenticated,
      isPublicPath,
      pathname
    })

    // 如果在受保护的页面但未认证，重定向到登录页
    if (!isAuthenticated && !isPublicPath) {
      console.log('🔍 [Layout] Redirecting to login - not authenticated')
      
      // 保存当前路径，登录后重定向回来
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', pathname)
      }
      
      router.push('/login')
      return
    }

    // 如果已认证但在登录页，重定向到首页
    if (isAuthenticated && pathname === '/login') {
      console.log('🔍 [Layout] Redirecting to home - already authenticated')
      router.push('/')
      return
    }
  }, [isAuthenticated, isPublicPath, pathname, router])

  // 如果在受保护页面但未认证，显示加载状态
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-muted-foreground">检查认证状态...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {shouldShowHeader && <Header />}
      
      {/* Main Content */}
      <main className={cn(
        'flex-1',
        shouldShowHeader ? 'container mx-auto px-4 py-6' : 'w-full'
      )}>
        {children}
      </main>

      {/* Footer */}
      {shouldShowHeader && (
        <footer className="border-t bg-background">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  © 2025 案例管理系统. 保留所有权利.
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* 系统健康状态 */}
                <HealthStatus />
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>版本 v1.0.0</span>
                  <span>•</span>
                  <span>环境: {process.env.NODE_ENV}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* 开发环境调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <details className="bg-black/80 text-white text-xs rounded p-2 max-w-xs">
            <summary className="cursor-pointer">调试信息</summary>
            <div className="mt-2 space-y-1">
              <div>路径: {pathname}</div>
              <div>认证状态: {isAuthenticated ? '已认证' : '未认证'}</div>
              <div>用户: {user?.username || '无'}</div>
              <div>角色: {user?.role || '无'}</div>
              <div>显示Header: {shouldShowHeader ? '是' : '否'}</div>
              <div>公开页面: {isPublicPath ? '是' : '否'}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}