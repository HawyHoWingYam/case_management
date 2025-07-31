const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './frontend',
});

const customJestConfig = {
  displayName: 'Frontend Unit Tests',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test/**/*',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageDirectory: '../coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html'],
};

module.exports = createJestConfig(customJestConfig);