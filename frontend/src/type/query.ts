// frontend/src/types/query.ts
import { CaseStatus, CasePriority } from './case'

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

// 排序参数
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 案件查询参数
export interface CaseQueryParams extends PaginationParams, SortParams {
  // 视图类型
  view?: 'all' | 'my_cases' | 'assigned' | 'created' | 'team' | 'urgent' | 'pending' | 'in_progress' | 'resolved'
  
  // 筛选条件
  status?: CaseStatus | CaseStatus[]
  priority?: CasePriority | CasePriority[]
  assignedTo?: number | number[]
  createdBy?: number | number[]
  
  // 时间范围
  createdAfter?: string
  createdBefore?: string
  updatedAfter?: string
  updatedBefore?: string
  
  // 搜索
  search?: string
  searchFields?: ('title' | 'description')[]
  
  // 用户和角色上下文
  userId?: number
  role?: string
  
  // 包含关联数据
  include?: ('creator' | 'assignee' | 'logs' | 'attachments')[]
}

// 仪表板查询参数
export interface DashboardQueryParams {
  role: string
  userId: number
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  includeStats?: boolean
  includeActivity?: boolean
  includeRecentCases?: boolean
  activityLimit?: number
  casesLimit?: number
}

// 用户查询参数
export interface UserQueryParams extends PaginationParams, SortParams {
  role?: string | string[]
  isActive?: boolean
  search?: string
  include?: ('profile' | 'stats')[]
}