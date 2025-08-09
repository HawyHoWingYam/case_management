'use client'

import React, { useEffect, useState } from 'react'
import { Bell, BellRing, Circle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  useNotifications, 
  useUnreadNotificationCount,
  useNotificationActions 
} from '@/hooks/useNotifications'
import { useNotificationStore } from '@/stores/notificationStore'
import { NotificationItem } from './NotificationItem'
import NotificationFilters, { type NotificationFilters } from './NotificationFilters'
import NotificationBatchActions, { NotificationCheckbox } from './NotificationBatchActions'
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

  // Stage 3 Goal 3: Enhanced notification filtering and batch operations state
  const [filters, setFilters] = useState<NotificationFilters>({
    types: [],
    status: 'all',
    dateRange: 'all',
    search: '',
    priority: 'all',
    actionType: [],
  })
  
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState('all')

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

  // Stage 3 Goal 3: Enhanced notification filtering logic
  const getFilteredNotifications = () => {
    if (!notifications) return []
    
    console.log('🔔 [NotificationBell] Filtering notifications:', {
      totalCount: notifications.length,
      filters,
      activeTab
    })

    let filtered = [...notifications]

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.is_read)
    } else if (activeTab === 'read') {
      filtered = filtered.filter(n => n.is_read)
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(n => 
        filters.status === 'read' ? n.is_read : !n.is_read
      )
    }

    // Filter by types
    if (filters.types.length > 0) {
      filtered = filtered.filter(n => filters.types.includes(n.type))
    }

    // Filter by action types (Stage 3 Goal 3: Completion workflow)
    if (filters.actionType.length > 0) {
      filtered = filtered.filter(n => 
        n.metadata?.action_type && filters.actionType.includes(n.metadata.action_type)
      )
    }

    // Filter by search
    if (filters.search.trim()) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search) ||
        n.sender?.username?.toLowerCase().includes(search) ||
        n.case?.title?.toLowerCase().includes(search)
      )
    }

    // Filter by priority (based on metadata)
    if (filters.priority !== 'all') {
      filtered = filtered.filter(n => {
        if (filters.priority === 'high') {
          return n.metadata?.action_type && [
            'COMPLETION_REQUEST',
            'COMPLETION_APPROVED', 
            'COMPLETION_REJECTED'
          ].includes(n.metadata.action_type)
        }
        return true
      })
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(n => new Date(n.created_at) >= filterDate)
    }

    console.log('🔔 [NotificationBell] Filtered notifications:', {
      originalCount: notifications.length,
      filteredCount: filtered.length,
      filters
    })

    return filtered
  }

  const filteredNotifications = getFilteredNotifications()

  // Handle batch operations
  const handleBatchAction = (action: string, ids: number[]) => {
    console.log('🔔 [NotificationBell] Batch action:', { action, ids })
    
    switch (action) {
      case 'mark_read':
      case 'mark_unread':
      case 'delete':
        refetch() // Refresh notifications after batch operation
        break
    }
  }

  // Clear selections when popover closes
  useEffect(() => {
    if (!isNotificationPanelOpen) {
      setSelectedIds([])
    }
  }, [isNotificationPanelOpen])

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
        className="w-[480px] p-0" 
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">通知中心</h3>
          <div className="flex items-center gap-2">
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 py-2 border-b">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                全部 {notifications ? `(${notifications.length})` : ''}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                未读 {safeUnreadCount > 0 ? `(${safeUnreadCount})` : ''}
              </TabsTrigger>
              <TabsTrigger value="read" className="text-xs">
                已读
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-2 border-b">
            <NotificationFilters
              filters={filters}
              onFiltersChange={setFilters}
              notificationCounts={{
                total: notifications?.length || 0,
                unread: safeUnreadCount,
                byType: {}, // This would be calculated from notifications
              }}
            />
          </div>

          <div className="px-2">
            <NotificationBatchActions
              notifications={filteredNotifications}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              onBatchAction={handleBatchAction}
            />
          </div>

          <TabsContent value={activeTab} className="mt-0">
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
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <div className="text-sm text-muted-foreground text-center">
                    {notifications && notifications.length > 0 ? '没有符合条件的通知' : '暂无通知'}
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.slice(0, 20).map((notification) => (
                    <div key={notification.notification_id} className="flex items-start gap-2 px-2">
                      <NotificationCheckbox
                        notification={notification}
                        selected={selectedIds.includes(notification.notification_id)}
                        onSelectedChange={(selected) => {
                          if (selected) {
                            setSelectedIds([...selectedIds, notification.notification_id])
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== notification.notification_id))
                          }
                        }}
                        isBatchMode={selectedIds.length > 0 || false} // Simple batch mode detection
                      />
                      <div className="flex-1">
                        <NotificationItem
                          notification={notification}
                          onClick={() => handleNotificationClick(notification.notification_id)}
                          compact
                        />
                      </div>
                    </div>
                  ))}
                  
                  {filteredNotifications.length > 20 && (
                    <div className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('🔔 [NotificationBell] View all notifications clicked')
                          setNotificationPanelOpen(false)
                        }}
                        className="h-8 px-2 text-xs text-muted-foreground"
                      >
                        查看全部 ({filteredNotifications.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 统计信息 */}
          {filteredNotifications.length > 0 && (
            <div className="border-t p-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  显示 {Math.min(filteredNotifications.length, 20)} / {filteredNotifications.length} 条通知
                </span>
                {selectedIds.length > 0 && (
                  <span>{selectedIds.length} 条已选中</span>
                )}
              </div>
            </div>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default HeaderNotificationBell