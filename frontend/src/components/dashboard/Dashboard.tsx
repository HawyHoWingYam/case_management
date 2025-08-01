// frontend/src/components/dashboard/Dashboard.tsx
'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'

import { useDashboard } from '@/hooks/useDashboardData'
import { DashboardView } from '@/types/dashboard'

interface DashboardProps {
  initialView?: DashboardView
  className?: string
}

export function Dashboard({ initialView, className }: DashboardProps) {
  const {
    stats,
    recentActivity,
    myTasks,
    dashboardData,
    isLoading,
    isError,
    roleConfig,
    quickActions,
    permissions,
    refresh,
    currentView,
    availableViews,
  } = useDashboard(initialView)

  if (isError) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>加载仪表板数据失败，请稍后重试</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={refresh}
              className="h-auto p-1"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 视图切换和刷新 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
          <p className="text-muted-foreground">
            当前视图：
            <Badge variant="outline" className="ml-1">
              {currentView}
            </Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计数据 */}
      {isLoading ? (
        <DashboardStatsSkeleton />
      ) : (
        <DashboardStats 
          stats={stats} 
          roleConfig={roleConfig}
          className="mb-6"
        />
      )}

      {/* 主要内容区域 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* 快速操作 */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <QuickActionsSkeleton />
          ) : (
            <QuickActions 
              actions={quickActions}
              permissions={permissions}
            />
          )}
        </div>

        {/* 最近活动 */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <RecentActivitySkeleton />
          ) : (
            <RecentActivity 
              activities={recentActivity || []}
            />
          )}
        </div>

        {/* 最近案件 */}
        <div className="lg:col-span-1">
          {isLoading ? (
            <RecentCasesSkeleton />
          ) : (
            <RecentCases 
              cases={myTasks || []}
              viewType={currentView}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// 骨架屏组件
function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

function RecentActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <Skeleton className="h-2 w-2 rounded-full mt-2" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentCasesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <div className="flex space-x-1">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Individual dashboard components - simplified versions
interface DashboardStatsProps {
  stats?: any
  roleConfig?: any
  className?: string
}

function DashboardStats({ stats, roleConfig, className }: DashboardStatsProps) {
  if (!stats) return <div className="text-center py-4">No stats available</div>

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总案件数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCases || 0}</div>
          <p className="text-xs text-muted-foreground">系统中的案件总数</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待处理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCases || 0}</div>
          <p className="text-xs text-muted-foreground">等待处理的案件</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">进行中</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgressCases || 0}</div>
          <p className="text-xs text-muted-foreground">正在处理的案件</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已解决</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.resolvedCases || 0}</div>
          <p className="text-xs text-muted-foreground">已成功解决的案件</p>
        </CardContent>
      </Card>
    </div>
  )
}

interface QuickActionsProps {
  actions: any[]
  permissions: any
}

function QuickActions({ actions, permissions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
        <CardDescription>常用功能快速入口</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || "outline"}
            className="justify-start h-auto p-3"
            asChild
          >
            <a href={action.href}>
              <div className="flex items-center space-x-3">
                <div className="flex-1 text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </div>
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

interface RecentActivityProps {
  activities: any[]
}

function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近活动</CardTitle>
        <CardDescription>系统中的最新动态</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无最近活动
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-3 border-b last:border-b-0"
              >
                <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RecentCasesProps {
  cases: any[]
  viewType: DashboardView
}

function RecentCases({ cases, viewType }: RecentCasesProps) {
  const getViewTitle = (view: DashboardView) => {
    const titles = {
      'my_cases': '我的案件',
      'assigned': '指派给我的',
      'created': '我创建的',
      'team': '团队案件',
      'urgent': '紧急案件',
      'pending': '待处理案件',
      'in_progress': '进行中案件',
      'resolved': '已解决案件',
      'all': '最近案件',
      'overview': '最近案件',
    }
    return titles[view] || '最近案件'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getViewTitle(viewType)}</CardTitle>
        <CardDescription>
          {cases.length > 0 ? `显示最近的 ${cases.length} 个案件` : '暂无案件'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cases.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无相关案件
          </p>
        ) : (
          <div className="space-y-4">
            {cases.slice(0, 5).map((caseItem) => (
              <div
                key={caseItem.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => window.location.href = `/cases/${caseItem.id}`}
              >
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {caseItem.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(caseItem.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {caseItem.status}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {caseItem.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {cases.length > 5 && (
          <div className="pt-4">
            <Button variant="outline" className="w-full" asChild>
              <a href="/cases">查看所有案件</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}