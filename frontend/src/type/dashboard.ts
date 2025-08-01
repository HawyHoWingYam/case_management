// frontend/src/types/dashboard.ts
import { Case, CaseStatus, CasePriority } from './case'

// 仪表板视图类型
export type DashboardView = 
  | 'overview'      // 概览
  | 'my_cases'      // 我的案件
  | 'assigned'      // 指派给我的
  | 'created'       // 我创建的
  | 'team'          // 团队案件
  | 'all'           // 所有案件
  | 'urgent'        // 紧急案件
  | 'pending'       // 待处理
  | 'in_progress'   // 进行中
  | 'resolved'      // 已解决

// 统计数据项
export interface DashboardStat {
  id: string
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon?: string
  color?: string
  link?: string
  roles: string[] // 哪些角色可以查看此统计
}

// 仪表板统计数据
export interface DashboardStats {
  totalCases: DashboardStat
  pendingCases: DashboardStat
  inProgressCases: DashboardStat
  resolvedCases: DashboardStat
  urgentCases: DashboardStat
  myCases: DashboardStat
  assignedToMe: DashboardStat
  teamCases?: DashboardStat
  activeUsers?: DashboardStat
  completionRate?: DashboardStat
}

// 最近活动项
export interface RecentActivity {
  id: string
  type: 'case_created' | 'case_updated' | 'case_assigned' | 'case_resolved' | 'case_commented'
  title: string
  description: string
  user: {
    id: number
    username: string
    avatar?: string
  }
  case?: {
    id: number
    title: string
    status: CaseStatus
    priority: CasePriority
  }
  timestamp: string
  metadata?: Record<string, any>
}

// 快速操作项
export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  link: string
  color?: string
  roles: string[] // 哪些角色可以使用此操作
  badge?: {
    text: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

// 角色特定视图配置
export interface RoleViewConfig {
  role: string
  defaultView: DashboardView
  availableViews: Array<{
    key: DashboardView
    label: string
    description: string
    icon?: string
  }>
  stats: Array<keyof DashboardStats>
  quickActions: string[] // QuickAction 的 id 数组
}

// 仪表板过滤器
export interface DashboardFilters {
  view?: DashboardView
  status?: CaseStatus[]
  priority?: CasePriority[]
  assignedTo?: number[]
  createdBy?: number[]
  dateRange?: {
    start: string
    end: string
  }
  searchTerm?: string
}

// API 查询参数
export interface DashboardQuery {
  view: DashboardView
  filters?: DashboardFilters
  userId?: number
  role?: string
  limit?: number
  offset?: number
}

// 仪表板数据响应
export interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  cases: Case[]
  meta: {
    total: number
    filtered: number
    hasMore: boolean
  }
  view: DashboardView
  appliedFilters: DashboardFilters
}

// 角色权限检查
export interface PermissionCheck {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAssign: boolean
  canViewAll: boolean
  canViewTeam: boolean
  canManageUsers: boolean
}

// 预定义的角色视图配置
export const ROLE_CONFIGS: Record<string, RoleViewConfig> = {
  ADMIN: {
    role: 'ADMIN',
    defaultView: 'overview',
    availableViews: [
      { key: 'overview', label: '概览', description: '系统整体状况' },
      { key: 'all', label: '所有案件', description: '查看所有案件' },
      { key: 'urgent', label: '紧急案件', description: '需要立即处理的案件' },
      { key: 'pending', label: '待处理', description: '等待分配或处理的案件' },
      { key: 'in_progress', label: '进行中', description: '正在处理的案件' },
    ],
    stats: ['totalCases', 'pendingCases', 'urgentCases', 'activeUsers', 'completionRate'],
    quickActions: ['create_case', 'manage_users', 'view_reports', 'system_settings'],
  },
  MANAGER: {
    role: 'MANAGER',
    defaultView: 'team',
    availableViews: [
      { key: 'overview', label: '概览', description: '团队工作概况' },
      { key: 'team', label: '团队案件', description: '团队负责的案件' },
      { key: 'my_cases', label: '我的案件', description: '我创建或负责的案件' },
      { key: 'urgent', label: '紧急案件', description: '紧急案件处理' },
    ],
    stats: ['teamCases', 'myCases', 'urgentCases', 'completionRate'],
    quickActions: ['create_case', 'assign_case', 'view_team', 'generate_report'],
  },
  USER: {
    role: 'USER',
    defaultView: 'my_cases',
    availableViews: [
      { key: 'my_cases', label: '我的案件', description: '我的所有案件' },
      { key: 'created', label: '我创建的', description: '我创建的案件' },
      { key: 'assigned', label: '指派给我的', description: '分配给我处理的案件' },
    ],
    stats: ['myCases', 'assignedToMe', 'inProgressCases', 'resolvedCases'],
    quickActions: ['create_case', 'my_tasks'],
  },
}

// 快速操作配置
export const QUICK_ACTIONS: Record<string, QuickAction> = {
  create_case: {
    id: 'create_case',
    title: '创建案件',
    description: '创建新的案件',
    icon: 'FileText',
    link: '/cases/new',
    color: 'blue',
    roles: ['ADMIN', 'MANAGER', 'USER'],
  },
  manage_users: {
    id: 'manage_users',
    title: '用户管理',
    description: '管理系统用户',
    icon: 'Users',
    link: '/admin/users',
    color: 'green',
    roles: ['ADMIN'],
  },
  assign_case: {
    id: 'assign_case',
    title: '分配案件',
    description: '分配案件给团队成员',
    icon: 'UserCheck',
    link: '/cases?view=pending',
    color: 'orange',
    roles: ['ADMIN', 'MANAGER'],
  },
  view_reports: {
    id: 'view_reports',
    title: '查看报表',
    description: '查看统计报表',
    icon: 'BarChart',
    link: '/reports',
    color: 'purple',
    roles: ['ADMIN', 'MANAGER'],
  },
  my_tasks: {
    id: 'my_tasks',
    title: '我的任务',
    description: '查看我的待办任务',
    icon: 'CheckCircle',
    link: '/tasks',
    color: 'cyan',
    roles: ['ADMIN', 'MANAGER', 'USER'],
  },
}