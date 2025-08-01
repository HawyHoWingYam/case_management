// 案件状态枚举
export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS', 
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

// 案件优先级枚举
export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH', 
  URGENT = 'URGENT'
}

// 案件状态显示配置
export const CASE_STATUS_CONFIG = {
  [CaseStatus.OPEN]: {
    label: '待处理',
    variant: 'secondary' as const,
    color: 'text-blue-600',
  },
  [CaseStatus.IN_PROGRESS]: {
    label: '处理中',
    variant: 'default' as const,
    color: 'text-yellow-600',
  },
  [CaseStatus.PENDING]: {
    label: '等待中',
    variant: 'outline' as const,
    color: 'text-orange-600',
  },
  [CaseStatus.RESOLVED]: {
    label: '已解决',
    variant: 'default' as const,
    color: 'text-green-600',
  },
  [CaseStatus.CLOSED]: {
    label: '已关闭',
    variant: 'secondary' as const,
    color: 'text-gray-600',
  },
} as const

// 优先级显示配置
export const CASE_PRIORITY_CONFIG = {
  [CasePriority.LOW]: {
    label: '低',
    variant: 'secondary' as const,
    color: 'text-gray-600',
  },
  [CasePriority.MEDIUM]: {
    label: '中',
    variant: 'outline' as const,
    color: 'text-blue-600',
  },
  [CasePriority.HIGH]: {
    label: '高',
    variant: 'default' as const,
    color: 'text-orange-600',
  },
  [CasePriority.URGENT]: {
    label: '紧急',
    variant: 'destructive' as const,
    color: 'text-red-600',
  },
} as const

// 用户信息（简化版，用于案件中的用户引用）
export interface CaseUser {
  id: string
  username: string
  email: string
}

// 案件日志
export interface CaseLog {
  id: string
  case_id: string
  user_id: string
  action: string
  description: string
  metadata?: Record<string, any>
  created_at: string
  user: CaseUser
}

// 案件基础信息
export interface Case {
  id: string
  title: string
  description: string | null
  status: CaseStatus
  priority: CasePriority
  created_by_id: string
  assigned_to_id: string | null
  due_date: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  
  // 关联信息
  created_by: CaseUser
  assigned_to: CaseUser | null
  case_logs?: CaseLog[]
}

// 创建案件表单数据
export interface CreateCaseFormData {
  title: string
  description?: string
  priority?: CasePriority
  assigned_to_id?: string
  due_date?: string
  metadata?: Record<string, any>
}

// 更新案件表单数据
export interface UpdateCaseFormData {
  title?: string
  description?: string
  status?: CaseStatus
  priority?: CasePriority
  assigned_to_id?: string
  due_date?: string
  metadata?: Record<string, any>
}

// API响应类型
export interface CaseListResponse {
  data: Case[]
  total: number
  page: number
  limit: number
}

export interface CreateCaseResponse {
  id: string
  title: string
  description: string | null
  status: CaseStatus
  priority: CasePriority
  created_by_id: string
  assigned_to_id: string | null
  due_date: string | null
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by: CaseUser
  assigned_to: CaseUser | null
}

// 文件上传相关类型
export interface FileUploadResponse {
  filename: string
  originalname: string
  size: number
  mimetype: string
  url: string
  uploadedAt: string
}

// 案件筛选参数
export interface CaseFilters {
  status?: CaseStatus
  priority?: CasePriority
  assigned_to_id?: string
  created_by_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

// 案件排序参数
export interface CaseSortOption {
  field: 'created_at' | 'updated_at' | 'title' | 'priority' | 'status'
  direction: 'asc' | 'desc'
}