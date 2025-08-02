'use client'

import { useState, useEffect } from 'react'
import { DashboardView, DashboardStats as IDashboardStats, QuickAction, RecentActivity, Case } from '@/types/dashboard'
import { useAuth } from './useAuth'
import { api } from '@/lib/api'

export interface DashboardData {
  stats: IDashboardStats
  recentActivity: RecentActivity[]
  cases: Case[]
}

export function useDashboard(initialView?: DashboardView) {
  const { user } = useAuth()
  const [currentView, setCurrentView] = useState<DashboardView>(initialView || 'my_cases')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const roleConfig = {
    ADMIN: {
      defaultView: 'new' as DashboardView,
      availableViews: ['new', 'pending_acceptance', 'my_cases'] as DashboardView[],
      permissions: {
        canAssignCases: true,
        canViewAllCases: true,
        canDeleteCases: true,
        canManageUsers: true
      }
    },
    MANAGER: {
      defaultView: 'pending_acceptance' as DashboardView,
      availableViews: ['pending_acceptance', 'my_cases', 'new'] as DashboardView[],
      permissions: {
        canAssignCases: true,
        canViewAllCases: true,
        canDeleteCases: false,
        canManageUsers: false
      }
    },
    USER: {
      defaultView: 'my_cases' as DashboardView,
      availableViews: ['my_cases'] as DashboardView[],
      permissions: {
        canAssignCases: false,
        canViewAllCases: false,
        canDeleteCases: false,
        canManageUsers: false
      }
    }
  }

  const currentRoleConfig = roleConfig[user?.role as keyof typeof roleConfig] || roleConfig.USER
  const availableViews = currentRoleConfig.availableViews
  const permissions = currentRoleConfig.permissions

  const quickActions: QuickAction[] = [
    {
      id: 'new-case',
      title: '新建案件',
      description: '创建新的案件',
      href: '/cases/new',
      variant: 'default'
    },
    {
      id: 'view-cases',
      title: '查看案件',
      description: '查看所有案件',
      href: '/cases',
      variant: 'outline'
    }
  ]

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setIsError(false)
      
      const [statsRes, casesRes] = await Promise.all([
        api.cases.getStats(),
        api.cases.getByView(currentView)
      ])

      console.log('🔍 [useDashboard] Debug - casesRes:', casesRes)
      console.log('🔍 [useDashboard] Debug - casesRes.data:', casesRes.data)
      console.log('🔍 [useDashboard] Debug - casesRes.data.data:', casesRes.data?.data)
      
      const newData: DashboardData = {
        stats: statsRes.data,
        recentActivity: [],
        cases: casesRes.data?.data || []
      }

      setDashboardData(newData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, currentView])

  const refresh = () => {
    fetchDashboardData()
  }

  return {
    stats: dashboardData?.stats || null,
    recentActivity: dashboardData?.recentActivity || [],
    myTasks: dashboardData?.cases || [],
    dashboardData,
    isLoading,
    isError,
    roleConfig: currentRoleConfig,
    quickActions,
    permissions,
    refresh,
    currentView,
    availableViews,
    setCurrentView
  }
}