import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG, STORAGE_KEYS, TOAST_MESSAGES } from './constants'
import { ApiError, ApiResponse } from './types'

/**
 * Enhanced API client with automatic token management, error handling, and type safety
 */
class ApiClient {
  private client: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - add authentication token
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(STORAGE_KEYS.authToken)
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        
        // Add timestamp for cache busting if needed
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          }
        }

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle responses and errors
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        console.error('API Response Error:', error.response?.status, error.config?.url)

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(token => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.client(originalRequest)
            }).catch(err => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
            if (!refreshToken) {
              throw new Error('No refresh token available')
            }

            // Attempt to refresh token
            const response = await axios.post(`${API_CONFIG.baseURL}/auth/refresh`, {
              refreshToken
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data

            // Update stored tokens
            localStorage.setItem(STORAGE_KEYS.authToken, accessToken)
            localStorage.setItem(STORAGE_KEYS.refreshToken, newRefreshToken)

            // Process queued requests
            this.processQueue(null, accessToken)

            // Retry original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }
            return this.client(originalRequest)

          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.processQueue(refreshError, null)
            this.handleAuthFailure()
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // Handle other HTTP errors
        if (error.response?.status === 403) {
          console.warn('Access denied:', error.response.data)
          // Could show a toast notification here
        }

        if (error.response?.status && error.response.status >= 500) {
          console.error('Server error:', error.response.data)
          // Could show a server error notification here
        }

        return Promise.reject(this.transformError(error))
      }
    )
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })
    
    this.failedQueue = []
  }

  private handleAuthFailure() {
    // Clear stored auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.authToken)
      localStorage.removeItem(STORAGE_KEYS.refreshToken)
      localStorage.removeItem(STORAGE_KEYS.user)
      
      // Redirect to login page
      window.location.href = '/login'
    }
  }

  private transformError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError
    }

    // Default error structure
    return {
      statusCode: error.response?.status || 500,
      message: error.message || TOAST_MESSAGES.error.generic,
      error: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      path: error.config?.url || ''
    }
  }

  // Generic HTTP methods with type safety
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config)
    return response.data.data
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config)
    return response.data.data
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config)
    return response.data.data
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config)
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config)
    return response.data.data
  }

  // Raw methods for cases where you need the full response
  async getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config)
  }

  async postRaw<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config)
  }

  // Upload method for file uploads
  async upload<T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> {
    const uploadConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Longer timeout for uploads
    }
    
    const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, formData, uploadConfig)
    return response.data.data
  }

  // Download method for file downloads
  async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    })

    // Create download link
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem(STORAGE_KEYS.authToken)
  }

  // Method to manually set authentication token
  setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.authToken, token)
    }
  }

  // Method to clear authentication
  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.authToken)
      localStorage.removeItem(STORAGE_KEYS.refreshToken)
      localStorage.removeItem(STORAGE_KEYS.user)
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export individual methods for convenience
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.post<T>(url, data, config),
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.put<T>(url, data, config),
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => apiClient.patch<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => apiClient.delete<T>(url, config),
  upload: <T>(url: string, formData: FormData, config?: AxiosRequestConfig) => apiClient.upload<T>(url, formData, config),
  download: (url: string, filename?: string, config?: AxiosRequestConfig) => apiClient.download(url, filename, config),
}