// 案件狀態類型
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED'

// 案件優先級類型
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

// 用戶類型
export interface User {
  user_id: number
  username: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'USER'
}

// 案件日志类型
export interface CaseLog {
  id: number
  case_id: number
  user_id: number
  action: string
  details?: string
  created_at: string
  user: {
    username: string
  }
}

// 案件類型
export interface Case {
  id: number  // 改为数字类型匹配数据库
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  created_by_id: number  // 改为数字类型
  assigned_to_id?: number  // 改为数字类型
  created_at: string
  updated_at: string
  due_date?: string  // 添加截止日期
  metadata?: Record<string, any>  // 添加元数据
  created_by: User
  assigned_to?: User
  case_logs?: CaseLog[]  // 添加案件日志
}

// 案件篩選類型
export interface CaseFilters {
  status?: CaseStatus
  priority?: CasePriority
  created_by_id?: number  // 改为数字类型
  assigned_to_id?: number  // 改为数字类型
  search?: string  // 添加搜索字段
}

// 案件查询参数类型 (用于URL参数和API查询)
export interface CaseQueryParams {
  view?: string
  status?: CaseStatus
  priority?: CasePriority
  assignedTo?: number
  search?: string
  page?: number
  limit?: number
}

// 案件狀態配置
export const CASE_STATUS_CONFIG = {
  OPEN: {
    label: '開放',
    color: 'blue',
    variant: 'default' as const,
    description: '新創建的案件，等待處理'
  },
  IN_PROGRESS: {
    label: '進行中',
    color: 'yellow',
    variant: 'secondary' as const,
    description: '正在處理中的案件'
  },
  PENDING: {
    label: '待處理',
    color: 'orange',
    variant: 'outline' as const,
    description: '等待外部回應或條件滿足'
  },
  RESOLVED: {
    label: '已解決',
    color: 'green',
    variant: 'success' as const,
    description: '問題已解決，等待確認'
  },
  CLOSED: {
    label: '已關閉',
    color: 'gray',
    variant: 'outline' as const,
    description: '案件已完成並關閉'
  }
} as const

// 案件優先級配置
export const CASE_PRIORITY_CONFIG = {
  LOW: {
    label: '低',
    color: 'green',
    variant: 'outline' as const,
    description: '低優先級，可以稍後處理'
  },
  MEDIUM: {
    label: '中',
    color: 'yellow',
    variant: 'secondary' as const,
    description: '中等優先級，需要及時處理'
  },
  HIGH: {
    label: '高',
    color: 'orange',
    variant: 'default' as const,
    description: '高優先級，需要盡快處理'
  },
  URGENT: {
    label: '緊急',
    color: 'red',
    variant: 'destructive' as const,
    description: '緊急情況，需要立即處理'
  }
} as const

// API 響應類型
export interface CaseListResponse {
  data: Case[]
  total: number
  page: number
  limit: number
}

export interface CaseDetailResponse {
  data: Case
}

// 創建案件請求類型
export interface CreateCaseRequest {
  title: string
  description: string
  priority: CasePriority
  assigned_to_id?: string
}

// 更新案件請求類型
export interface UpdateCaseRequest {
  title?: string
  description?: string
  status?: CaseStatus
  priority?: CasePriority
  assigned_to_id?: string
}

// API 中需要的表單數據類型
export interface CreateCaseFormData {
  title: string
  description: string
  priority: CasePriority
  assigned_to_id?: string
}

export interface UpdateCaseFormData {
  title?: string
  description?: string
  status?: CaseStatus
  priority?: CasePriority
  assigned_to_id?: string
}

// 創建案件響應類型
export interface CreateCaseResponse {
  id: string
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  created_by_id: string
  assigned_to_id?: string
  created_at: string
  updated_at: string
}

// 文件上傳響應類型
export interface FileUploadResponse {
  filename: string
  originalName: string
  size: number
  mimetype: string
  uploadedAt: string
}