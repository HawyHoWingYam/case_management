import { z } from 'zod'
import { UserRole, CaseStatus, CasePriority } from './types'
import { VALIDATION_RULES } from './constants'

// User validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(VALIDATION_RULES.password.minLength, `Password must be at least ${VALIDATION_RULES.password.minLength} characters`)
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  password: z
    .string()
    .min(VALIDATION_RULES.password.minLength, VALIDATION_RULES.password.message)
    .regex(VALIDATION_RULES.password.pattern, VALIDATION_RULES.password.message),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole, {
    message: 'Please select a valid role'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .optional(),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .optional(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(VALIDATION_RULES.password.minLength, VALIDATION_RULES.password.message)
    .regex(VALIDATION_RULES.password.pattern, VALIDATION_RULES.password.message),
  confirmNewPassword: z.string()
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword']
})

// Case validation schemas
export const createCaseSchema = z.object({
  title: z
    .string()
    .min(1, 'Case title is required')
    .min(VALIDATION_RULES.caseTitle.minLength, VALIDATION_RULES.caseTitle.message)
    .max(VALIDATION_RULES.caseTitle.maxLength, VALIDATION_RULES.caseTitle.message),
  description: z
    .string()
    .min(1, 'Case description is required')
    .min(VALIDATION_RULES.caseDescription.minLength, VALIDATION_RULES.caseDescription.message)
    .max(VALIDATION_RULES.caseDescription.maxLength, VALIDATION_RULES.caseDescription.message),
  priority: z.nativeEnum(CasePriority, {
    message: 'Please select a valid priority level'
  }),
  assignedToId: z
    .string()
    .uuid('Please select a valid assignee')
    .optional()
    .or(z.literal('')),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'Due date must be in the future'
    )
})

export const updateCaseSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.caseTitle.minLength, VALIDATION_RULES.caseTitle.message)
    .max(VALIDATION_RULES.caseTitle.maxLength, VALIDATION_RULES.caseTitle.message)
    .optional(),
  description: z
    .string()
    .min(VALIDATION_RULES.caseDescription.minLength, VALIDATION_RULES.caseDescription.message)
    .max(VALIDATION_RULES.caseDescription.maxLength, VALIDATION_RULES.caseDescription.message)
    .optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  status: z.nativeEnum(CaseStatus).optional(),
  assignedToId: z
    .string()
    .uuid('Please select a valid assignee')
    .optional()
    .or(z.literal('')),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'Due date must be in the future'
    )
})

export const assignCaseSchema = z.object({
  assignedToId: z
    .string()
    .min(1, 'Please select a caseworker')
    .uuid('Please select a valid caseworker'),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => !date || new Date(date) > new Date(),
      'Due date must be in the future'
    ),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
})

export const updateCaseStatusSchema = z.object({
  status: z.nativeEnum(CaseStatus, {
    message: 'Please select a valid status'
  }),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
})

// Case Log validation schema
export const addCaseLogSchema = z.object({
  action: z
    .string()
    .min(1, 'Action is required')
    .max(100, 'Action cannot exceed 100 characters'),
  details: z
    .string()
    .min(1, 'Details are required')
    .max(1000, 'Details cannot exceed 1000 characters')
})

// Search and filter schemas
export const caseSearchSchema = z.object({
  query: z
    .string()
    .max(200, 'Search query cannot exceed 200 characters')
    .optional(),
  status: z.nativeEnum(CaseStatus).optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  assignedToId: z
    .string()
    .uuid('Invalid assignee ID')
    .optional(),
  createdById: z
    .string()
    .uuid('Invalid creator ID')
    .optional(),
  dateFrom: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  dateTo: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
}).refine(
  (data) => {
    if (data.dateFrom && data.dateTo) {
      return new Date(data.dateFrom) <= new Date(data.dateTo)
    }
    return true
  },
  {
    message: 'Date from must be before date to',
    path: ['dateTo']
  }
)

export const userSearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query cannot exceed 100 characters')
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  page: z
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
})

// File upload schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Please select a file' })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      'File size cannot exceed 10MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'].includes(file.type),
      'File type must be JPEG, PNG, PDF, or TXT'
    ),
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
})

// Settings and preferences schemas
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  caseAssignments: z.boolean(),
  caseUpdates: z.boolean(),
  systemAnnouncements: z.boolean(),
  weeklyReports: z.boolean()
})

export const appearancePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  compactMode: z.boolean(),
  showSidebar: z.boolean(),
  dateFormat: z.enum(['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']),
  timeFormat: z.enum(['12h', '24h'])
})

// Export type inference helpers
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type CreateCaseFormData = z.infer<typeof createCaseSchema>
export type UpdateCaseFormData = z.infer<typeof updateCaseSchema>
export type AssignCaseFormData = z.infer<typeof assignCaseSchema>
export type UpdateCaseStatusFormData = z.infer<typeof updateCaseStatusSchema>
export type AddCaseLogFormData = z.infer<typeof addCaseLogSchema>
export type CaseSearchFormData = z.infer<typeof caseSearchSchema>
export type UserSearchFormData = z.infer<typeof userSearchSchema>
export type FileUploadFormData = z.infer<typeof fileUploadSchema>
export type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>
export type AppearancePreferencesData = z.infer<typeof appearancePreferencesSchema>