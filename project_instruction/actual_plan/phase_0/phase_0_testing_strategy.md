# Phase 0 Testing Implementation Plan

## **Testing Strategy Overview**

As the QA Engineer, I'll establish a comprehensive testing foundation for Phase 0 that follows the "shift-left" testing philosophy, implementing quality gates from the very beginning of the development lifecycle.

## **1. End-to-End Testing Strategy for Phase 0 Validation**

### **Core "Hello World" Testing Requirements**
- **Backend Health Check Test**: Validate `/api/health` endpoint returns `{ status: 'ok' }`
- **Frontend-Backend Integration**: Test Next.js calling backend API and displaying response
- **n8n Integration Test**: Validate n8n webhook receives data from `/api/n8n-test` endpoint
- **Database Connection Test**: Verify PostgreSQL connection and basic CRUD operations
- **File Upload Test**: Test S3 integration with presigned URLs

### **Critical Path Testing**
- Complete case lifecycle simulation: Create → Review → Assign → Process → Complete → Approve
- Role-based access control validation for all three user types (Clerk, Chair, Caseworker)
- Database transaction integrity during concurrent operations

## **2. Automated Testing Setup & Configuration**

### **Testing Framework Stack**
- **Unit Testing**: Jest for both backend (NestJS) and frontend (Next.js)
- **Integration Testing**: Supertest for API endpoints, React Testing Library for components
- **E2E Testing**: Cypress for user workflows (primary), Playwright as backup
- **API Testing**: Postman collections with Newman for CI integration
- **Performance Testing**: k6 for load testing API endpoints

### **Test Environment Configuration**
- **Isolated Test Database**: PostgreSQL container with test-specific schema
- **Mock S3 Service**: LocalStack for file upload testing
- **Test n8n Instance**: Dedicated testing workflows separate from development
- **CI Test Runner**: GitHub Actions with parallel test execution

## **3. Integration Testing Patterns**

### **API Integration Testing**
- **Contract Testing**: OpenAPI schema validation for all endpoints
- **Authentication Flow**: JWT token generation and validation
- **Database Transactions**: Rollback mechanisms for test data isolation
- **Error Handling**: Comprehensive error response validation
- **Rate Limiting**: API throttling behavior validation

### **Frontend-Backend Integration**
- **API Client Testing**: HTTP request/response handling
- **State Management**: Context/Zustand state synchronization
- **Error Boundary Testing**: Graceful error handling and user feedback
- **File Upload Progress**: Real-time upload status and error handling

## **4. n8n Workflow Testing Approach**

### **Workflow Validation Strategy**
- **Template Testing**: Validate all n8n workflow templates (api-slack, webhook-db, basic)
- **Deployment Testing**: Automated workflow deployment using existing scripts
- **Integration Testing**: Verify webhook endpoints receive and process data correctly
- **Performance Testing**: Workflow execution time and reliability metrics
- **Error Handling**: Failed workflow recovery and notification testing

## **5. Quality Gates & Acceptance Criteria**

### **Phase 0 Go/No-Go Criteria**
- ✅ All API endpoints return expected responses (100% success rate)
- ✅ Frontend successfully communicates with backend (no network errors)
- ✅ n8n workflows can be deployed and triggered programmatically
- ✅ Database migrations complete without errors
- ✅ File upload to S3 works with proper error handling
- ✅ Test coverage ≥90% for all implemented components
- ✅ No high or medium severity security vulnerabilities
- ✅ Performance benchmarks meet targets (API <200ms, Frontend LCP <2.5s)

### **Continuous Quality Monitoring**
- **Defect Escape Rate**: Target <5% (production bugs / total bugs found)
- **Mean Time to Detection (MTTD)**: <2 hours from code commit to defect detection
- **Requirements Coverage**: 100% of acceptance criteria have corresponding automated tests

## **6. CI/CD Testing Pipeline Integration**

### **GitHub Actions Workflow Structure**
```yaml
# Parallel execution strategy
- Unit Tests (Jest) - Backend & Frontend
- Integration Tests (Supertest + RTL)
- API Contract Testing (Postman/Newman)
- E2E Tests (Cypress) - Critical paths only
- Security Scanning (Snyk/OWASP ZAP)
- Performance Testing (k6) - Core endpoints
```

### **Quality Gates Implementation**
- **Pre-commit**: Linting, type checking, basic unit tests
- **PR Review**: Automated test execution + peer review requirement
- **Pre-merge**: Full test suite + security scan
- **Post-deploy**: Smoke tests + health checks

## **7. Testing Infrastructure & Environment**

