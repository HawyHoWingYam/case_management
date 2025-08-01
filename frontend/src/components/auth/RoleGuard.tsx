'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  redirectTo = '/'
}: RoleGuardProps) {
  const [mounted, setMounted] = useState(false)
  const { user, hasRole } = useAuthStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // 检查用户是否有足够的权限
  const hasPermission = user && hasRole(allowedRoles)

  if (!hasPermission) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                </div>
              </div>
              <CardTitle>访问受限</CardTitle>
              <CardDescription>
                您没有访问此页面的权限。此页面需要以下角色之一：
                <strong className="block mt-1">
                  {allowedRoles.join(', ')}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                当前角色: <strong>{user?.role || '未知'}</strong>
              </div>
              <div className="flex flex-col space-y-2">
                <Link href={redirectTo}>
                  <Button className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回首页
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full">
                    联系管理员
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  return <>{children}</>
}

// 角色权限高阶组件
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[],
  options: { fallback?: React.ReactNode; redirectTo?: string } = {}
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard 
        allowedRoles={allowedRoles} 
        fallback={options.fallback}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </RoleGuard>
    )
  }
}

// 便捷的权限检查组件
export function RequireRole({ 
  roles, 
  children, 
  fallback 
}: { 
  roles: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasRole } = useAuthStore()
  
  if (!hasRole(roles)) {
    return fallback || null
  }
  
  return <>{children}</>
}

// 预定义的角色组件
export const RequireAdmin = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RequireRole roles={['ADMIN']} fallback={fallback}>
    {children}
  </RequireRole>
)

export const RequireManager = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RequireRole roles={['ADMIN', 'MANAGER']} fallback={fallback}>
    {children}
  </RequireRole>
)

export const RequireUser = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <RequireRole roles={['ADMIN', 'MANAGER', 'USER']} fallback={fallback}>
    {children}
  </RequireRole>
)