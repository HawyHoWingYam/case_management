// frontend/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock, CheckCircle, AlertCircle, Plus, LogIn } from 'lucide-react'
import Link from 'next/link'

import { Dashboard } from '@/components/dashboard/Dashboard'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { DashboardView } from '@/types/dashboard'

export default function HomePage() {
  const searchParams = useSearchParams()
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  const { isAuthenticated, user } = useAuthStore()

  // 从URL参数获取视图类型
  const viewFromUrl = searchParams?.get('view') as DashboardView
  const initialView = viewFromUrl || undefined

  // 解决水合不匹配问题
  useEffect(() => {
    setMounted(true)
  }, [])

  // 测试基本的 API 连接
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.system.getWelcome()
        setWelcomeMessage(response.data)
      } catch (error) {
        console.error('连接测试失败:', error)
      }
    }

    testConnection()
  }, [])

  if (!mounted) {
    return null // 避免水合不匹配
  }

  // 如果用户未登录，显示欢迎页面
  if (!isAuthenticated) {
    return <WelcomePage 
      welcomeMessage={welcomeMessage}
    />
  }

  // 用户已登录，显示角色驱动的仪表板
  return (
    <div className="space-y-6">
      {/* 用户欢迎信息 */}
      <UserWelcomeHeader 
        user={user} 
        welcomeMessage={welcomeMessage}
      />

      {/* 主仪表板 */}
      <Dashboard initialView={initialView} />
    </div>
  )
}

// 欢迎页面组件（未登录用户）
function WelcomePage({ 
  welcomeMessage
}: { 
  welcomeMessage: string
}) {
  return (
    <div className="space-y-6">
      {/* 欢迎部分 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          欢迎使用案例管理系统
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          一个现代化的案例管理解决方案，帮助您高效处理和追踪各类案例
        </p>
        {welcomeMessage && (
          <p className="text-sm text-green-600">
            🎉 {welcomeMessage}
          </p>
        )}
      </div>


      {/* 功能介绍 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>案例管理</CardTitle>
            <CardDescription>
              创建、编辑和跟踪案例，支持状态管理和优先级设置
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-green-600 mb-2" />
            <CardTitle>用户协作</CardTitle>
            <CardDescription>
              多用户协作，角色权限管理，支持案例分配和团队协作
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader>
            <CheckCircle className="h-8 w-8 text-purple-600 mb-2" />
            <CardTitle>数据统计</CardTitle>
            <CardDescription>
              案例处理进度跟踪和数据统计分析
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* 登录提示 */}
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <LogIn className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">开始使用</h3>
              <p className="text-sm text-muted-foreground">
                请登录您的账户以访问案例管理功能
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">
                <LogIn className="mr-2 h-4 w-4" />
                立即登录
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

// 用户欢迎头部组件
function UserWelcomeHeader({ 
  user, 
  welcomeMessage
}: {
  user: any
  welcomeMessage: string
}) {
  const getRoleLabel = (role: string) => {
    const labels = {
      'ADMIN': '管理员',
      'MANAGER': '经理',
      'USER': '用户'
    }
    return labels[role] || role
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回来，{user?.username}！
        </h1>
        <p className="text-muted-foreground">
          这里是您的案例管理仪表板，角色：
          <Badge variant="outline" className="ml-1">
            {getRoleLabel(user?.role)}
          </Badge>
        </p>
        {welcomeMessage && (
          <p className="text-sm text-green-600 mt-1">
            🎉 {welcomeMessage}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* 快速创建按钮 - 只有 ADMIN 和 USER 可以创建案例 */}
        {user && (user.role === 'ADMIN' || user.role === 'USER') && (
          <Link href="/cases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建案例
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

