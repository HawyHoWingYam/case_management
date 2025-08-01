// Core TypeScript type definitions for the Case Management System

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export enum UserRole {
  CLERK = 'CLERK',
  CHAIR = 'CHAIR', 
  CASEWORKER = 'CASEWORKER'
}

export interface Case {
  id: string
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  createdById: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  completedAt?: string
}

export enum CaseStatus {
  NEW = 'NEW',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_COMPLETION = 'PENDING_COMPLETION',
  COMPLETED = 'COMPLETED'
}

export enum CasePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface CaseLog {
  id: string
  caseId: string
  userId: string
  action: string
  details: string
  timestamp: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Health Check Types
export interface HealthStatus {
  status: string
  timestamp: string
  uptime: number
  services?: {
    database: {
      status: string
      responseTime?: number
    }
    memory: {
      used: number
      total: number
      unit: string
    }
  }
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface CreateCaseForm {
  title: string
  description: string
  priority: CasePriority
  assignedToId?: string
  dueDate?: string
}

export interface UpdateCaseForm {
  title?: string
  description?: string
  priority?: CasePriority
  status?: CaseStatus
  assignedToId?: string
  dueDate?: string
}

// Dashboard Types
export interface DashboardStats {
  totalCases: number
  activeCases: number
  completedCases: number
  overdueCases: number
  avgCompletionTime: number
  casesByStatus: Record<CaseStatus, number>
  casesByPriority: Record<CasePriority, number>
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  roles?: UserRole[]
}

// Error Types
export interface ApiError {
  statusCode: number
  message: string
  error: string
  timestamp: string
  path: string
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
}