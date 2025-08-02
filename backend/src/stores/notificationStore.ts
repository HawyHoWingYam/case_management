// frontend/src/stores/notificationStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Notification, NotificationStats } from '@/hooks/useNotifications'

interface NotificationState {
  // 通知数据
  notifications: Notification[]
  unreadCount: number
  stats: NotificationStats | null

  // UI状态
  isNotificationPanelOpen: boolean
  lastFetchTime: number | null
  notificationPreferences: {
    enableSound: boolean
    enableDesktopNotifications: boolean
    markAsReadOnClick: boolean
    autoRefreshInterval: number // 秒
  }

  // 临时状态（不持久化）
  pendingActions: Set<number> // 正在处理的通知ID
  
  // Actions
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  updateNotification: (id: number, updates: Partial<Notification>) => void
  removeNotification: (id: number) => void
  setUnreadCount: (count: number) => void
  setStats: (stats: NotificationStats) => void
  
  // UI Actions
  toggleNotificationPanel: () => void
  setNotificationPanelOpen: (open: boolean) => void
  
  // Preferences Actions
  updatePreferences: (preferences: Partial<NotificationState['notificationPreferences']>) => void
  
  // Utility Actions
  markNotificationAsRead: (id: number) => void
  markNotificationAsUnread: (id: number) => void
  markAllAsRead: () => void
  clearAllNotifications: () => void
  
  // Pending Actions
  addPendingAction: (id: number) => void
  removePendingAction: (id: number) => void
  isPending: (id: number) => boolean
  
  // Refresh
  setLastFetchTime: (time: number) => void
  shouldRefresh: () => boolean
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      notifications: [],
      unreadCount: 0,
      stats: null,
      isNotificationPanelOpen: false,
      lastFetchTime: null,
      notificationPreferences: {
        enableSound: true,
        enableDesktopNotifications: true,
        markAsReadOnClick: true,
        autoRefreshInterval: 30, // 30秒
      },
      pendingActions: new Set(),

      // 通知数据操作
      setNotifications: (notifications) => {
        set((state) => {
          state.notifications = notifications
          state.unreadCount = notifications.filter(n => !n.is_read).length
          
          console.log('🔔 [NotificationStore] Set notifications:', {
            total: notifications.length,
            unread: state.unreadCount
          })
        })
      },

