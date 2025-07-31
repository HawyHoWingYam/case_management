/**
 * Case test fixtures
 */

import { userFixtures } from './user.fixtures';
import { clientFixtures } from './client.fixtures';

export const caseFixtures = {
  // Standard open case
  openCase: {
    id: '323e4567-e89b-12d3-a456-426614174000',
    title: 'Test Case - Open',
    description: 'This is a test case in open status for unit testing purposes',
    status: 'open' as const,
    priority: 'medium' as const,
    assignedUserId: userFixtures.caseworker.id,
    clientId: clientFixtures.individual.id,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // High priority case
  highPriorityCase: {
    id: '323e4567-e89b-12d3-a456-426614174001',
    title: 'Urgent Case - High Priority',
    description: 'High priority case requiring immediate attention',
    status: 'open' as const,
    priority: 'high' as const,
    assignedUserId: userFixtures.caseworker.id,
    clientId: clientFixtures.individual.id,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },

  // Closed case
  closedCase: {
    id: '323e4567-e89b-12d3-a456-426614174002',
    title: 'Completed Case',
    description: 'This case has been resolved and closed successfully',
    status: 'closed' as const,
    priority: 'low' as const,
    assignedUserId: userFixtures.caseworker.id,
    clientId: clientFixtures.family.id,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  },

  // In progress case
  inProgressCase: {
    id: '323e4567-e89b-12d3-a456-426614174003',
    title: 'Case In Progress',
    description: 'Case currently being worked on by caseworker',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    assignedUserId: userFixtures.caseworker.id,
    clientId: clientFixtures.elderly.id,
    createdAt: new Date('2024-01-10T00:00:00Z'),
    updatedAt: new Date('2024-01-12T00:00:00Z'),
  },

  // Unassigned case
  unassignedCase: {
    id: '323e4567-e89b-12d3-a456-426614174004',
    title: 'Unassigned Case',
    description: 'Case that has not been assigned to any caseworker yet',
    status: 'open' as const,
    priority: 'medium' as const,
    assignedUserId: null,
    clientId: clientFixtures.individual.id,
    createdAt: new Date('2024-01-15T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  },

  // Case with long description
  longDescriptionCase: {
    id: '323e4567-e89b-12d3-a456-426614174005',
    title: 'Case with Detailed Description',
    description: 'This is a test case with a very long and detailed description that spans multiple lines and contains various details about the case circumstances, client background, assessment findings, intervention plans, and other relevant information that caseworkers need to track and manage throughout the case lifecycle.',
    status: 'open' as const,
    priority: 'medium' as const,
    assignedUserId: userFixtures.supervisor.id,
    clientId: clientFixtures.individual.id,
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z'),
  },

  // Overdue case (older than 30 days with no updates)
  overdueCase: {
    id: '323e4567-e89b-12d3-a456-426614174006',
    title: 'Overdue Case',
    description: 'Case that has been open for too long without updates',
    status: 'open' as const,
    priority: 'high' as const,
    assignedUserId: userFixtures.caseworker.id,
    clientId: clientFixtures.family.id,
    createdAt: new Date('2023-11-01T00:00:00Z'),
    updatedAt: new Date('2023-11-05T00:00:00Z'),
  },
};

// Helper function to create case with custom properties
export const createCaseFixture = (overrides: Partial<typeof caseFixtures.openCase> = {}) => ({
  ...caseFixtures.openCase,
  ...overrides,
});

// Helper function to create multiple cases
export const createCasesFixture = (count: number, baseCase = caseFixtures.openCase) => {
  return Array.from({ length: count }, (_, index) => ({
    ...baseCase,
    id: `${baseCase.id.slice(0, -3)}${String(index).padStart(3, '0')}`,
    title: `${baseCase.title} ${index + 1}`,
    createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)), // Each case 1 day older
  }));
};

// Case form data for testing
export const caseFormData = {
  valid: {
    title: 'New Test Case',
    description: 'Description for new test case',
    priority: 'medium' as const,
    clientId: clientFixtures.individual.id,
  },
  
  invalid: {
    title: '', // Required field empty
    description: 'Description for invalid case',
    priority: 'invalid' as any,
    clientId: 'invalid-client-id',
  },

  minimal: {
    title: 'Minimal Case',
    description: 'Min desc',
    priority: 'low' as const,
    clientId: clientFixtures.individual.id,
  },

  withLongData: {
    title: 'A'.repeat(500), // Test max length validation
    description: 'B'.repeat(2000),
    priority: 'high' as const,
    clientId: clientFixtures.individual.id,
  },
};

// Case status transitions for testing
export const caseStatusTransitions = {
  openToInProgress: {
    from: 'open' as const,
    to: 'in_progress' as const,
  },
  inProgressToClosed: {
    from: 'in_progress' as const,
    to: 'closed' as const,
  },
  openToClosed: {
    from: 'open' as const,
    to: 'closed' as const,
  },
  closedToOpen: {
    from: 'closed' as const,
    to: 'open' as const,
  },
};

// Case search criteria for testing
export const caseSearchCriteria = {
  byStatus: {
    status: 'open' as const,
  },
  byPriority: {
    priority: 'high' as const,
  },
  byAssignedUser: {
    assignedUserId: userFixtures.caseworker.id,
  },
  byClient: {
    clientId: clientFixtures.individual.id,
  },
  complex: {
    status: 'open' as const,
    priority: 'high' as const,
    assignedUserId: userFixtures.caseworker.id,
  },
};