import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface User {
  user_id: number
  username: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
}

interface AuthState {
  // 状态
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 操作
  setUser: (user: User) => void
  setToken: (token: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  clearError: () => void
  
  // 权限检查
  hasRole: (roles: string[]) => boolean
  isAdmin: () => boolean
  isManager: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 设置用户信息
      setUser: (user: User) => 
        set({ user, isAuthenticated: true }),

      // 设置令牌
      setToken: (token: string) => 
        set({ token }),

      // 设置加载状态
      setLoading: (isLoading: boolean) => 
        set({ isLoading }),

      // 设置错误信息
      setError: (error: string | null) => 
        set({ error }),

      // 登录
      login: (user: User, token: string) => 
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          error: null 
        }),

      // 登出
      logout: () => 
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        }),

      // 清除错误
      clearError: () => 
        set({ error: null }),

      // 权限检查方法
      hasRole: (roles: string[]) => {
        const { user } = get()
        return user ? roles.includes(user.role) : false
      },

      // 检查是否为管理员
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'ADMIN'
      },

      // 检查是否为经理
      isManager: () => {
        const { user } = get()
        return user?.role === 'MANAGER' || user?.role === 'ADMIN'
      },
    }),
    {
      name: 'auth-storage', // 本地存储的键名
      storage: createJSONStorage(() => localStorage), // 使用 localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }), // 只持久化这些字段
    }
  )
)