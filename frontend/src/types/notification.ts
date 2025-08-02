// frontend/src/types/notification.ts

export type NotificationType = 
  | 'CASE_ASSIGNED'
  | 'CASE_ACCEPTED' 
  | 'CASE_REJECTED'
  | 'CASE_STATUS_CHANGED'
  | 'CASE_PRIORITY_CHANGED'
  | 'CASE_COMMENT_ADDED'
  | 'SYSTEM_ANNOUNCEMENT'

export interface NotificationUser {
  user_id: number
  username: string
  email: string
}

export interface NotificationCase {
  case_id: number
  title: string
  status: string
  priority: string
}

export interface Notification {
  notification_id: number
  type: NotificationType
  title: string
  message: string
  sender_id: number | null
  recipient_id: number
  case_id: number | null
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  metadata?: NotificationMetadata
  sender?: NotificationUser
  case?: NotificationCase
}

export interface NotificationMetadata {
  casePriority?: string
  caseStatus?: string
  actionUrl?: string
  additionalInfo?: any
  [key: string]: any
}

export interface NotificationStats {
  unreadCount: number
  totalCount: number
  byType: Record<NotificationType, number>
  todayCount: number
}

export interface NotificationQuery {
  type?: NotificationType
  is_read?: boolean
  case_id?: number
  page?: number
  limit?: number
}

export interface CreateNotificationRequest {
  type: NotificationType
  title: string
  message: string
  sender_id?: number
  recipient_id: number
  case_id?: number
  metadata?: NotificationMetadata
}

export interface UpdateNotificationRequest {
  is_read?: boolean
  metadata?: NotificationMetadata
}

export interface BulkMarkReadRequest {
  notification_ids?: number[]
  type?: NotificationType
}

export interface NotificationPreferences {
  enableSound: boolean
  enableDesktopNotifications: boolean
  markAsReadOnClick: boolean
  autoRefreshInterval: number
  mutedTypes?: NotificationType[]
  quietHours?: {
    enabled: boolean
    start: string // HH:mm format
    end: string   // HH:mm format
  }
}

// 通知配置常量
export const NOTIFICATION_CONFIG = {
  TYPES: {
    CASE_ASSIGNED: {
      label: '案件指派',
      icon: 'UserPlus',
      color: 'blue',
      priority: 'high',
    },
    CASE_ACCEPTED: {
      label: '案件接受',
      icon: 'CheckCircle',
      color: 'green',
      priority: 'medium',
    },
    CASE_REJECTED: {
      label: '案件拒绝',
      icon: 'XCircle',
      color: 'red',
      priority: 'high',
    },
    CASE_STATUS_CHANGED: {
      label: '状态变更',
      icon: 'ArrowUpDown',
      color: 'purple',
      priority: 'medium',
    },
    CASE_PRIORITY_CHANGED: {
      label: '优先级变更',
      icon: 'Flag',
      color: 'orange',
      priority: 'medium',
    },
    CASE_COMMENT_ADDED: {
      label: '新评论',
      icon: 'MessageSquare',
      color: 'teal',
      priority: 'low',
    },
    SYSTEM_ANNOUNCEMENT: {
      label: '系统公告',
      icon: 'Megaphone',
      color: 'indigo',
      priority: 'high',
    },
  },
  
  REFRESH_INTERVALS: {
    FAST: 10, // 10秒
    NORMAL: 30, // 30秒
    SLOW: 60, // 1分钟
  },
  
  LIMITS: {
    MAX_NOTIFICATIONS_PER_PAGE: 50,
    DEFAULT_NOTIFICATIONS_PER_PAGE: 20,
    MAX_TITLE_LENGTH: 200,
    MAX_MESSAGE_LENGTH: 1000,
  },
} as const

// 工具函数类型
export type NotificationActionHandler = (notification: Notification) => void | Promise<void>
export type NotificationFilter = (notification: Notification) => boolean
export type NotificationSorter = (a: Notification, b: Notification) => number

// UI状态类型
export interface NotificationUIState {
  isLoading: boolean
  error: string | null
  selectedNotifications: Set<number>
  filters: {
    type?: NotificationType
    isRead?: boolean
    dateRange?: {
      start: Date
      end: Date
    }
    search?: string
  }
  sorting: {
    field: 'created_at' | 'type' | 'title' | 'is_read'
    direction: 'asc' | 'desc'
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

// API响应类型
export interface NotificationListResponse {
  data: Notification[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface NotificationActionResponse {
  success: boolean
  message: string
  updatedCount?: number
  data?: Notification
}

// 事件类型
export interface NotificationEvent {
  type: 'created' | 'updated' | 'deleted' | 'marked_read' | 'marked_unread'
  notification: Notification
  timestamp: Date
}

// 钩子返回类型
export interface UseNotificationsReturn {
  notifications: Notification[]
  meta: NotificationListResponse['meta']
  isLoading: boolean
  isError: boolean
  error: any
  refetch: () => void
  isRefetching: boolean
}

export interface UseNotificationStatsReturn {
  stats: NotificationStats
  unreadCount: number
  isLoading: boolean
  isError: boolean
  error: any
  refetch: () => void
}

export interface UseNotificationActionsReturn {
  markRead: (id: number) => void
  markUnread: (id: number) => void
  deleteNotification: (id: number) => void
  bulkMarkRead: (params: BulkMarkReadRequest) => void
  markAllRead: () => void
  handleNotificationClick: NotificationActionHandler
  isLoading: boolean
}