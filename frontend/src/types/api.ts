// API endpoint constants
export const API_ENDPOINTS = {
  // Cases endpoints
  CASES: {
    LIST: '/api/cases',
    DETAIL: (id: number) => `/api/cases/${id}`,
    CREATE: '/api/cases',
    UPDATE: (id: number) => `/api/cases/${id}`,
    DELETE: (id: number) => `/api/cases/${id}`,
    STATS: '/api/cases/stats',
  },
  
  // Dashboard endpoints
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
    ACTIVITY: '/api/dashboard/activity',
    SUMMARY: '/api/dashboard/summary',
    TASKS: '/api/dashboard/tasks',
  },
  
  // Users endpoints
  USERS: {
    LIST: '/api/users',
    DETAIL: (id: number) => `/api/users/${id}`,
    CREATE: '/api/users',
    UPDATE: (id: number) => `/api/users/${id}`,
    DELETE: (id: number) => `/api/users/${id}`,
  },
  
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
    REFRESH: '/api/auth/refresh',
  },
  
  // System endpoints
  SYSTEM: {
    HEALTH: '/api/health',
    INFO: '/api/info',
  },
  
  // File endpoints
  FILES: {
    UPLOAD: '/api/files/upload',
    DOWNLOAD: (filename: string) => `/api/files/download/${filename}`,
  },
}