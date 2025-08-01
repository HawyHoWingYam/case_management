// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

// 创建 Query Client 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据缓存时间 (5分钟)
      staleTime: 5 * 60 * 1000,
      // 缓存在后台保持时间 (10分钟)  
      gcTime: 10 * 60 * 1000,
      // 失败重试配置
      retry: (failureCount, error: any) => {
        // 4xx 错误不重试，5xx 错误重试最多2次
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 2
      },
      // 重试延迟（指数退避）
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口重新获得焦点时刷新数据
      refetchOnWindowFocus: false,
      // 网络重连时刷新数据
      refetchOnReconnect: true,
    },
    mutations: {
      // 突变失败重试1次
      retry: 1,
      // 突变重试延迟
      retryDelay: 1000,
    },
  },
})

// Query Keys 常量 - 统一管理查询键
export const QUERY_KEYS = {
  // 案件相关
  CASES: {
    ALL: ['cases'] as const,
    LIST: (filters?: any) => ['cases', 'list', filters] as const,
    DETAIL: (id: number) => ['cases', 'detail', id] as const,
    BY_VIEW: (view: string, userId?: number) => ['cases', 'view', view, userId] as const,
  },
  // 仪表板相关
  DASHBOARD: {
    STATS: (role: string) => ['dashboard', 'stats', role] as const,
    RECENT_ACTIVITY: (userId: number) => ['dashboard', 'activity', userId] as const,
    MY_TASKS: (userId: number) => ['dashboard', 'tasks', userId] as const,
  },
  // 用户相关
  USERS: {
    ALL: ['users'] as const,
    DETAIL: (id: number) => ['users', id] as const,
    BY_ROLE: (role: string) => ['users', 'role', role] as const,
  },
  // 系统相关
  SYSTEM: {
    HEALTH: ['system', 'health'] as const,
    INFO: ['system', 'info'] as const,
  },
} as const

// 预定义的查询配置
export const QUERY_OPTIONS = {
  // 快速更新的数据 (30秒)
  REALTIME: {
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
  },
  // 频繁更新的数据 (2分钟)
  FREQUENT: {
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  },
  // 较稳定的数据 (10分钟)
  STABLE: {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  },
  // 很少变化的数据 (1小时)
  STATIC: {
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  },
} as const

// 错误处理工具函数
export const handleQueryError = (error: any) => {
  console.error('Query Error:', error)
  
  // 根据错误类型返回用户友好的消息
  if (error?.response?.status === 401) {
    return '登录已过期，请重新登录'
  }
  
  if (error?.response?.status === 403) {
    return '您没有权限执行此操作'
  }
  
  if (error?.response?.status === 404) {
    return '请求的资源不存在'
  }
  
  if (error?.response?.status >= 500) {
    return '服务器错误，请稍后重试'
  }
  
  return error?.response?.data?.message || error?.message || '发生未知错误'
}

// 成功处理工具函数
export const handleMutationSuccess = (message: string = '操作成功') => {
  // 这里可以集成 toast 通知
  console.log('Mutation Success:', message)
}

// 清除相关缓存的工具函数
export const invalidateQueries = {
  // 清除所有案件相关缓存
  allCases: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CASES.ALL }),
  
  // 清除特定案件缓存
  caseDetail: (id: number) => queryClient.invalidateQueries({ 
    queryKey: QUERY_KEYS.CASES.DETAIL(id) 
  }),
  
  // 清除仪表板缓存
  dashboard: (role: string) => queryClient.invalidateQueries({ 
    queryKey: QUERY_KEYS.DASHBOARD.STATS(role) 
  }),
  
  // 清除用户相关缓存
  users: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL }),
}