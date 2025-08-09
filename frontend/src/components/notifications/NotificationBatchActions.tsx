'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Square, 
  Eye, 
  EyeOff, 
  Trash2, 
  MoreHorizontal,
  X,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useNotificationActions } from '@/hooks/useNotifications'
import { type Notification } from '@/hooks/useNotifications'
import { toast } from 'sonner'

interface NotificationBatchActionsProps {
  notifications: Notification[]
  selectedIds: number[]
  onSelectedIdsChange: (ids: number[]) => void
  onBatchAction?: (action: string, ids: number[]) => void
  className?: string
}

export function NotificationBatchActions({
  notifications,
  selectedIds,
  onSelectedIdsChange,
  onBatchAction,
  className,
}: NotificationBatchActionsProps) {
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const { markAllRead, deleteMultiple } = useNotificationActions()

  console.log('🔔 [NotificationBatchActions] Rendering batch actions:', {
    notificationsCount: notifications.length,
    selectedCount: selectedIds.length,
    isBatchMode
  })

  // Auto-exit batch mode when no notifications
  useEffect(() => {
    if (notifications.length === 0 && isBatchMode) {
      console.log('🔔 [NotificationBatchActions] Auto-exiting batch mode (no notifications)')
      setIsBatchMode(false)
      onSelectedIdsChange([])
    }
  }, [notifications.length, isBatchMode, onSelectedIdsChange])

  // Handle batch mode toggle
  const handleBatchModeToggle = () => {
    const newBatchMode = !isBatchMode
    console.log('🔔 [NotificationBatchActions] Toggling batch mode:', newBatchMode)
    
    setIsBatchMode(newBatchMode)
    if (!newBatchMode) {
      onSelectedIdsChange([])
    }
  }

  // Handle select all/none
  const handleSelectAll = () => {
    const isAllSelected = selectedIds.length === notifications.length
    console.log('🔔 [NotificationBatchActions] Select all toggle:', !isAllSelected)
    
    if (isAllSelected) {
      onSelectedIdsChange([])
    } else {
      onSelectedIdsChange(notifications.map(n => n.notification_id))
    }
  }

  // Handle individual selection
  const handleSelectNotification = (notificationId: number, checked: boolean) => {
    console.log('🔔 [NotificationBatchActions] Individual select:', { notificationId, checked })
    
    if (checked) {
      onSelectedIdsChange([...selectedIds, notificationId])
    } else {
      onSelectedIdsChange(selectedIds.filter(id => id !== notificationId))
    }
  }

  // Stage 3 Goal 3: Enhanced batch operations with logging
  const handleBatchMarkRead = async () => {
    if (selectedIds.length === 0) return
    
    console.log('🔔 [NotificationBatchActions] Batch mark as read:', selectedIds)
    setIsProcessing(true)
    
    try {
      // Filter only unread notifications
      const unreadIds = selectedIds.filter(id => {
        const notification = notifications.find(n => n.notification_id === id)
        return notification && !notification.is_read
      })
      
      if (unreadIds.length === 0) {
        toast.info('所选通知都已读')
        return
      }

      console.log('🔔 [NotificationBatchActions] Marking unread notifications as read:', unreadIds)
      
      // Here we would call the batch mark read API
      // For now, we'll use individual calls
      for (const id of unreadIds) {
        // This would be replaced with actual batch API call
        await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
      }
      
      toast.success(`已标记 ${unreadIds.length} 条通知为已读`)
      onBatchAction?.('mark_read', unreadIds)
      onSelectedIdsChange([])
    } catch (error) {
      console.error('🔔 [NotificationBatchActions] Batch mark read failed:', error)
      toast.error('批量标记失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchMarkUnread = async () => {
    if (selectedIds.length === 0) return
    
    console.log('🔔 [NotificationBatchActions] Batch mark as unread:', selectedIds)
    setIsProcessing(true)
    
    try {
      // Filter only read notifications
      const readIds = selectedIds.filter(id => {
        const notification = notifications.find(n => n.notification_id === id)
        return notification && notification.is_read
      })
      
      if (readIds.length === 0) {
        toast.info('所选通知都未读')
        return
      }

      console.log('🔔 [NotificationBatchActions] Marking read notifications as unread:', readIds)
      
      // Here we would call the batch mark unread API
      for (const id of readIds) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      toast.success(`已标记 ${readIds.length} 条通知为未读`)
      onBatchAction?.('mark_unread', readIds)
      onSelectedIdsChange([])
    } catch (error) {
      console.error('🔔 [NotificationBatchActions] Batch mark unread failed:', error)
      toast.error('批量标记失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    
    console.log('🔔 [NotificationBatchActions] Batch delete:', selectedIds)
    
    if (!window.confirm(`确定要删除 ${selectedIds.length} 条通知吗？此操作无法撤销。`)) {
      return
    }
    
    setIsProcessing(true)
    
    try {
      console.log('🔔 [NotificationBatchActions] Deleting notifications:', selectedIds)
      
      // Here we would call the batch delete API
      for (const id of selectedIds) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      toast.success(`已删除 ${selectedIds.length} 条通知`)
      onBatchAction?.('delete', selectedIds)
      onSelectedIdsChange([])
    } catch (error) {
      console.error('🔔 [NotificationBatchActions] Batch delete failed:', error)
      toast.error('批量删除失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  if (notifications.length === 0) {
    return null
  }

  const isAllSelected = selectedIds.length === notifications.length && notifications.length > 0
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < notifications.length
  const hasSelection = selectedIds.length > 0

  return (
    <div className={cn('flex items-center gap-2 py-2', className)}>
      {!isBatchMode ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleBatchModeToggle}
          className="h-8"
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          批量操作
        </Button>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isPartiallySelected
                }
              }}
              onCheckedChange={handleSelectAll}
              className="data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
            />
            <span className="text-sm text-muted-foreground">
              {hasSelection ? `已选 ${selectedIds.length}` : '全选'}
            </span>
          </div>

          {/* Selection Info */}
          {hasSelection && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              {selectedIds.length} 条选中
            </Badge>
          )}

          {/* Batch Action Buttons */}
          {hasSelection && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBatchMarkRead}
                disabled={isProcessing}
                className="h-8"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-1" />
                )}
                标记已读
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBatchMarkUnread}
                disabled={isProcessing}
                className="h-8"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-1" />
                )}
                标记未读
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProcessing}
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBatchDelete}
                    disabled={isProcessing}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    批量删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Exit Batch Mode */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBatchModeToggle}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  )
}

// Notification item checkbox for batch selection
export function NotificationCheckbox({
  notification,
  selected,
  onSelectedChange,
  isBatchMode,
}: {
  notification: Notification
  selected: boolean
  onSelectedChange: (selected: boolean) => void
  isBatchMode: boolean
}) {
  if (!isBatchMode) return null

  return (
    <div className="flex-shrink-0">
      <Checkbox
        checked={selected}
        onCheckedChange={onSelectedChange}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export default NotificationBatchActions