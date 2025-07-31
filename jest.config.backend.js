module.exports = {
  displayName: 'Backend Unit Tests',
  testEnvironment: 'node',
  rootDir: 'backend',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/main.ts',
    '!src/migrations/**',
  ],
  coverageDirectory: '../coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};