// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

// 通知类型定义
export interface Notification {
  notification_id: number
  type: 'CASE_ASSIGNED' | 'CASE_ACCEPTED' | 'CASE_REJECTED' | 'CASE_STATUS_CHANGED' | 'CASE_PRIORITY_CHANGED' | 'CASE_COMMENT_ADDED' | 'SYSTEM_ANNOUNCEMENT'
  title: string
  message: string
  sender_id: number | null
  recipient_id: number
  case_id: number | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  metadata?: any
  sender?: {
    user_id: number
    username: string
    email: string
  }
  case?: {
    case_id: number
    title: string
    status: string
    priority: string
  }
}

export interface NotificationStats {
  unreadCount: number
  totalCount: number
  byType: Record<string, number>
  todayCount: number
}

export interface NotificationQuery {
  type?: string
  is_read?: boolean
  case_id?: number
  page?: number
  limit?: number
}

// 查询键定义
const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  lists: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
  list: (filters: NotificationQuery) => [...NOTIFICATION_KEYS.lists(), { filters }] as const,
  details: () => [...NOTIFICATION_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...NOTIFICATION_KEYS.details(), id] as const,
  stats: () => [...NOTIFICATION_KEYS.all, 'stats'] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unreadCount'] as const,
}

/**
 * 获取通知列表Hook
 */
export function useNotifications(query: NotificationQuery = {}) {
  const { isAuthenticated } = useAuthStore()

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.list(query),
    queryFn: async () => {
      console.log('🔔 [useNotifications] Fetching notifications with query:', query)
      const response = await api.notifications.getAll(query)
      console.log('🔔 [useNotifications] Fetched notifications:', response.data)
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30秒
    gcTime: 5 * 60 * 1000, // 5分钟
    refetchInterval: 60 * 1000, // 每分钟自动刷新
    refetchIntervalInBackground: false,
  })

  return {
    notifications: data?.data || [],
    meta: data?.meta || {},
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  }
}

/**
 * 获取通知统计Hook
 */
export function useNotificationStats() {
  const { isAuthenticated } = useAuthStore()

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.stats(),
    queryFn: async (): Promise<NotificationStats> => {
      console.log('🔔 [useNotificationStats] Fetching notification stats')
      const response = await api.notifications.getStats()
      console.log('🔔 [useNotificationStats] Fetched stats:', response.data)
      return {
        unreadCount: response.data.unread || 0,
        totalCount: response.data.total || 0,
        byType: response.data.byType || {},
        todayCount: response.data.todayCount || 0,
      }
    },
    enabled: isAuthenticated,
    staleTime: 10 * 1000, // 10秒
    gcTime: 2 * 60 * 1000, // 2分钟
    refetchInterval: 30 * 1000, // 每30秒自动刷新
    refetchIntervalInBackground: false,
  })

  return {
    stats: stats || { unreadCount: 0, totalCount: 0, byType: {}, todayCount: 0 },
    unreadCount: stats?.unreadCount || 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * 获取未读通知数量Hook（轻量版）
 */
export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuthStore()

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: async () => {
      console.log('🔔 [useUnreadNotificationCount] Fetching unread count')
      const response = await api.notifications.getUnreadCount()
      console.log('🔔 [useUnreadNotificationCount] Fetched count:', response.data)
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 1000, // 5秒
    gcTime: 1 * 60 * 1000, // 1分钟
    refetchInterval: 15 * 1000, // 每15秒自动刷新
    refetchIntervalInBackground: false,
  })

  return {
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * 获取单个通知详情Hook
 */
export function useNotification(id: number) {
  const { isAuthenticated } = useAuthStore()

  const {
    data: notification,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: NOTIFICATION_KEYS.detail(id),
    queryFn: async (): Promise<Notification> => {
      console.log('🔔 [useNotification] Fetching notification:', id)
      const response = await api.notifications.getAll({ notification_ids: [id] })
      const notification = response.data.notifications?.[0]
      console.log('🔔 [useNotification] Fetched notification:', notification)
      return notification
    },
    enabled: isAuthenticated && !!id,
    staleTime: 2 * 60 * 1000, // 2分钟
    gcTime: 5 * 60 * 1000, // 5分钟
  })

  return {
    notification,
    isLoading,
    isError,
    error,
  }
}

/**
 * 标记通知为已读Hook
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: number) => {
      console.log('🔔 [useMarkNotificationRead] Marking notification as read:', notificationId)
      const response = await api.notifications.markRead(notificationId)
      console.log('🔔 [useMarkNotificationRead] Marked as read:', response.data)
      return response.data
    },
    onSuccess: (updatedNotification, notificationId) => {
      // 更新缓存中的特定通知
      queryClient.setQueryData(
        NOTIFICATION_KEYS.detail(notificationId),
        updatedNotification
      )

      // 无效化并重新获取通知列表
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.stats() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })

      console.log('🔔 [useMarkNotificationRead] Cache updated for notification:', notificationId)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '标记已读失败'
      toast.error(message)
      console.error('🔔 [useMarkNotificationRead] Error:', error)
    },
  })
}

/**
 * 标记通知为未读Hook
 */
