'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  UserPlus,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Flag,
  MessageSquare,
  Megaphone,
  FileText,
  MoreHorizontal,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { type Notification } from '@/hooks/useNotifications'
import { useMarkNotificationRead, useMarkNotificationUnread, useDeleteNotification } from '@/hooks/useNotifications'
import { toast } from 'sonner'

interface NotificationItemProps {
  notification: Notification
  onClick?: () => void
  className?: string
  showActions?: boolean
  compact?: boolean
}

// Stage 3 Goal 3: Enhanced notification type icons with completion workflow support
const notificationIcons = {
  CASE_ASSIGNED: UserPlus,
  CASE_ACCEPTED: CheckCircle,
  CASE_REJECTED: XCircle,
  CASE_STATUS_CHANGED: ArrowUpDown,
  CASE_PRIORITY_CHANGED: Flag,
  CASE_COMMENT_ADDED: MessageSquare,
  SYSTEM_ANNOUNCEMENT: Megaphone,
}

// Enhanced notification colors with completion workflow support
const notificationColors = {
  CASE_ASSIGNED: 'text-blue-600 bg-blue-100',
  CASE_ACCEPTED: 'text-green-600 bg-green-100',
  CASE_REJECTED: 'text-red-600 bg-red-100',
  CASE_STATUS_CHANGED: 'text-purple-600 bg-purple-100',
  CASE_PRIORITY_CHANGED: 'text-orange-600 bg-orange-100',
  CASE_COMMENT_ADDED: 'text-teal-600 bg-teal-100',
  SYSTEM_ANNOUNCEMENT: 'text-indigo-600 bg-indigo-100',
}

// Enhanced notification labels with completion workflow support
const notificationLabels = {
  CASE_ASSIGNED: '案件指派',
  CASE_ACCEPTED: '案件接受',
  CASE_REJECTED: '案件拒绝',
  CASE_STATUS_CHANGED: '状态变更',
  CASE_PRIORITY_CHANGED: '优先级变更',
  CASE_COMMENT_ADDED: '新评论',
  SYSTEM_ANNOUNCEMENT: '系统公告',
}

// Stage 3 Goal 3: Function to get enhanced notification styling based on metadata
const getEnhancedNotificationStyle = (notification: Notification) => {
  console.log('🔔 [NotificationItem] Getting enhanced style for notification:', {
    id: notification.notification_id,
    type: notification.type,
    metadata: notification.metadata
  })
  
  // Check if this is a completion workflow notification
  if (notification.metadata?.action_type) {
    const actionType = notification.metadata.action_type
    console.log('🔔 [NotificationItem] Enhanced notification detected:', actionType)
    
    switch (actionType) {
      case 'COMPLETION_REQUEST':
        return {
          icon: Flag,
          color: 'text-amber-600 bg-amber-100',
          label: '完成审批请求',
          priority: 'high'
        }
      case 'COMPLETION_APPROVED':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600 bg-emerald-100',
          label: '完成已批准',
          priority: 'high'
        }
      case 'COMPLETION_REJECTED':
        return {
          icon: XCircle,
          color: 'text-rose-600 bg-rose-100',
          label: '完成被拒绝',
          priority: 'high'
        }
    }
  }
  
  // Return default styling
  return {
    icon: notificationIcons[notification.type] || FileText,
    color: notificationColors[notification.type] || 'text-gray-600 bg-gray-100',
    label: notificationLabels[notification.type] || notification.type,
    priority: 'normal'
  }
}

