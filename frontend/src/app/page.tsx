'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Clock, CheckCircle, AlertCircle, Plus, Activity } from 'lucide-react'
import Link from 'next/link'
import HealthStatus from '@/components/HealthStatus'
import { apiClient } from '@/lib/api'

export default function HomePage() {
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading')

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
    },
    {
      title: '活跃用户',
      value: '23',
      description: '在线用户 8 人',
      icon: Users,
      trend: '+2.1%',
      color: 'text-green-600',
    },
    {
      title: '待处理',
      value: '8',
      description: '优先级：高',
      icon: Clock,
      trend: '-12.5%',
      color: 'text-orange-600',
    },
    {
      title: '已完成',
      value: '148',
      description: '本月完成率 94%',
      icon: CheckCircle,
      trend: '+15.3%',
      color: 'text-green-600',
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

  return (
    <div className="space-y-6">
      {/* 页面标题和连接状态 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
          <p className="text-muted-foreground">
            欢迎回来！这里是您的案例管理概览。
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
          <Link href="/cases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建案例
            </Button>
          </Link>
        </div>
      </div>

      {/* 系统健康状态监控 */}
      <HealthStatus />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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

        {/* 快速操作 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>
              常用功能快速入口
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link href="/cases/new">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                创建新案例
              </Button>
            </Link>
            <Link href="/users">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                用户管理
              </Button>
            </Link>
            <Link href="/cases?priority=urgent">
              <Button className="w-full justify-start" variant="outline">
                <AlertCircle className="mr-2 h-4 w-4" />
                紧急案例
              </Button>
            </Link>
            <Link href="/dashboard/tasks">
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                今日任务
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 端到端测试提示 */}
      {connectionStatus === 'connected' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  🎉 端到端连接测试成功！
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  前端成功连接到后端 API，数据库连接正常。系统已准备就绪。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}