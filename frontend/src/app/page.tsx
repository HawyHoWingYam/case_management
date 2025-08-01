'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock, CheckCircle, AlertCircle, Plus, Activity, LogIn } from 'lucide-react'
import Link from 'next/link'
import HealthStatus from '@/components/HealthStatus'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { RequireRole } from '@/components/auth/RoleGuard'

export default function HomePage() {
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [mounted, setMounted] = useState(false)

  const { isAuthenticated, user } = useAuthStore()

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

  // 模拟统计数据
  const stats = [
    {
      title: '总案例数',
      value: '156',
      description: '本月新增 12 个',
      icon: FileText,
      trend: '+8.2%',
      color: 'text-blue-600',
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      title: '活跃用户',
      value: '23',
      description: '在线用户 8 人',
      icon: Users,
      trend: '+2.1%',
      color: 'text-green-600',
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      title: '待处理',
      value: '8',
      description: '优先级：高',
      icon: Clock,
      trend: '-12.5%',
      color: 'text-orange-600',
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
    {
      title: '已完成',
      value: '148',
      description: '本月完成率 94%',
      icon: CheckCircle,
      trend: '+15.3%',
      color: 'text-green-600',
      roles: ['ADMIN', 'MANAGER', 'USER'],
    },
  ]

  // 模拟最近案例
  const recentCases = [
    {
      id: 1,
      title: '系统登录问题排查',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assignee: '张三',
      createdAt: '2小时前',
    },
    {
      id: 2,
      title: '数据库性能优化',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignee: '李四',
      createdAt: '4小时前',
    },
    {
      id: 3,
      title: '用户权限配置',
      status: 'RESOLVED',
      priority: 'LOW',
      assignee: '王五',
      createdAt: '1天前',
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'IN_PROGRESS': { label: '进行中', variant: 'default' as const },
      'PENDING': { label: '待处理', variant: 'secondary' as const },
      'RESOLVED': { label: '已解决', variant: 'outline' as const },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'default' as const }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      'HIGH': { label: '高', variant: 'destructive' as const },
      'MEDIUM': { label: '中', variant: 'default' as const },
      'LOW': { label: '低', variant: 'secondary' as const },
    }
    return priorityMap[priority as keyof typeof priorityMap] || { label: priority, variant: 'default' as const }
  }

  // 检查用户是否有权限查看统计数据
  const canViewStat = (roles: string[]) => {
    if (!isAuthenticated || !user) return false
    return roles.includes(user.role)
  }

  if (!mounted) {
    return null // 避免水合不匹配
  }

  // 如果用户未登录，显示欢迎页面
  if (!isAuthenticated) {
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

  // 用户已登录，显示仪表板
  return (
    <div className="space-y-6">
      {/* 页面标题和连接状态 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            欢迎回来，{user?.username}！
          </h1>
          <p className="text-muted-foreground">
            这里是您的案例管理概览，角色：
            <Badge variant="outline" className="ml-1">
              {user?.role === 'ADMIN' ? '管理员' : user?.role === 'MANAGER' ? '经理' : '用户'}
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
          <RequireRole roles={['ADMIN', 'MANAGER', 'USER']}>
            <Link href="/cases/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新建案例
              </Button>
            </Link>
          </RequireRole>
        </div>
      </div>

      {/* 系统健康状态监控 */}
      <HealthStatus />

      {/* 统计卡片 - 根据角色权限显示 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats
          .filter(stat => canViewStat(stat.roles))
          .map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center pt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* 最近案例和快速操作 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 最近案例 */}
        <RequireRole roles={['ADMIN', 'MANAGER', 'USER']}>
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>最近案例</CardTitle>
              <CardDescription>
                最新创建和更新的案例列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {caseItem.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        负责人：{caseItem.assignee} • {caseItem.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge {...getPriorityBadge(caseItem.priority)}>
                        {getPriorityBadge(caseItem.priority).label}
                      </Badge>
                      <Badge {...getStatusBadge(caseItem.status)}>
                        {getStatusBadge(caseItem.status).label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <Link href="/cases">
                  <Button variant="outline" className="w-full">
                    查看所有案例
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </RequireRole>

        {/* 快速操作 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用功能快速入口
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RequireRole roles={['ADMIN', 'MANAGER', 'USER']}>
              <Link href="/cases/new">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  创建新案例
                </Button>
              </Link>
            </RequireRole>
            
            <RequireRole roles={['ADMIN']}>
              <Link href="/users">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  用户管理
                </Button>
              </Link>
            </RequireRole>
            
            <RequireRole roles={['ADMIN', 'MANAGER', 'USER']}>
              <Link href="/cases?priority=urgent">
                <Button className="w-full justify-start" variant="outline">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  紧急案例
                </Button>
              </Link>
            </RequireRole>
            
            <RequireRole roles={['ADMIN', 'MANAGER', 'USER']}>
              <Link href="/dashboard/tasks">
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  今日任务
                </Button>
              </Link>
            </RequireRole>
          </CardContent>
        </Card>
      </div>

      {/* 认证成功提示 */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                🎉 系统运行正常，认证成功！
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                前端认证系统与后端 API 连接正常，用户权限管理已生效。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}