export function NotificationItem({
  notification,
  onClick,
  className,
  showActions = true,
  compact = false,
}: NotificationItemProps) {
  const markRead = useMarkNotificationRead()
  const markUnread = useMarkNotificationUnread()
  const deleteNotification = useDeleteNotification()

  console.log('🔔 [NotificationItem] Rendering notification:', {
    id: notification.notification_id,
    type: notification.type,
    isRead: notification.is_read,
    title: notification.title,
    metadata: notification.metadata
  })

  // Stage 3 Goal 3: Get enhanced notification styling
  const enhancedStyle = getEnhancedNotificationStyle(notification)
  const IconComponent = enhancedStyle.icon
  const iconColorClass = enhancedStyle.color
  const typeLabel = enhancedStyle.label

  // 格式化时间
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  // 处理标记已读/未读
  const handleToggleRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    console.log('🔔 [NotificationItem] Toggle read state:', {
      id: notification.notification_id,
      currentState: notification.is_read
    })

    try {
      if (notification.is_read) {
        await markUnread.mutateAsync(notification.notification_id)
        toast.success('已标记为未读')
      } else {
        await markRead.mutateAsync(notification.notification_id)
        toast.success('已标记为已读')
      }
    } catch (error) {
      console.error('🔔 [NotificationItem] Toggle read failed:', error)
    }
  }

  // 处理删除
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    console.log('🔔 [NotificationItem] Delete notification:', notification.notification_id)

    if (!window.confirm('确定要删除这条通知吗？')) {
      return
    }

    try {
      await deleteNotification.mutateAsync(notification.notification_id)
    } catch (error) {
      console.error('🔔 [NotificationItem] Delete failed:', error)
    }
  }

  // 获取案件链接
  const getCaseLink = () => {
    if (notification.case_id) {
      return `/cases/${notification.case_id}`
    }
    return notification.metadata?.actionUrl
  }

  const caseLink = getCaseLink()

  return (
    <Card
      className={cn(
        'p-3 transition-all duration-200 hover:shadow-sm border-0 bg-transparent',
        !notification.is_read && 'bg-primary/5',
        compact && 'p-2',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* 通知图标 */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          iconColorClass,
          compact && 'w-6 h-6'
        )}>
          <IconComponent className={cn('w-4 h-4', compact && 'w-3 h-3')} />
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 标题和类型 */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  'font-medium text-sm truncate',
                  !notification.is_read && 'font-semibold'
                )}>
                  {notification.title}
                </h4>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-xs px-1.5 py-0.5 h-auto',
                    compact && 'text-[10px] px-1'
                  )}
                >
                  {typeLabel}
                </Badge>
              </div>

              {/* 消息内容 */}
              <p className={cn(
                'text-sm text-muted-foreground line-clamp-2 leading-relaxed',
                compact && 'text-xs line-clamp-1'
              )}>
                {notification.message}
              </p>

              {/* 元信息 */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-muted-foreground">
                  {timeAgo}
                </span>

                {/* 发送者信息 */}
                {notification.sender && (
                  <span className="text-xs text-muted-foreground">
                    来自 {notification.sender.username}
                  </span>
                )}

                {/* 案件信息 */}
                {notification.case && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {notification.case.title}
                    </span>
                  </div>
                )}

                {/* 未读指示器 */}
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            {showActions && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* 案件链接 */}
                {caseLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={caseLink}>
                      <ExternalLink className="w-3 h-3" />
                      <span className="sr-only">查看案件</span>
                    </Link>
                  </Button>
                )}

                {/* 更多操作 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                      <span className="sr-only">更多操作</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={handleToggleRead}
                      disabled={markRead.isPending || markUnread.isPending}
                    >
                      {notification.is_read ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          标记未读
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          标记已读
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    {caseLink && (
                      <DropdownMenuItem asChild>
                        <Link href={caseLink} onClick={(e) => e.stopPropagation()}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          查看案件
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={deleteNotification.isPending}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 紧凑版通知项
export function CompactNotificationItem({
  notification,
  onClick,
  className,
}: Omit<NotificationItemProps, 'compact' | 'showActions'>) {
  return (
    <NotificationItem
      notification={notification}
      onClick={onClick}
      className={className}
      compact={true}
      showActions={false}
    />
  )
}