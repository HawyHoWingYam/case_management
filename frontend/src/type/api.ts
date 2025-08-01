// ==========================================
// frontend/src/types/api.ts

// API 响应基础接口
export interface ApiResponse<T = any> {
  data: T
  message?: string
  timestamp: string
}

// 分页响应接口
export interface PaginatedResponse<T = any> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  links?: {
    first?: string
    previous?: string
    next?: string
    last?: string
  }
}

// 错误响应接口
export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}

// 案件列表响应
export interface CaseListResponse extends PaginatedResponse {
  data: Case[]
  filters: {
    applied: CaseQueryParams
    available: {
      statuses: { value: CaseStatus; label: string; count: number }[]
      priorities: { value: CasePriority; label: string; count: number }[]
      assignees: { id: number; name: string; count: number }[]
      creators: { id: number; name: string; count: number }[]
    }
  }
}

// 案件详情响应
export interface CaseDetailResponse extends ApiResponse {
  data: Case & {
    case_logs?: Array<{
      id: number
      action: string
      details: string
      created_at: string
      user: {
        id: number
        username: string
      }
    }>
    attachments?: Array<{
      id: number
      filename: string
      originalname: string
      url: string
      size: number
      mimetype: string
      uploaded_at: string
    }>
  }
}

// 仪表板统计响应
export interface DashboardStatsResponse extends ApiResponse {
  data: {
    overview: {
      totalCases: number
      pendingCases: number
      inProgressCases: number
      resolvedCases: number
      urgentCases: number
    }
    personal: {
      myCases: number
      assignedToMe: number
      createdByMe: number
      completedByMe: number
    }
    team?: {
      teamCases: number
      teamMembers: number
      teamCompletionRate: number
    }
    trends: {
      casesThisWeek: number
      casesLastWeek: number
      completionRate: number
      avgResolutionTime: number
    }
    charts: {
      casesByStatus: Array<{ status: CaseStatus; count: number }>
      casesByPriority: Array<{ priority: CasePriority; count: number }>
      casesOverTime: Array<{ date: string; count: number }>
    }
  }
}

// 最近活动响应
export interface RecentActivityResponse extends ApiResponse {
  data: Array<{
    id: string
    type: 'case_created' | 'case_updated' | 'case_assigned' | 'case_resolved'
    title: string
    description: string
    user: {
      id: number
      username: string
    }
    case: {
      id: number
      title: string
      status: CaseStatus
    }
    timestamp: string
  }>
}

// 用户列表响应
export interface UserListResponse extends PaginatedResponse {
  data: Array<{
    user_id: number
    username: string
    email: string
    role: string
    is_active: boolean
    created_at: string
    last_login?: string
    stats?: {
      totalCases: number
      activeCases: number
      resolvedCases: number
    }
  }>
}

// 系统健康状态响应
export interface HealthStatusResponse extends ApiResponse {
  data: {
    status: 'healthy' | 'warning' | 'error'
    database: {
      status: 'connected' | 'disconnected'
      responseTime: number
    }
    memory: {
      used: number
      total: number
      percentage: number
    }
    uptime: number
    version: string
    timestamp: string
  }
}

// Mutation 响应类型
export interface MutationResponse<T = any> extends ApiResponse<T> {
  success: boolean
}

// 文件上传响应
export interface FileUploadResponse extends ApiResponse {
  data: {
    filename: string
    originalname: string
    url: string
    size: number
    mimetype: string
  }
}

// API 客户端配置
export interface ApiClientConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// API 端点定义
export const API_ENDPOINTS = {
  // 案件相关
  CASES: {
    LIST: '/api/cases',
    DETAIL: (id: number) => `/api/cases/${id}`,
    CREATE: '/api/cases',
    UPDATE: (id: number) => `/api/cases/${id}`,
    DELETE: (id: number) => `/api/cases/${id}`,
  },
  
  // 仪表板相关
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITY: '/api/dashboard/activity',
  },
  
  // 用户相关
  USERS: {
    LIST: '/api/users',
    DETAIL: (id: number) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: number) => `/api/users/${id}`,
    DELETE: (id: number) => `/api/users/${id}`,
  },
  
  // 认证相关
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  
  // 系统相关
  SYSTEM: {
    HEALTH: '/api/health',
    INFO: '/api/info',
  },
  
  // 文件相关
  FILES: {
    UPLOAD: '/api/files/upload',
    DOWNLOAD: (filename: string) => `/api/files/${filename}`,
  },
} as const

// HTTP 状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const