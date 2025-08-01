import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
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
    user_id: number
    username: string
    email: string
    role: string
  }
}

export interface UserProfile {
  user_id: number
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
  
  // 案例相关 API
  cases: {
    getAll: () => api.get('/cases'),
    getById: (id: number) => api.get(`/cases/${id}`),
    create: (data: any) => api.post('/cases', data),
    update: (id: number, data: any) => api.put(`/cases/${id}`, data),
    delete: (id: number) => api.delete(`/cases/${id}`),
  },
  
  // 用户相关 API
  users: {
    getAll: () => api.get('/users'),
    getById: (id: number) => api.get(`/users/${id}`),
    create: (data: any) => api.post('/users', data),
    update: (id: number, data: any) => api.put(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
  },
}

export default api