### **Docker Test Environment**
- **Test Database**: PostgreSQL with isolated schemas per test suite
- **Mock Services**: LocalStack for S3, Redis for caching
- **Test Data Management**: Automated seed data generation and cleanup
- **Parallel Testing**: Database per worker to avoid conflicts

### **Test Data Strategy**
- **Fixtures**: Reusable test data for Users, Cases, Case_Logs
- **Factory Pattern**: Dynamic test data generation with realistic relationships
- **Database Seeding**: Automated setup/teardown for integration tests
- **Snapshot Testing**: UI component regression detection

## **8. Performance & Security Testing**

### **Performance Testing Strategy**
- **Load Testing**: k6 scripts for API endpoints under concurrent load
- **Frontend Performance**: Lighthouse CI for Core Web Vitals monitoring
- **Database Performance**: Query execution time monitoring and optimization
- **Memory Leak Detection**: Long-running test scenarios for backend services

### **Security Testing Integration**
- **OWASP ZAP**: Automated security scanning in CI pipeline
- **Snyk**: Dependency vulnerability scanning
- **JWT Security**: Token validation and expiration testing
- **Input Validation**: SQL injection and XSS prevention testing

## **Implementation Timeline**
1. **Week 1**: Setup testing infrastructure and basic unit tests
2. **Week 2**: Implement API integration tests and E2E framework
3. **Week 3**: n8n workflow testing and CI/CD integration
4. **Week 4**: Performance testing, security scanning, and quality gates

This comprehensive testing strategy ensures Phase 0 validation meets production-ready quality standards while establishing the foundation for continuous quality assurance throughout the project lifecycle.

## **Detailed Implementation**

### **Backend Unit Testing Setup**

