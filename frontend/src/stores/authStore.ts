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

// Cookie 操作辅助函数
const setCookie = (name: string, value: string, days: number = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }
}

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
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
      setUser: (user: User) => {
        const state = { user, isAuthenticated: true }
        set(state)
        // 同步到 Cookie
        setCookie('auth-storage', JSON.stringify({ state }))
      },

      // 设置令牌
      setToken: (token: string) => {
        set({ token })
      },

      // 设置加载状态
      setLoading: (isLoading: boolean) => 
        set({ isLoading }),

      // 设置错误信息
      setError: (error: string | null) => 
        set({ error }),

      // 登录
      login: (user: User, token: string) => {
        console.log('🔐 [AuthStore] Login action:', {
          userId: user.user_id,
          username: user.username,
          role: user.role,
          hasToken: !!token
        })
        const state = { 
          user, 
          token, 
          isAuthenticated: true, 
          error: null 
        }
        set(state)
        // 同步到 Cookie - 只同步认证相关信息
        setCookie('auth-storage', JSON.stringify({ 
          state: {
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated
          }
        }))
      },

      // 登出
      logout: () => {
        console.log('🔐 [AuthStore] Logout action')
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          error: null 
        })
        // 删除 Cookie
        deleteCookie('auth-storage')
      },

      // 清除错误
      clearError: () => 
        set({ error: null }),

      // 权限检查方法
      hasRole: (roles: string[]) => {
        const { user } = get()
        const hasAccess = user ? roles.includes(user.role) : false
        console.log('🔐 [AuthStore] hasRole check:', {
          requiredRoles: roles,
          userRole: user?.role,
          hasAccess,
          user: user?.username
        })
        return hasAccess
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
      // 添加 onRehydrateStorage 回调来同步 Cookie
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state?.user && state?.token) {
          setCookie('auth-storage', JSON.stringify({ 
            state: {
              user: state.user,
              token: state.token,
              isAuthenticated: state.isAuthenticated
            }
          }))
        }
      }
    }
  )
)