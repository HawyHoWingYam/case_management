/**
 * Test fixtures index
 * Exports all test fixtures for easy importing
 */

export * from './user.fixtures';
export * from './client.fixtures';
export * from './case.fixtures';

// Re-export common test data patterns
export const commonTestData = {
  // Common IDs for consistent testing
  ids: {
    user: '123e4567-e89b-12d3-a456-426614174000',
    client: '223e4567-e89b-12d3-a456-426614174000',
    case: '323e4567-e89b-12d3-a456-426614174000',
    document: '423e4567-e89b-12d3-a456-426614174000',
    note: '523e4567-e89b-12d3-a456-426614174000',
  },

  // Common dates for testing
  dates: {
    past: new Date('2023-01-01T00:00:00Z'),
    recent: new Date('2024-01-01T00:00:00Z'),
    current: new Date(),
    future: new Date('2025-01-01T00:00:00Z'),
  },

  // Common pagination parameters
  pagination: {
    default: { page: 1, limit: 10 },
    small: { page: 1, limit: 5 },
    large: { page: 1, limit: 50 },
    secondPage: { page: 2, limit: 10 },
  },

  // Common validation test cases
  validation: {
    email: {
      valid: ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org'],
      invalid: ['invalid-email', 'test@', '@example.com', 'test..test@example.com'],
    },
    phone: {
      valid: ['+1234567890', '+1-234-567-8900', '(234) 567-8900'],
      invalid: ['123', 'abc-def-ghij', '+1-234-567-89000'],
    },
    password: {
      valid: ['Password123!', 'ComplexP@ssw0rd', 'Secure123$'],
      invalid: ['password', '12345678', 'PASSWORD', 'Pass123'],
    },
    names: {
      valid: ['John', 'Mary-Jane', "O'Connor", 'José'],
      invalid: ['', '123', 'Name123', 'Very Long Name That Exceeds Maximum Length Limit'],
    },
  },

  // HTTP status codes for testing
  httpStatus: {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    unprocessableEntity: 422,
    internalServerError: 500,
  },

  // JWT payload templates
  jwtPayloads: {
    caseworker: {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'caseworker@example.com',
      role: 'caseworker',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    admin: {
      sub: '123e4567-e89b-12d3-a456-426614174001',
      email: 'admin@example.com',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    supervisor: {
      sub: '123e4567-e89b-12d3-a456-426614174002',
      email: 'supervisor@example.com',
      role: 'supervisor',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    expired: {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'caseworker@example.com',
      role: 'caseworker',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    },
  },
};