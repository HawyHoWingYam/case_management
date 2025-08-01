'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  fallback 
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // 检查认证状态
    const checkAuth = () => {
      if (requireAuth && !isAuthenticated) {
        // 保存当前路径，登录后重定向
        sessionStorage.setItem('redirectAfterLogin', pathname)
        router.push('/login')
        return
      }

      // 如果不需要认证或已认证，继续加载
      setIsLoading(false)
    }

    // 短暂延迟以避免闪烁
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [mounted, isAuthenticated, requireAuth, router, pathname])

  // 组件未挂载时不渲染
  if (!mounted) {
    return null
  }

  // 正在检查认证状态
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>正在验证身份...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // 如果需要认证但未认证，不渲染子组件（将重定向到登录页）
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // 渲染子组件
  return <>{children}</>
}

// 用于保护整个页面的高阶组件
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAuth?: boolean } = {}
) {
  const { requireAuth = true } = options

  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard requireAuth={requireAuth}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}