export function useMarkNotificationUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: number) => {
      console.log('🔔 [useMarkNotificationUnread] Marking notification as unread:', notificationId)
      // Note: Backend doesn't support mark unread, so skip this operation
      console.warn('🔔 [useMarkNotificationUnread] Mark unread not implemented in backend')
      return { success: false, message: 'Mark unread not implemented' }
    },
    onSuccess: (updatedNotification, notificationId) => {
      // 更新缓存
      queryClient.setQueryData(
        NOTIFICATION_KEYS.detail(notificationId),
        updatedNotification
      )

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.stats() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })

      console.log('🔔 [useMarkNotificationUnread] Cache updated for notification:', notificationId)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '标记未读失败'
      toast.error(message)
      console.error('🔔 [useMarkNotificationUnread] Error:', error)
    },
  })
}

/**
 * 批量标记已读Hook
 */
export function useBulkMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      notification_ids?: number[]
      type?: string
    }) => {
      console.log('🔔 [useBulkMarkRead] Bulk marking as read:', params)
      // Backend doesn't support bulk mark read, so use mark all
      const response = await api.notifications.markAllRead()
      console.log('🔔 [useBulkMarkRead] Using mark all instead:', response.data)
      return { updatedCount: response.data.count || 0 }
    },
    onSuccess: (result) => {
      // 无效化所有相关查询，让它们重新获取
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      
      toast.success(`成功标记 ${result.updatedCount} 个通知为已读`)
      console.log('🔔 [useBulkMarkRead] Bulk operation completed:', result)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '批量标记失败'
      toast.error(message)
      console.error('🔔 [useBulkMarkRead] Error:', error)
    },
  })
}

/**
 * 标记所有通知为已读Hook
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      console.log('🔔 [useMarkAllRead] Marking all notifications as read')
      const response = await api.notifications.markAllRead()
      console.log('🔔 [useMarkAllRead] All marked as read:', response.data)
      return { updatedCount: response.data.count || 0 }
    },
    onSuccess: (result) => {
      // 无效化所有相关查询
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
      
      toast.success(`成功标记所有 ${result.updatedCount} 个通知为已读`)
      console.log('🔔 [useMarkAllRead] All notifications marked as read:', result)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '标记所有已读失败'
      toast.error(message)
      console.error('🔔 [useMarkAllRead] Error:', error)
    },
  })
}

/**
 * 删除通知Hook
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: number) => {
      console.log('🔔 [useDeleteNotification] Deleting notification:', notificationId)
      const response = await api.notifications.delete(notificationId)
      console.log('🔔 [useDeleteNotification] Deleted:', response.data)
      return response.data
    },
    onSuccess: (result, notificationId) => {
      // 移除特定通知的缓存
      queryClient.removeQueries({ queryKey: NOTIFICATION_KEYS.detail(notificationId) })
      
      // 无效化列表和统计
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.stats() })
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })
      
      toast.success('通知删除成功')
      console.log('🔔 [useDeleteNotification] Notification deleted:', notificationId)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || '删除通知失败'
      toast.error(message)
      console.error('🔔 [useDeleteNotification] Error:', error)
    },
  })
}

/**
 * 通知操作的统一Hook
 */
export function useNotificationActions() {
  const markRead = useMarkNotificationRead()
  const markUnread = useMarkNotificationUnread()
  const bulkMarkRead = useBulkMarkRead()
  const markAllRead = useMarkAllRead()
  const deleteNotification = useDeleteNotification()

  // 智能标记已读（如果当前点击的通知未读，则标记为已读）
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    console.log('🔔 [useNotificationActions] Notification clicked:', notification)
    
    if (!notification.is_read) {
      try {
        await markRead.mutateAsync(notification.notification_id)
        console.log('🔔 [useNotificationActions] Auto-marked as read:', notification.notification_id)
      } catch (error) {
        console.error('🔔 [useNotificationActions] Failed to auto-mark as read:', error)
      }
    }

    // 如果通知有关联的案件，可以导航到案件详情页
    if (notification.case_id && notification.metadata?.actionUrl) {
      // 这里可以添加导航逻辑
      console.log('🔔 [useNotificationActions] Would navigate to:', notification.metadata.actionUrl)
    }
  }, [markRead])

  return {
    // 基础操作
    markRead: markRead.mutate,
    markUnread: markUnread.mutate,
    deleteNotification: deleteNotification.mutate,
    
    // 批量操作
    bulkMarkRead: bulkMarkRead.mutate,
    markAllRead: markAllRead.mutate,
    
    // 智能操作
    handleNotificationClick,
    
    // 加载状态
    isLoading: markRead.isPending || markUnread.isPending || bulkMarkRead.isPending || 
               markAllRead.isPending || deleteNotification.isPending,
  }
}