// frontend/src/lib/api.ts (增强版本)
import axios, { AxiosResponse } from 'axios'
import { 
  Case, 
  CreateCaseFormData, 
  UpdateCaseFormData,
  CaseQueryParams,
  CaseListResponse,
  CaseDetailResponse 
} from '@/types/case'
import { 
  DashboardQueryParams,
  DashboardStatsResponse,
  RecentActivityResponse 
} from '@/types/dashboard'
import { API_ENDPOINTS } from '@/types/api'

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    // 从 zustand auth store 获取 token
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage)
          const token = parsed.state?.token
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error) {
          console.error('Failed to parse auth storage:', error)
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和token刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除认证状态并重定向到登录页
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
        // 触发 zustand store 的 logout
        try {
          const { useAuthStore } = await import('@/stores/authStore')
          useAuthStore.getState().logout()
        } catch (e) {
          console.error('Failed to logout:', e)
        }
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 构建查询字符串的辅助函数
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  
  return searchParams.toString()
}

// API 客户端对象
export const apiClient = {
  // ==================== 案件相关 API ====================
  cases: {
    // 获取案件列表（增强版，支持筛选和分页）
    getAll: async (params?: CaseQueryParams): Promise<CaseListResponse> => {
      const queryString = params ? buildQueryString(params) : ''
      const url = `${API_ENDPOINTS.CASES.LIST}${queryString ? `?${queryString}` : ''}`
      const response: AxiosResponse<CaseListResponse> = await api.get(url)
      return response.data
    },

    // 根据视图获取案件列表
    getByView: async (view: string, params?: Partial<CaseQueryParams>): Promise<CaseListResponse> => {
      const queryParams = { ...params, view }
      return apiClient.cases.getAll(queryParams)
    },

    // 获取案件详情
    getById: async (id: number): Promise<{ data: Case }> => {
      const response: AxiosResponse<Case> = await api.get(API_ENDPOINTS.CASES.DETAIL(id))
      // Backend returns case object directly, wrap it in data property for consistency
      return { data: response.data }
    },

    // 创建案件
    create: async (data: CreateCaseFormData): Promise<{ data: Case }> => {
      const response: AxiosResponse<Case> = await api.post(API_ENDPOINTS.CASES.CREATE, data)
      // Backend returns case directly, wrap it in data property for consistency
      return { data: response.data }
    },

    // 更新案件
    update: async (id: number, data: UpdateCaseFormData): Promise<{ data: Case }> => {
      const response: AxiosResponse<{ data: Case }> = await api.patch(API_ENDPOINTS.CASES.UPDATE(id), data)
      return response.data
    },

    // 删除案件
    delete: async (id: number): Promise<{ message: string }> => {
      const response: AxiosResponse<{ message: string }> = await api.delete(API_ENDPOINTS.CASES.DELETE(id))
      return response.data
    },

    // 获取案件统计信息
    getStats: async (params?: { userId?: number; role?: string; period?: string }): Promise<{ data: any }> => {
      const queryString = params ? buildQueryString(params) : ''
      const url = `${API_ENDPOINTS.CASES.LIST}/stats${queryString ? `?${queryString}` : ''}`
      const response: AxiosResponse<{ data: any }> = await api.get(url)
      return response.data
    },

    // 搜索案件
    search: async (searchTerm: string, filters?: Partial<CaseQueryParams>): Promise<CaseListResponse> => {
      const queryParams = { ...filters, search: searchTerm }
      return apiClient.cases.getAll(queryParams)
    },

    // 添加案件评论（如果后端支持）
    addComment: async (caseId: number, data: { comment: string; isInternal?: boolean; userId?: number }): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.post(`${API_ENDPOINTS.CASES.DETAIL(caseId)}/comments`, data)
      return response.data
    },

    // 获取可指派的 Caseworker 列表
    getAvailableCaseworkers: async (): Promise<{ data: any[] }> => {
      const response: AxiosResponse<any[]> = await api.get(`/api/cases/available-caseworkers`)
      return { data: response.data }
    },

    // 指派案件给 Caseworker (ADMIN/MANAGER only)
    assignCase: async (caseId: number, assignedCaseworkerId: number): Promise<{ data: any }> => {
      const response: AxiosResponse<any> = await api.patch(`/api/cases/${caseId}/assign`, {
        assignedCaseworkerId
      })
      return { data: response.data }
    },

    // Caseworker 接受指派的案件 (USER only)
    acceptCase: async (caseId: number): Promise<{ data: any }> => {
      const response: AxiosResponse<any> = await api.patch(`/api/cases/${caseId}/accept`)
      return { data: response.data }
    },

    // Caseworker 拒绝指派的案件 (USER only)
    rejectCase: async (caseId: number): Promise<{ data: any }> => {
      const response: AxiosResponse<any> = await api.patch(`/api/cases/${caseId}/reject`)
      return { data: response.data }
    },
  },

  // ==================== 仪表板相关 API ====================
  dashboard: {
    // 获取仪表板统计数据
    getStats: async (params: DashboardQueryParams): Promise<DashboardStatsResponse> => {
      const queryString = buildQueryString(params)
      const url = `${API_ENDPOINTS.DASHBOARD.STATS}?${queryString}`
      const response: AxiosResponse<DashboardStatsResponse> = await api.get(url)
      return response.data
    },

    // 获取最近活动
    getRecentActivity: async (params: DashboardQueryParams): Promise<RecentActivityResponse> => {
      const queryString = buildQueryString(params)
      const url = `${API_ENDPOINTS.DASHBOARD.ACTIVITY}?${queryString}`
      const response: AxiosResponse<RecentActivityResponse> = await api.get(url)
      return response.data
    },

    // 获取仪表板摘要
    getSummary: async (params: { role: string; userId: number }): Promise<{ data: any }> => {
      const queryString = buildQueryString(params)
      const url = `/api/dashboard/summary?${queryString}`
      const response: AxiosResponse<{ data: any }> = await api.get(url)
      return response.data
    },

    // 获取我的任务
    getMyTasks: async (params: { userId: number; limit?: number }): Promise<{ data: Case[] }> => {
      const queryString = buildQueryString(params)
      const url = `/api/dashboard/tasks?${queryString}`
      const response: AxiosResponse<{ data: Case[] }> = await api.get(url)
      return response.data
    },
  },

  // ==================== 用户相关 API ====================
  users: {
    // 获取用户列表
    getAll: async (params?: { role?: string; isActive?: boolean; search?: string }): Promise<{ data: any[] }> => {
      const queryString = params ? buildQueryString(params) : ''
      const url = `${API_ENDPOINTS.USERS.LIST}${queryString ? `?${queryString}` : ''}`
      const response: AxiosResponse<{ data: any[] }> = await api.get(url)
      return response.data
    },

    // 获取用户详情
    getById: async (id: number): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.get(API_ENDPOINTS.USERS.DETAIL(id))
      return response.data
    },

    // 创建用户
    create: async (data: { username: string; email: string; role: string; password: string }): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.post(API_ENDPOINTS.USERS.CREATE, data)
      return response.data
    },

    // 更新用户
    update: async (id: number, data: Partial<{ username: string; email: string; role: string; isActive: boolean }>): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.patch(API_ENDPOINTS.USERS.UPDATE(id), data)
      return response.data
    },

    // 删除用户
    delete: async (id: number): Promise<{ message: string }> => {
      const response: AxiosResponse<{ message: string }> = await api.delete(API_ENDPOINTS.USERS.DELETE(id))
      return response.data
    },
  },

  // ==================== 认证相关 API ====================
  auth: {
    // 登录
    login: async (credentials: LoginRequest): Promise<{ data: { access_token: string; user: any } }> => {
      const response: AxiosResponse<{ access_token: string; user: any }> = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
      // Backend returns { access_token, user } directly, wrap it in data property for consistency
      return { data: response.data }
    },

    // 登出
    logout: async (): Promise<{ message: string }> => {
      const response: AxiosResponse<{ message: string }> = await api.post(API_ENDPOINTS.AUTH.LOGOUT)
      return response.data
    },

    // 获取用户信息
    getProfile: async (): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.get(API_ENDPOINTS.AUTH.PROFILE)
      return response.data
    },

    // 刷新 token
    refreshToken: async (): Promise<{ data: { access_token: string } }> => {
      const response: AxiosResponse<{ data: { access_token: string } }> = await api.post(API_ENDPOINTS.AUTH.REFRESH)
      return response.data
    },
  },

  // ==================== 系统相关 API ====================
  system: {
    // 获取系统健康状态
    getHealth: async (): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.get(API_ENDPOINTS.SYSTEM.HEALTH)
      return response.data
    },

    // 获取系统信息
    getInfo: async (): Promise<{ data: any }> => {
      const response: AxiosResponse<{ data: any }> = await api.get(API_ENDPOINTS.SYSTEM.INFO)
      return response.data
    },

    // 获取欢迎消息（现有的方法）
    getWelcome: async (): Promise<{ data: string }> => {
      const response: AxiosResponse<{ data: string }> = await api.get('/api/info')
      return response.data
    },
  },

  // ==================== 文件相关 API ====================
  files: {
    // 上传单个文件
    upload: async (file: File): Promise<{ data: any }> => {
      const formData = new FormData()
      formData.append('file', file)
      const response: AxiosResponse<any> = await api.post(
        API_ENDPOINTS.FILES.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return { data: response.data }
    },

    // 上传多个文件
    uploadMultiple: async (files: FileList | File[]): Promise<{ data: any[] }> => {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('files', file)
      })
      const response: AxiosResponse<any[]> = await api.post(
        API_ENDPOINTS.FILES.UPLOAD_MULTIPLE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      return { data: response.data }
    },

    // 下载文件
    download: async (filename: string): Promise<Blob> => {
      const response: AxiosResponse<Blob> = await api.get(
        API_ENDPOINTS.FILES.DOWNLOAD(filename),
        {
          responseType: 'blob',
        }
      )
      return response.data
    },
  },
}

// 默认导出
export default apiClient

// 便利的错误处理函数
export const handleApiError = (error: any): string => {
  if (error.response) {
    // 服务器返回了错误状态码
    const { status, data } = error.response
    
    if (status === 400) {
      return data.message || '请求参数错误'
    }
    
    if (status === 401) {
      return '未授权访问，请重新登录'
    }
    
    if (status === 403) {
      return '没有权限执行此操作'
    }
    
    if (status === 404) {
      return '请求的资源不存在'
    }
    
    if (status === 409) {
      return '数据冲突，请刷新后重试'
    }
    
    if (status >= 500) {
      return '服务器内部错误，请稍后重试'
    }
    
    return data.message || `请求失败 (${status})`
  }
  
  if (error.request) {
    // 网络错误
    return '网络连接失败，请检查网络设置'
  }
  
  // 其他错误
  return error.message || '发生未知错误'
}

// HTTP 状态码检查函数
export const isSuccessResponse = (status: number): boolean => {
  return status >= 200 && status < 300
}

// 重试机制辅助函数
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      if (i === maxRetries) {
        break
      }
      
      // 指数退避延迟
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}