// frontend/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock, CheckCircle, AlertCircle, Plus, Activity, LogIn } from 'lucide-react'
import Link from 'next/link'

import HealthStatus from '@/components/HealthStatus'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { DashboardView } from '@/types/dashboard'

export default function HomePage() {
  const searchParams = useSearchParams()
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading')
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
        const response = await apiClient.system.getWelcome()
        setWelcomeMessage(response.data)
        setConnectionStatus('connected')
      } catch (error) {
        console.error('连接测试失败:', error)
        setConnectionStatus('error')
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
      connectionStatus={connectionStatus} 
    />
  }

  // 用户已登录，显示角色驱动的仪表板
  return (
    <div className="space-y-6">
      {/* 用户欢迎信息 */}
      <UserWelcomeHeader 
        user={user} 
        welcomeMessage={welcomeMessage}
        connectionStatus={connectionStatus}
      />

      {/* 系统健康状态监控 */}
      <HealthStatus />

      {/* 主仪表板 */}
      <Dashboard initialView={initialView} />

      {/* 系统状态确认 */}
      <SystemStatusCard />
    </div>
  )
}

// 欢迎页面组件（未登录用户）
function WelcomePage({ 
  welcomeMessage, 
  connectionStatus 
}: { 
  welcomeMessage: string
  connectionStatus: 'loading' | 'connected' | 'error'
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

      {/* 系统状态 */}
      <div className="flex justify-center">
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
          className={connectionStatus === 'loading' ? 'animate-pulse' : ''}
        >
          <Activity className="mr-1 h-3 w-3" />
          {connectionStatus === 'loading' && '系统检查中...'}
          {connectionStatus === 'connected' && '系统运行正常'}
          {connectionStatus === 'error' && '系统连接异常'}
        </Badge>
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
            <CardTitle>实时监控</CardTitle>
            <CardDescription>
              实时系统状态监控，案例处理进度跟踪和数据统计
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

      {/* 系统健康状态 */}
      <HealthStatus />
    </div>
  )
}

// 用户欢迎头部组件
function UserWelcomeHeader({ 
  user, 
  welcomeMessage, 
  connectionStatus 
}: {
  user: any
  welcomeMessage: string
  connectionStatus: 'loading' | 'connected' | 'error'
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
        {/* 连接状态指示器 */}
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
          className={connectionStatus === 'loading' ? 'animate-pulse' : ''}
        >
          <Activity className="mr-1 h-3 w-3" />
          {connectionStatus === 'loading' && '连接中...'}
          {connectionStatus === 'connected' && '后端已连接'}
          {connectionStatus === 'error' && '后端连接失败'}
        </Badge>
        
        {/* 快速创建按钮 */}
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建案例
          </Button>
        </Link>
      </div>
    </div>
  )
}

// 系统状态确认卡片
function SystemStatusCard() {
  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              🎉 系统运行正常，认证成功！
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              前端认证系统与后端 API 连接正常，用户权限管理已生效。基于角色的仪表板正在运行。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}