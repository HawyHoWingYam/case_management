import axios from 'axios'
import { 
  Case, 
  CreateCaseFormData, 
  UpdateCaseFormData, 
  CreateCaseResponse,
  CaseFilters,
  FileUploadResponse 
} from '@/types/case'

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加认证 token
api.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token（在客户端）
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        const { state } = JSON.parse(authStorage)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误 - 清除本地存储并重定向到登录页
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 健康检查相关接口
export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error'
  timestamp: string
  uptime: number
  environment: string
  version: string
  services: {
    database: {
      status: string
      latency: string
    }
    api: {
      status: string
      responseTime: string
    }
  }
  memory: {
    used: string
    total: string
  }
}

export interface ApiInfo {
  name: string
  version: string
  description: string
  environment: string
  docs: string
  endpoints: {
    health: string
    info: string
    cases: string
    users: string
  }
}

// 认证相关接口
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: {
    user_id: number  // 保持前端现有类型，在拦截器中处理转换
    username: string
    email: string
    role: string
  }
}

export interface UserProfile {
  user_id: number  // 保持前端现有类型
  username: string
  email: string
  role: string
  is_active: boolean
  last_login: string | null
  created_at: string
}

// API 方法
export const apiClient = {
  // 系统信息
  system: {
    getWelcome: () => api.get<string>('/'),
    getHealth: () => api.get<HealthStatus>('/health'),
    getInfo: () => api.get<ApiInfo>('/info'),
  },

  // 认证相关 API
  auth: {
    login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get<UserProfile>('/auth/profile'),
  },

  // 案件相关 API
  cases: {
    // 获取案件列表
    getAll: (filters?: CaseFilters) => {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
          }
        })
      }
      const query = params.toString() ? `?${params.toString()}` : ''
      return api.get<Case[]>(`/cases${query}`)
    },

    // 根据ID获取案件详情
    getById: (id: number) => api.get<Case>(`/cases/${id}`),

    // 创建新案件
    create: (data: CreateCaseFormData) => api.post<CreateCaseResponse>('/cases', data),

    // 更新案件
    update: (id: number, data: UpdateCaseFormData) => api.patch<Case>(`/cases/${id}`, data),

    // 删除案件
    delete: (id: number) => api.delete(`/cases/${id}`),
  },

  // 文件相关 API
  files: {
    // 上传单个文件
    upload: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post<FileUploadResponse>('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },

    // 上传多个文件
    uploadMultiple: (files: File[]) => {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      return api.post<FileUploadResponse[]>('/files/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },

    // 获取文件信息
    getInfo: (filename: string) => api.get(`/files/${filename}/info`),

    // 获取文件下载链接
    getDownloadUrl: (filename: string) => api.get<{downloadUrl: string, expiresIn: number}>(`/files/${filename}/download-url`),

    // 删除文件
    delete: (filename: string) => api.delete(`/files/${filename}`),
  },
  
  // 用户相关 API (保持原有接口，如果需要的话)
  users: {
    getAll: () => api.get('/users'),
    getById: (id: number) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: number, data: any) => api.put(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
  },
}

export default api