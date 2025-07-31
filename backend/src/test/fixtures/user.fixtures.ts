/**
 * User test fixtures
 */

export const userFixtures = {
  // Standard caseworker user
  caseworker: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'caseworker@example.com',
    passwordHash: '$2b$10$example.hash.for.testing',
    firstName: 'Test',
    lastName: 'Caseworker',
    role: 'caseworker' as const,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Admin user
  admin: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'admin@example.com',
    passwordHash: '$2b$10$example.hash.for.testing',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Supervisor user
  supervisor: {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'supervisor@example.com',
    passwordHash: '$2b$10$example.hash.for.testing',
    firstName: 'Supervisor',
    lastName: 'User',
    role: 'supervisor' as const,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // Inactive user for testing
  inactive: {
    id: '123e4567-e89b-12d3-a456-426614174003',
    email: 'inactive@example.com',
    passwordHash: '$2b$10$example.hash.for.testing',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'caseworker' as const,
    isActive: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },

  // User with minimal data
  minimal: {
    id: '123e4567-e89b-12d3-a456-426614174004',
    email: 'minimal@example.com',
    passwordHash: '$2b$10$example.hash.for.testing',
    firstName: 'Min',
    lastName: 'User',
    role: 'caseworker' as const,
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

// Helper function to create user with custom properties
export const createUserFixture = (overrides: Partial<typeof userFixtures.caseworker> = {}) => ({
  ...userFixtures.caseworker,
  ...overrides,
});

// Helper function to create multiple users
export const createUsersFixture = (count: number, baseUser = userFixtures.caseworker) => {
  return Array.from({ length: count }, (_, index) => ({
    ...baseUser,
    id: `${baseUser.id.slice(0, -3)}${String(index).padStart(3, '0')}`,
    email: `user${index}@example.com`,
    firstName: `User${index}`,
  }));
};

// User credentials for authentication tests
export const userCredentials = {
  caseworker: {
    email: 'caseworker@example.com',
    password: 'password123',
  },
  admin: {
    email: 'admin@example.com',
    password: 'admin123',
  },
  supervisor: {
    email: 'supervisor@example.com',
    password: 'supervisor123',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};