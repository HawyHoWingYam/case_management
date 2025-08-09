// frontend/src/lib/api.ts
import axios, { AxiosResponse } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// 基础API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

console.log('🔍 [API] Base URL:', API_BASE_URL)
console.log('🔍 [API] Environment NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
console.log('🔍 [API] Default URL would be:', 'http://localhost:3001/api')

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    console.log('🔍 [API] Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token
    })
    
    return config
  },
  (error) => {
    console.error('🔍 [API] Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
apiClient.interceptors.response.use(
  (response) => {
    console.log('🔍 [API] Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data?.data ? 'Has data' : 'No data'
    })
    return response
  },
  (error) => {
    const errorInfo = {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    }
    console.error('🔍 [API] Response Error:', errorInfo)

    // 如果是401错误，清除认证状态并重定向到登录页
    if (error.response?.status === 401) {
      console.log('🔍 [API] 401 Error - clearing auth state')
      useAuthStore.getState().logout()
      
      // 只在浏览器环境中进行重定向
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// =================== 类型定义 ===================

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: {
    user_id: number
    username: string
    email: string
    role: string
  }
}

export interface Case {
  id: number
  case_id: number
  title: string
  description?: string
  status: string
  priority: string
  created_by_id: number
  assigned_to_id?: number
  created_at: string
  updated_at: string
  due_date?: string
  metadata?: any
  created_by?: {
    user_id: number
    username: string
    email: string
  }
  assigned_to?: {
    user_id: number
    username: string
    email: string
  }
  case_logs?: Array<{
    id: number
    action: string
    details?: string
    created_at: string
    user?: {
      user_id: number
      username: string
    }
  }>
}

export interface CreateCaseRequest {
  title: string
  description?: string
  priority?: string
  assigned_to?: number
  due_date?: string
  metadata?: any
}

export interface UpdateCaseRequest {
  title?: string
  description?: string
  status?: string
  priority?: string
  assigned_to_id?: number
  due_date?: string
  metadata?: any
}

export interface CaseQueryParams {
  view?: string
  status?: string
  priority?: string
  assignedTo?: number
  createdBy?: number
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  filters?: {
    applied: any
    available: any
  }
}

// =================== API方法对象 ===================

export const api = {
  // 认证相关
  auth: {
    login: (data: LoginRequest): Promise<AxiosResponse<LoginResponse>> =>
      apiClient.post('/auth/login', data),
    
    logout: (): Promise<AxiosResponse<{ message: string }>> =>
      apiClient.post('/auth/logout'),
    
    getProfile: (): Promise<AxiosResponse<any>> =>
      apiClient.get('/auth/profile'),
  },

  // 案件相关
  cases: {
    getAll: (params?: CaseQueryParams): Promise<AxiosResponse<PaginatedResponse<Case>>> =>
      apiClient.get('/cases', { params }),
    
    getById: (id: number): Promise<AxiosResponse<Case>> =>
      apiClient.get(`/cases/${id}`),
    
    create: (data: CreateCaseRequest): Promise<AxiosResponse<Case>> =>
      apiClient.post('/cases', data),
    
    update: (id: number, data: UpdateCaseRequest): Promise<AxiosResponse<Case>> =>
      apiClient.patch(`/cases/${id}`, data),
    
    delete: (id: number): Promise<AxiosResponse<{ message: string }>> =>
      apiClient.delete(`/cases/${id}`),
    
    getStats: (period?: string): Promise<AxiosResponse<any>> =>
      apiClient.get('/cases/stats', { params: { period } }),
    
    getAvailableCaseworkers: (): Promise<AxiosResponse<any[]>> =>
      apiClient.get('/cases/available-caseworkers'),
    
    // 案件状态流转
    assignCase: (id: number, assignedCaseworkerId: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/assign`, { assignedCaseworkerId }),
    
    acceptCase: (id: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/accept`),
    
    rejectCase: (id: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/reject`),
    
    // 案件完成流程
    requestCompletion: (id: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/request-completion`),
    
    approveCompletion: (id: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/approve`),
    
    rejectCompletion: (id: number): Promise<AxiosResponse<any>> =>
      apiClient.patch(`/cases/${id}/reject-completion`),
    
    // 案件日志
    addCaseLog: (id: number, logEntry: string): Promise<AxiosResponse<any>> =>
      apiClient.post(`/cases/${id}/logs`, { log_entry: logEntry }),
    
    getCaseLogs: (id: number): Promise<AxiosResponse<any[]>> =>
      apiClient.get(`/cases/${id}/logs`),
    
    // 视图相关
    getByView: (view: string): Promise<AxiosResponse<PaginatedResponse<Case>>> =>
      apiClient.get('/cases', { params: { view } }),
  },

  // 文件相关
  files: {
    upload: (file: File): Promise<AxiosResponse<any>> => {
      const formData = new FormData()
      formData.append('file', file)
      
      return apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },
    
    download: (filename: string): Promise<AxiosResponse<Blob>> =>
      apiClient.get(`/files/download/${filename}`, {
        responseType: 'blob',
      }),
  },

  // 通知相关
  notifications: {
    getAll: async (params?: any): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Fetching notifications with params:', params)
      try {
        const response = await apiClient.get('/notifications', { params })
        console.log('🔔 [API] Notifications response:', response.data)
        
        // 确保返回正确的数据结构
        if (!response.data) {
          console.warn('🔔 [API] Empty response data, returning default structure')
          return {
            ...response,
            data: { 
              data: [],
              notifications: [], 
              total: 0, 
              unread: 0,
              meta: { total: 0, page: 1, limit: 10, totalPages: 0, hasNextPage: false, hasPreviousPage: false }
            }
          }
        }
        
        // 如果后端返回的是 { notifications: [], total: 0, unread: 0 } 格式
        // 需要转换为前端期望的格式
        if (response.data.notifications && Array.isArray(response.data.notifications)) {
          return {
            ...response,
            data: {
              data: response.data.notifications, // 前端期望的字段
              notifications: response.data.notifications, // 保持兼容性
              total: response.data.total || 0,
              unread: response.data.unread || 0,
              meta: {
                total: response.data.total || 0,
                page: params?.page || 1,
                limit: params?.limit || 10,
                totalPages: Math.ceil((response.data.total || 0) / (params?.limit || 10)),
                hasNextPage: false,
                hasPreviousPage: false
              }
            }
          }
        }
        
        return response
      } catch (error: any) {
        console.error('🔔 [API] Error fetching notifications:', error)
        throw error
      }
    },
    
    getStats: async (): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Fetching notification stats')
      try {
        const response = await apiClient.get('/notifications/stats')
        console.log('🔔 [API] Stats response:', response.data)
        
        // 确保返回正确的数据结构
        if (!response.data) {
          return {
            ...response,
            data: { total: 0, unread: 0, read: 0, byType: {} }
          }
        }
        
        return response
      } catch (error: any) {
        console.error('🔔 [API] Error fetching notification stats:', error)
        throw error
      }
    },
    
    getUnreadCount: async (): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Fetching unread count')
      try {
        const response = await apiClient.get('/notifications/stats')
        console.log('🔔 [API] Unread count stats response:', response.data)
        
        return {
          ...response,
          data: { unreadCount: response.data?.unread || 0 }
        }
      } catch (error: any) {
        console.error('🔔 [API] Error fetching unread count:', error)
        throw error
      }
    },
    
    markRead: (id: number): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Marking notification as read:', id)
      return apiClient.patch(`/notifications/${id}/read`)
    },
    
    markAllRead: (): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Marking all notifications as read')
      return apiClient.patch('/notifications/read-all')
    },
    
    delete: (id: number): Promise<AxiosResponse<any>> => {
      console.log('🔔 [API] Deleting notification:', id)
      return apiClient.delete(`/notifications/${id}`)
    },
  },

  // 系统相关
  system: {
    health: (): Promise<AxiosResponse<any>> =>
      apiClient.get('/health'),
    
    getHealth: (): Promise<AxiosResponse<any>> =>
      apiClient.get('/health'),
    
    info: (): Promise<AxiosResponse<any>> =>
      apiClient.get('/info'),
    
    getWelcome: (): Promise<AxiosResponse<string>> =>
      apiClient.get('/').then(res => ({ ...res, data: res.data || 'API 连接正常' })),
  },
}

// 错误处理辅助函数
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return Array.isArray(error.response.data.message) 
      ? error.response.data.message.join(', ')
      : error.response.data.message
  }
  
  if (error.response?.status) {
    const statusMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '权限不足',
      404: '资源不存在',
      409: '资源冲突',
      422: '数据验证失败',
      429: '请求过于频繁',
      500: '服务器内部错误',
      502: '服务器网关错误',
      503: '服务暂时不可用',
    }
    
    return statusMessages[error.response.status] || `HTTP ${error.response.status} 错误`
  }
  
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return '网络连接错误，请检查网络连接'
  }
  
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return '请求超时，请稍后重试'
  }
  
  return error.message || '未知错误'
}

// 主要导出 - 修复导入问题
export { apiClient }
export default api

// 便利方法
export const healthCheck = () => api.system.health()
export const getSystemInfo = () => api.system.info()