      addNotification: (notification) => {
        set((state) => {
          // 检查是否已存在，避免重复
          const existingIndex = state.notifications.findIndex(
            n => n.notification_id === notification.notification_id
          )
          
          if (existingIndex >= 0) {
            // 更新现有通知
            state.notifications[existingIndex] = notification
          } else {
            // 添加新通知到开头
            state.notifications.unshift(notification)
          }
          
          // 更新未读计数
          state.unreadCount = state.notifications.filter(n => !n.is_read).length
          
          console.log('🔔 [NotificationStore] Added notification:', {
            id: notification.notification_id,
            type: notification.type,
            isRead: notification.is_read,
            newUnreadCount: state.unreadCount
          })

          // 如果是新的未读通知，可以触发声音或桌面通知
          if (!notification.is_read) {
            const prefs = state.notificationPreferences
            
            // 播放声音
            if (prefs.enableSound && typeof window !== 'undefined') {
              try {
                // 这里可以播放通知声音
                console.log('🔔 [NotificationStore] Would play notification sound')
              } catch (error) {
                console.warn('🔔 [NotificationStore] Failed to play sound:', error)
              }
            }
            
            // 显示桌面通知
            if (prefs.enableDesktopNotifications && typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                try {
                  new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: `notification-${notification.notification_id}`,
                  })
                  console.log('🔔 [NotificationStore] Showed desktop notification')
                } catch (error) {
                  console.warn('🔔 [NotificationStore] Failed to show desktop notification:', error)
                }
              }
            }
          }
        })
      },

      updateNotification: (id, updates) => {
        set((state) => {
          const index = state.notifications.findIndex(n => n.notification_id === id)
          if (index >= 0) {
            Object.assign(state.notifications[index], updates)
            
            // 如果更新了已读状态，重新计算未读数量
            if ('is_read' in updates) {
              state.unreadCount = state.notifications.filter(n => !n.is_read).length
            }
            
            console.log('🔔 [NotificationStore] Updated notification:', {
              id,
              updates,
              newUnreadCount: state.unreadCount
            })
          }
        })
      },

      removeNotification: (id) => {
        set((state) => {
          const index = state.notifications.findIndex(n => n.notification_id === id)
          if (index >= 0) {
            const wasUnread = !state.notifications[index].is_read
            state.notifications.splice(index, 1)
            
            if (wasUnread) {
              state.unreadCount = Math.max(0, state.unreadCount - 1)
            }
            
            console.log('🔔 [NotificationStore] Removed notification:', {
              id,
              wasUnread,
              newUnreadCount: state.unreadCount
            })
          }
        })
      },

      setUnreadCount: (count) => {
        set((state) => {
          state.unreadCount = count
          console.log('🔔 [NotificationStore] Set unread count:', count)
        })
      },

      setStats: (stats) => {
        set((state) => {
          state.stats = stats
          state.unreadCount = stats.unreadCount
          console.log('🔔 [NotificationStore] Set stats:', stats)
        })
      },

      // UI状态操作
      toggleNotificationPanel: () => {
        set((state) => {
          state.isNotificationPanelOpen = !state.isNotificationPanelOpen
          console.log('🔔 [NotificationStore] Toggle panel:', state.isNotificationPanelOpen)
        })
      },

      setNotificationPanelOpen: (open) => {
        set((state) => {
          state.isNotificationPanelOpen = open
          console.log('🔔 [NotificationStore] Set panel open:', open)
        })
      },

      // 偏好设置
      updatePreferences: (preferences) => {
        set((state) => {
          Object.assign(state.notificationPreferences, preferences)
          console.log('🔔 [NotificationStore] Updated preferences:', preferences)
        })
      },

      // 实用操作
      markNotificationAsRead: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.notification_id === id)
          if (notification && !notification.is_read) {
            notification.is_read = true
            notification.read_at = new Date().toISOString()
            state.unreadCount = Math.max(0, state.unreadCount - 1)
            
            console.log('🔔 [NotificationStore] Marked as read:', {
              id,
              newUnreadCount: state.unreadCount
            })
          }
        })
      },

      markNotificationAsUnread: (id) => {
        set((state) => {
          const notification = state.notifications.find(n => n.notification_id === id)
          if (notification && notification.is_read) {
            notification.is_read = false
            notification.read_at = null
            state.unreadCount += 1
            
            console.log('🔔 [NotificationStore] Marked as unread:', {
              id,
              newUnreadCount: state.unreadCount
            })
          }
        })
      },

      markAllAsRead: () => {
        set((state) => {
          const now = new Date().toISOString()
          let markedCount = 0
          
          state.notifications.forEach(notification => {
            if (!notification.is_read) {
              notification.is_read = true
              notification.read_at = now
              markedCount++
            }
          })
          
          state.unreadCount = 0
          
          console.log('🔔 [NotificationStore] Marked all as read:', {
            markedCount,
            totalNotifications: state.notifications.length
          })
        })
      },

      clearAllNotifications: () => {
        set((state) => {
          const clearedCount = state.notifications.length
          state.notifications = []
          state.unreadCount = 0
          
          console.log('🔔 [NotificationStore] Cleared all notifications:', {
            clearedCount
          })
        })
      },

      // 待处理操作管理
      addPendingAction: (id) => {
        set((state) => {
          state.pendingActions.add(id)
          console.log('🔔 [NotificationStore] Added pending action:', id)
        })
      },

      removePendingAction: (id) => {
        set((state) => {
          state.pendingActions.delete(id)
          console.log('🔔 [NotificationStore] Removed pending action:', id)
        })
      },

      isPending: (id) => {
        return get().pendingActions.has(id)
      },

      // 刷新管理
      setLastFetchTime: (time) => {
        set((state) => {
          state.lastFetchTime = time
        })
      },

      shouldRefresh: () => {
        const { lastFetchTime, notificationPreferences } = get()
        if (!lastFetchTime) return true
        
        const now = Date.now()
        const refreshInterval = notificationPreferences.autoRefreshInterval * 1000
        
        return (now - lastFetchTime) >= refreshInterval
      },
    })),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      
      // 只持久化部分状态
      partialize: (state) => ({
        notificationPreferences: state.notificationPreferences,
        lastFetchTime: state.lastFetchTime,
        // 不持久化 notifications 和 UI 状态，每次刷新都重新获取
      }),
      
      // 版本管理
      version: 1,
      migrate: (persistedState: any, version: number) => {
        console.log('🔔 [NotificationStore] Migrating from version:', version)
        return persistedState
      },
      
      // 序列化时过滤掉不能序列化的字段
      serialize: (state) => {
        const { pendingActions, ...serializableState } = state as any
        return JSON.stringify(serializableState)
      },
      
      // 反序列化时恢复默认值
      deserialize: (str) => {
        const state = JSON.parse(str)
        return {
          ...state,
          pendingActions: new Set(), // 重新创建Set
        }
      },
    }
  )
)

// 便利的选择器
export const useNotificationCount = () => useNotificationStore((state) => state.unreadCount)
export const useNotificationPanel = () => useNotificationStore((state) => state.isNotificationPanelOpen)
export const useNotificationPreferences = () => useNotificationStore((state) => state.notificationPreferences)

// 请求桌面通知权限的辅助函数
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('🔔 [NotificationStore] Desktop notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission === 'denied') {
    console.warn('🔔 [NotificationStore] Desktop notifications denied')
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    
    console.log('🔔 [NotificationStore] Notification permission:', permission)
    
    // 更新偏好设置
    if (granted) {
      useNotificationStore.getState().updatePreferences({
        enableDesktopNotifications: true
      })
    }
    
    return granted
  } catch (error) {
    console.error('🔔 [NotificationStore] Failed to request notification permission:', error)
    return false
  }
}