'use client'

import React, { useEffect } from 'react'
import { Bell, BellRing, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  useNotifications, 
  useUnreadNotificationCount,
  useNotificationActions 
} from '@/hooks/useNotifications'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationItem } from './NotificationItem'
import { cn } from '@/lib/utils'

interface HeaderNotificationBellProps {
  className?: string
}

export function HeaderNotificationBell({ className }: HeaderNotificationBellProps) {
  const { notifications, isLoading, error, refetch } = useNotifications()
  const { unreadCount } = useUnreadNotificationCount()
  const { markRead, markAllRead } = useNotificationActions()

  const {
    isNotificationPanelOpen,
    setNotificationPanelOpen,
    notificationPreferences,
  } = useNotificationStore()

  // 添加调试日志
  useEffect(() => {
    console.log('🔔 [NotificationBell] Component mounted', {
      unreadCount: unreadCount || 0,
      isLoading,
      hasError: !!error,
      notificationsCount: notifications?.length || 0,
      isPopoverOpen: isNotificationPanelOpen,
    })
  }, [unreadCount, isLoading, error, notifications?.length, isNotificationPanelOpen])

  // 自动刷新通知
  useEffect(() => {
    if (notificationPreferences?.autoRefreshInterval && !isLoading) {
      const interval = setInterval(() => {
        console.log('🔔 [NotificationBell] Auto-refreshing notifications')
        refetch()
      }, notificationPreferences.autoRefreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [notificationPreferences?.autoRefreshInterval, isLoading, refetch])

  const handleTogglePopover = (open: boolean) => {
    console.log('🔔 [NotificationBell] Toggle popover:', open)
    setNotificationPanelOpen(open)
    
    if (open && !isLoading) {
      console.log('🔔 [NotificationBell] Fetching notifications on open')
      refetch()
    }
  }

  const handleNotificationClick = async (notificationId: number) => {
    console.log('🔔 [NotificationBell] Notification clicked:', notificationId)
    
    if (notificationPreferences?.markAsReadOnClick) {
      try {
        markRead(notificationId)
        console.log('🔔 [NotificationBell] Marked notification as read:', notificationId)
      } catch (error) {
        console.error('🔔 [NotificationBell] Failed to mark as read:', error)
      }
    }
  }

  const handleMarkAllAsRead = async () => {
    console.log('🔔 [NotificationBell] Mark all as read clicked')
    try {
      markAllRead()
      console.log('🔔 [NotificationBell] All notifications marked as read')
    } catch (error) {
      console.error('🔔 [NotificationBell] Failed to mark all as read:', error)
    }
  }

  const safeUnreadCount = unreadCount || 0
  const hasUnread = safeUnreadCount > 0
  const displayCount = safeUnreadCount > 99 ? '99+' : safeUnreadCount.toString()

  return (
    <Popover open={isNotificationPanelOpen} onOpenChange={handleTogglePopover}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative h-9 w-9 rounded-full',
            hasUnread && 'text-orange-600 hover:text-orange-700',
            className
          )}
          aria-label={`通知 ${hasUnread ? `(${safeUnreadCount} 条未读)` : ''}`}
        >
          {hasUnread ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
            >
              {displayCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">通知</h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isLoading}
              className="h-8 px-2 text-xs"
            >
              全部已读
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && (!notifications || notifications.length === 0) ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Circle className="h-4 w-4 animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="text-sm text-red-600 text-center">
                加载通知失败
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="mt-2 h-8 px-2 text-xs"
              >
                重试
              </Button>
            </div>
          ) : (!notifications || notifications.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground text-center">
                暂无通知
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification.notification_id)}
                />
              ))}
              
              {notifications.length > 10 && (
                <div className="p-3 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // 这里可以导航到完整的通知页面
                      console.log('🔔 [NotificationBell] View all notifications clicked')
                      setNotificationPanelOpen(false)
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground"
                  >
                    查看全部 ({notifications.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 快速操作区域 */}
        {notifications && notifications.length > 0 && (
          <div className="border-t p-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>共 {notifications.length} 条通知</span>
              {safeUnreadCount > 0 && (
                <span>{safeUnreadCount} 条未读</span>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default HeaderNotificationBell