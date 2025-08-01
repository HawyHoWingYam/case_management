/**
 * Shared enums for the Case Management System
 */

export enum UserRole {
  CLERK = 'CLERK',
  CHAIR = 'CHAIR',
  CASEWORKER = 'CASEWORKER',
}

export enum CaseStatus {
  NEW = 'NEW',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_COMPLETION = 'PENDING_COMPLETION',
  COMPLETED = 'COMPLETED',
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum WebhookEvent {
  CASE_CREATED = 'case.created',
  CASE_ASSIGNED = 'case.assigned',
  CASE_STATUS_CHANGED = 'case.status_changed',
  CASE_COMPLETED = 'case.completed',
  USER_REGISTERED = 'user.registered',
  TEST_EVENT = 'test',
}