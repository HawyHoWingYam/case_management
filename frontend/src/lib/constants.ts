// Application constants for the Case Management System

import { UserRole, CaseStatus, CasePriority } from './types'

// App Configuration
export const APP_CONFIG = {
  name: 'Case Management System',
  version: '1.0.0',
  description: 'Legal/Administrative Case Processing System',
  author: 'Case Management Team'
} as const

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
} as const

// Pagination Defaults
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
  pageSizeOptions: [10, 25, 50, 100]
} as const

// User Role Configuration
export const USER_ROLE_CONFIG = {
  [UserRole.CLERK]: {
    label: 'Clerk',
    description: 'Case entry and basic management',
    color: 'blue',
    permissions: ['create_case', 'view_case', 'update_case']
  },
  [UserRole.CHAIR]: {
    label: 'Chair',
    description: 'Case review and assignment oversight',
    color: 'purple', 
    permissions: ['view_all_cases', 'assign_case', 'approve_case', 'generate_reports']
  },
  [UserRole.CASEWORKER]: {
    label: 'Caseworker',
    description: 'Case processing and resolution',
    color: 'green',
    permissions: ['process_case', 'update_case_status', 'complete_case']
  }
} as const

// Case Status Configuration
export const CASE_STATUS_CONFIG = {
  [CaseStatus.NEW]: {
    label: 'New',
    description: 'Recently created case awaiting review',
    color: 'gray',
    variant: 'secondary' as const,
    nextStatuses: [CaseStatus.PENDING_REVIEW]
  },
  [CaseStatus.PENDING_REVIEW]: {
    label: 'Pending Review',
    description: 'Case awaiting chair review and assignment',
    color: 'yellow',
    variant: 'secondary' as const,
    nextStatuses: [CaseStatus.ASSIGNED]
  },
  [CaseStatus.ASSIGNED]: {
    label: 'Assigned',
    description: 'Case assigned to caseworker',
    color: 'blue',
    variant: 'default' as const,
    nextStatuses: [CaseStatus.IN_PROGRESS]
  },
  [CaseStatus.IN_PROGRESS]: {
    label: 'In Progress',
    description: 'Case being actively processed',
    color: 'orange',
    variant: 'default' as const,
    nextStatuses: [CaseStatus.PENDING_COMPLETION]
  },
  [CaseStatus.PENDING_COMPLETION]: {
    label: 'Pending Completion',
    description: 'Case processing completed, awaiting final approval',
    color: 'purple',
    variant: 'secondary' as const,
    nextStatuses: [CaseStatus.COMPLETED, CaseStatus.IN_PROGRESS]
  },
  [CaseStatus.COMPLETED]: {
    label: 'Completed',
    description: 'Case fully processed and closed',
    color: 'green',
    variant: 'outline' as const,
    nextStatuses: []
  }
} as const

// Case Priority Configuration
export const CASE_PRIORITY_CONFIG = {
  [CasePriority.LOW]: {
    label: 'Low',
    description: 'Standard processing time',
    color: 'gray',
    variant: 'secondary' as const,
    slaHours: 168 // 7 days
  },
  [CasePriority.MEDIUM]: {
    label: 'Medium',
    description: 'Moderate urgency',
    color: 'blue',
    variant: 'default' as const,
    slaHours: 72 // 3 days
  },
  [CasePriority.HIGH]: {
    label: 'High',
    description: 'Requires prompt attention',
    color: 'orange',
    variant: 'default' as const,
    slaHours: 24 // 1 day
  },
  [CasePriority.URGENT]: {
    label: 'Urgent',
    description: 'Immediate attention required',
    color: 'red',
    variant: 'destructive' as const,
    slaHours: 4 // 4 hours
  }
} as const

// Date and Time Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  displayWithTime: 'MMM dd, yyyy HH:mm',
  iso: 'yyyy-MM-dd',
  input: 'yyyy-MM-dd\'T\'HH:mm'
} as const

// Query Keys for React Query
export const QUERY_KEYS = {
  health: ['health'] as const,
  healthDetailed: ['health', 'detailed'] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  cases: ['cases'] as const,
  case: (id: string) => ['cases', id] as const,
  caseLogs: (caseId: string) => ['cases', caseId, 'logs'] as const,
  dashboardStats: ['dashboard', 'stats'] as const
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  user: 'current_user',
  theme: 'theme',
  preferences: 'user_preferences'
} as const

// Toast Messages
export const TOAST_MESSAGES = {
  success: {
    login: 'Successfully logged in',
    logout: 'Successfully logged out',
    caseCreated: 'Case created successfully',
    caseUpdated: 'Case updated successfully',
    caseDeleted: 'Case deleted successfully'
  },
  error: {
    generic: 'An error occurred. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
    validation: 'Please check your input and try again.'
  }
} as const

// Navigation Configuration
export const NAVIGATION_CONFIG = {
  header: {
    height: '3.5rem', // 14 in Tailwind
    zIndex: 50
  },
  sidebar: {
    widthExpanded: '16rem', // 64 in Tailwind
    widthCollapsed: '4rem', // 16 in Tailwind
    breakpoint: 'md'
  }
} as const

// Responsive Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px'
} as const

// Validation Rules
export const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number and special character'
  },
  caseTitle: {
    minLength: 3,
    maxLength: 200,
    message: 'Case title must be between 3 and 200 characters'
  },
  caseDescription: {
    minLength: 10,
    maxLength: 2000,
    message: 'Case description must be between 10 and 2000 characters'
  }
} as const