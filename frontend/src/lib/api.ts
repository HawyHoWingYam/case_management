import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权错误
      // 可以重定向到登录页面
    }
    return Promise.reject(error)
  }
)

// API 方法
export const apiClient = {
  // 健康检查
  health: () => api.get('/health'),
  
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