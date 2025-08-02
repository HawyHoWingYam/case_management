import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import api, { LoginRequest } from '@/lib/api'
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
    console.log('🔐 [useAuth] Sign in attempt:', { email: credentials.email })
    setIsLoggingIn(true)
    clearError()

    try {
      console.log('🔐 [useAuth] Calling login API...')
      const response = await api.auth.login(credentials)
      const { access_token, user: userData } = response.data

      console.log('🔐 [useAuth] Login successful:', {
        userId: userData.user_id,
        username: userData.username,
        role: userData.role,
        hasToken: !!access_token
      })

      // 更新状态
      login(userData, access_token)
      
      // 显示成功消息
      toast.success(`欢迎回来，${userData.username}！`)
      
      // 重定向到首页或用户之前访问的页面
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/'
      sessionStorage.removeItem('redirectAfterLogin')
      console.log('🔐 [useAuth] Redirecting to:', redirectTo)
      router.push(redirectTo)
      
      return { success: true }
    } catch (error: any) {
      // Enhanced error logging for debugging
      console.error('🔐 [useAuth] Login failed - Full error object:', error)
      console.error('🔐 [useAuth] Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers
        }
      })
      
      let errorMessage = '登录失败，请检查邮箱和密码'
      
      // Better error message handling
      if (error.response) {
        // Server responded with error status
        if (error.response.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response.status === 401) {
          errorMessage = '邮箱或密码错误'
        } else if (error.response.status === 500) {
          errorMessage = '服务器内部错误，请稍后重试'
        } else if (error.response.status >= 400) {
          errorMessage = `请求失败 (${error.response.status}): ${error.response.statusText}`
        }
      } else if (error.request) {
        // Network error - no response received
        console.error('🔐 [useAuth] Network error - no response received')
        errorMessage = '无法连接到服务器，请检查网络连接'
      } else {
        // Something else happened
        console.error('🔐 [useAuth] Request setup error:', error.message)
        errorMessage = `请求配置错误: ${error.message}`
      }
      
      console.error('🔐 [useAuth] Final error message:', errorMessage)
      setError(errorMessage)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 登出方法
  const signOut = async () => {
    console.log('🔐 [useAuth] Sign out initiated')
    setIsLoggingOut(true)

    try {
      // 调用后端登出 API（可选）
      console.log('🔐 [useAuth] Calling logout API...')
      await api.auth.logout().catch((error) => {
        console.warn('🔐 [useAuth] Logout API failed (ignoring):', error.message)
        // 忽略登出 API 错误，因为 JWT 是无状态的
      })
    } catch (error) {
      console.warn('🔐 [useAuth] Logout API error (ignoring):', error)
      // 忽略错误，继续登出流程
    } finally {
      // 清除本地状态
      console.log('🔐 [useAuth] Clearing local auth state')
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
      const response = await api.auth.getProfile()
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
      await api.auth.getProfile()
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