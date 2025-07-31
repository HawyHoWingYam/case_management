export enum CaseStatus {
  NEW = 'new',
  PENDING_REVIEW = 'pending_review',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PENDING_CLIENT_RESPONSE = 'pending_client_response',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum UserRole {
  ADMIN = 'admin',
  CHAIR = 'chair',
  CASEWORKER = 'caseworker',
  CLERK = 'clerk',
  SUPERVISOR = 'supervisor',
  CLIENT = 'client',
}

export enum CaseType {
  CONSULTATION = 'consultation',
  LEGAL_ADVICE = 'legal_advice',
  REPRESENTATION = 'representation',
  MEDIATION = 'mediation',
  DOCUMENT_REVIEW = 'document_review',
  OTHER = 'other',
}