#### Jest Configuration (backend/jest.config.js)
```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

#### Health Service Unit Test
```typescript
// backend/src/health/__tests__/health.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get(PrismaService);
  });

  describe('getBasicHealth', () => {
    it('should return basic health status', async () => {
      const result = await service.getBasicHealth();
      
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health with database status when connected', async () => {
      prismaService.$queryRaw.mockResolvedValue([]);
      
      const result = await service.getDetailedHealth();
      
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database');
      expect(result.services.database.status).toBe('connected');
      expect(result.services.database).toHaveProperty('responseTime');
    });

    it('should handle database connection errors', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));
      
      const result = await service.getDetailedHealth();
      
      expect(result.services.database.status).toBe('disconnected');
      expect(result.services.database).not.toHaveProperty('responseTime');
    });
  });
});
```

### **API Integration Testing**

#### Supertest Integration Test
```typescript
// backend/test/integration/health.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Health API (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prismaService.cleanDatabase();
  });

  describe('/api/health (GET)', () => {
    it('should return basic health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('/api/health/detailed (GET)', () => {
    it('should return detailed health status', () => {
      return request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body).toHaveProperty('services');
          expect(res.body.services).toHaveProperty('database');
          expect(res.body.services.database.status).toBe('connected');
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### **Frontend Testing Setup**

#### Jest Configuration (frontend/jest.config.js)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for us)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

#### Component Unit Test
```typescript
// frontend/src/components/features/health/__tests__/health-dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HealthDashboard } from '../health-dashboard'
import { apiClient } from '@/lib/api'

// Mock the API client
jest.mock('@/lib/api')
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

// Mock the hooks
jest.mock('@/hooks/use-health', () => ({
  useHealth: jest.fn(),
  useDetailedHealth: jest.fn(),
}))

import { useHealth, useDetailedHealth } from '@/hooks/use-health'
const mockUseHealth = useHealth as jest.MockedFunction<typeof useHealth>
const mockUseDetailedHealth = useDetailedHealth as jest.MockedFunction<typeof useDetailedHealth>

describe('HealthDashboard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HealthDashboard />
      </QueryClientProvider>
    )
  }

  it('should render loading state initially', () => {
    mockUseHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    } as any)

    mockUseDetailedHealth.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn(),
    } as any)

    renderComponent()

    expect(screen.getAllByTestId(/skeleton/i)).toHaveLength(5) // Title + 4 cards
  })

  it('should render health data when loaded', async () => {
    const mockHealthData = {
      status: 'ok',
      timestamp: '2023-01-01T00:00:00.000Z',
      uptime: 3600,
    }

    const mockDetailedData = {
      ...mockHealthData,
      services: {
        database: {
          status: 'connected',
          responseTime: 50,
        },
        memory: {
          used: 256,
          total: 1024,
          unit: 'MB',
        },
      },
    }

    mockUseHealth.mockReturnValue({
      data: mockHealthData,
      isLoading: false,
      refetch: jest.fn(),
    } as any)

    mockUseDetailedHealth.mockReturnValue({
      data: mockDetailedData,
      isLoading: false,
      refetch: jest.fn(),
    } as any)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument()
      expect(screen.getByText('Healthy')).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(screen.getByText('256/1024 MB')).toBeInTheDocument()
    })
  })
})
```

### **E2E Testing with Cypress**

#### Cypress Configuration
```typescript
// frontend/cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: false,
    screenshot: false,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
  },
})
```

#### E2E Health Check Test
```typescript
// frontend/cypress/e2e/health-check.cy.ts
describe('Health Check Flow', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/health', {
      statusCode: 200,
      body: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 3600,
      },
    }).as('getHealth')

    cy.intercept('GET', '/api/health/detailed', {
      statusCode: 200,
      body: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 3600,
        services: {
          database: {
            status: 'connected',
            responseTime: 50,
          },
          memory: {
            used: 256,
            total: 1024,
            unit: 'MB',
          },
        },
      },
    }).as('getDetailedHealth')
  })

  it('should display system health dashboard', () => {
    cy.visit('/')
    
    // Wait for API calls
    cy.wait(['@getHealth', '@getDetailedHealth'])
    
    // Check page title
    cy.contains('System Health').should('be.visible')
    
    // Check health status cards
    cy.contains('Healthy').should('be.visible')
    cy.contains('Connected').should('be.visible')
    cy.contains('256/1024 MB').should('be.visible')
    
    // Check refresh functionality
    cy.contains('button', 'Refresh').click()
    cy.wait(['@getHealth', '@getDetailedHealth'])
  })

  it('should handle API errors gracefully', () => {
    // Override with error response
    cy.intercept('GET', '/api/health', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    }).as('getHealthError')

    cy.visit('/')
    
    cy.wait('@getHealthError')
    
    // Should display error state
    cy.contains('Error loading health data').should('be.visible')
  })
})
```

### **n8n Integration Testing**

#### n8n Webhook Test
```typescript
// backend/test/integration/n8n-webhook.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import nock from 'nock';

describe('n8n Webhook Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    // Mock n8n webhook endpoint
    nock(process.env.N8N_WEBHOOK_URL.split('/webhook')[0])
      .post('/webhook')
      .reply(200, { success: true });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('/api/n8n-test (POST)', () => {
    it('should successfully send webhook to n8n', () => {
      const testPayload = {
        message: 'Test integration',
        data: { test: true },
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(testPayload)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('successfully');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.n8nResponse.status).toBe(200);
        });
    });

    it('should handle n8n service unavailable', () => {
      nock.cleanAll();
      nock(process.env.N8N_WEBHOOK_URL.split('/webhook')[0])
        .post('/webhook')
        .reply(503, { error: 'Service Unavailable' });

      const testPayload = {
        message: 'Test integration failure',
      };

      return request(app.getHttpServer())
        .post('/api/n8n-test')
        .send(testPayload)
        .expect(503);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### **Performance Testing with k6**

#### API Load Test Script
```javascript
// scripts/performance/api-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

const BASE_URL = 'http://localhost:3001/api';

export default function () {
  // Test health endpoint
  let healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
    'health status is ok': (r) => JSON.parse(r.body).status === 'ok',
  });

  // Test detailed health endpoint
  let detailedResponse = http.get(`${BASE_URL}/health/detailed`);
  check(detailedResponse, {
    'detailed health status is 200': (r) => r.status === 200,
    'detailed health response time < 500ms': (r) => r.timings.duration < 500,
    'detailed health has services': (r) => JSON.parse(r.body).services !== undefined,
  });

  sleep(1);
}
```

### **CI/CD Pipeline Integration**

#### GitHub Actions Testing Workflow
```yaml
# .github/workflows/test.yml
name: Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: case_management_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run unit tests
        run: cd backend && npm run test:cov
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/case_management_test

      - name: Run integration tests
        run: cd backend && npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/case_management_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage/lcov.info

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run unit tests
        run: cd frontend && npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: frontend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Start services
        run: |
          docker-compose -f docker-compose.test.yml up -d
          # Wait for services to be ready
          sleep 30

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Start applications
        run: |
          cd backend && npm run start:dev &
          cd frontend && npm run dev &
          sleep 10

      - name: Run Cypress tests
        run: cd frontend && npx cypress run

      - name: Stop services
        run: docker-compose -f docker-compose.test.yml down

  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start test environment
        run: |
          docker-compose -f docker-compose.test.yml up -d
          sleep 30

      - name: Run performance tests
        run: k6 run scripts/performance/api-load-test.js

      - name: Stop test environment
        run: docker-compose -f docker-compose.test.yml down
```

This comprehensive testing implementation ensures Phase 0 meets the highest quality standards with automated validation at every level of the application stack.