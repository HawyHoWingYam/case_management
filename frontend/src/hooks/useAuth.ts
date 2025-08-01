import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { apiClient, LoginRequest } from '@/lib/api'
import { toast } from 'sonner'

export const useAuth = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setError,
    clearError,
    hasRole,
    isAdmin,
    isManager,
  } = useAuthStore()
  
  const router = useRouter()

  // 登录方法
  const signIn = async (credentials: LoginRequest) => {
    setIsLoggingIn(true)
    clearError()

    try {
      const response = await apiClient.auth.login(credentials)
      const { access_token, user: userData } = response.data

      // 更新状态
      login(userData, access_token)
      
      // 显示成功消息
      toast.success(`欢迎回来，${userData.username}！`)
      
      // 重定向到首页或用户之前访问的页面
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/'
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectTo)
      
      return { success: true }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败，请检查邮箱和密码'
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 登出方法
  const signOut = async () => {
    setIsLoggingOut(true)

    try {
      // 调用后端登出 API（可选）
      await apiClient.auth.logout().catch(() => {
        // 忽略登出 API 错误，因为 JWT 是无状态的
      })
    } catch (error) {
      // 忽略错误，继续登出流程
    } finally {
      // 清除本地状态
      logout()
      toast.success('已成功登出')
      router.push('/login')
      setIsLoggingOut(false)
    }
  }

  // 获取用户信息
  const refreshProfile = async () => {
    if (!isAuthenticated) return null

    try {
      const response = await apiClient.auth.getProfile()
      return response.data
    } catch (error) {
      // 如果获取用户信息失败，可能 token 已过期
      logout()
      router.push('/login')
      return null
    }
  }

  // 检查是否需要重新认证
  const checkAuth = async () => {
    if (!token) return false

    try {
      await apiClient.auth.getProfile()
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    // 状态
    user,
    token,
    isAuthenticated,
    isLoggingIn,
    isLoggingOut,

    // 方法
    signIn,
    signOut,
    refreshProfile,
    checkAuth,
    clearError,

    // 权限检查
    hasRole,
    isAdmin,
    isManager,
  }
}