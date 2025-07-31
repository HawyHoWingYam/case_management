# DevOps Infrastructure Implementation Plan for Phase 0

## Overview
This plan establishes a comprehensive DevOps foundation for the Case Management System, focusing on automation, infrastructure as code, and production-ready CI/CD pipelines that enforce the three core team principles: Peer Review Model, Data-Driven Decisions, and Definition of Done.

## 1. Docker & Development Environment Strategy

### 1.1 Docker Compose Architecture
- **Primary**: `docker-compose.dev.yml` for local development with hot-reload
- **Testing**: `docker-compose.test.yml` for isolated test environments  
- **Services**: PostgreSQL, Redis (for sessions/cache), MinIO (S3 alternative), pgAdmin
- **Networking**: Dedicated networks for database, cache, and application tiers
- **Volumes**: Persistent data volumes with backup strategies

### 1.2 Development Environment Automation
- **Prerequisites checker script**: Validates Node.js, Docker, n8n, VS Code extensions
- **One-command setup**: `make dev-setup` bootstraps entire local environment
- **Environment variables**: Template `.env.example` files with secure defaults
- **Service health checks**: Automated verification of all services before development

## 2. CI/CD Pipeline Design (GitHub Actions)

### 2.1 Multi-Agent Workflow Architecture
- **Backend Pipeline**: `.github/workflows/backend-ci.yml`
  - Triggers: PRs to `main`/`develop`, changes in `backend/`
  - Jobs: lint → test → build → security-scan → deploy-staging
- **Frontend Pipeline**: `.github/workflows/frontend-ci.yml`  
  - Triggers: PRs to `main`/`develop`, changes in `frontend/`
  - Jobs: lint → test → lighthouse-audit → build → deploy-preview
- **Database Pipeline**: `.github/workflows/database-ci.yml`
  - Triggers: Changes in `migrations/`, `schemas/`
  - Jobs: migration-test → rollback-test → performance-benchmark

### 2.2 Quality Gates Implementation
- **Automated PR checks**: ESLint, Prettier, TypeScript compilation
- **Test coverage gates**: Minimum 90% coverage requirement
- **Security scanning**: Snyk for dependencies, CodeQL for code analysis
- **Performance budgets**: Lighthouse CI with configurable thresholds
- **Branch protection**: Enforce peer review and CI passage before merge

### 2.3 Deployment Strategy
- **Staging**: Automatic deployment from `develop` branch
- **Production**: Manual approval required, blue-green deployment
- **Rollback**: One-click rollback capability with database migration handling
- **Environment parity**: Identical configurations across all environments

## 3. Branch Protection & Git Workflow

### 3.1 Branch Strategy
- **main**: Production-ready code, protected with required reviews
- **develop**: Integration branch, auto-deploy to staging
- **feature/***: Feature development branches with automated testing
- **hotfix/***: Critical production fixes with expedited pipeline

### 3.2 Automated Review Assignment
- **CODEOWNERS file**: Auto-assign reviewers based on changed files
- **Review requirements**: Minimum 2 approvals for critical paths
- **Status checks**: All CI pipelines must pass before merge
- **Automated notifications**: n8n workflow for review reminders

## 4. Environment Configuration Management

### 4.1 Secrets Management
- **GitHub Secrets**: Production credentials, API keys
- **Environment-specific**: Separate secret stores per environment  
- **Rotation strategy**: Automated secret rotation with zero-downtime
- **Audit logging**: Complete audit trail for secret access

### 4.2 Configuration Templates
- **Environment files**: `.env.development`, `.env.staging`, `.env.production`
- **Docker configs**: Environment-specific Docker Compose overrides
- **Application configs**: Centralized configuration management
- **Documentation**: Clear documentation for all configuration options

## 5. n8n Integration & Business Process Automation

### 5.1 DevOps Automation Workflows
- **PR Review Reminders**: Auto-notify reviewers after 24 hours
- **Deployment Notifications**: Slack/email notifications for deployment status
- **Error Alerting**: Production error monitoring with automatic issue creation
- **Performance Monitoring**: Automated performance regression detection

### 5.2 Business Process Integration
- **Case lifecycle notifications**: New case → Chair notification
- **Assignment workflows**: Auto-assign cases based on workload
- **Status change alerts**: Real-time notifications for status updates
- **Reporting automation**: Scheduled generation and distribution of reports

### 5.3 Workflow Management
- **Version control**: n8n workflows stored as JSON in `n8n/workflows/`
- **Deployment automation**: Scripted deployment of n8n workflows
- **Testing framework**: Automated testing of n8n workflow logic
- **Monitoring**: Health checks and performance monitoring for workflows

## 6. Monitoring & Observability

### 6.1 Application Monitoring
- **Performance metrics**: Response times, throughput, error rates
- **Business metrics**: Case processing times, user activity
- **Infrastructure metrics**: CPU, memory, disk usage, database performance
- **Custom dashboards**: Role-specific monitoring dashboards

### 6.2 Logging Strategy
- **Centralized logging**: AWS CloudWatch or ELK stack
- **Structured logging**: JSON format with correlation IDs
- **Log retention**: Environment-specific retention policies
- **Search and alerting**: Real-time log analysis and alerting

### 6.3 Alerting Framework
- **Critical alerts**: Database down, application errors, security incidents
- **Warning alerts**: Performance degradation, capacity thresholds
- **Business alerts**: SLA breaches, workflow failures
- **Escalation policies**: Automated escalation based on severity

## 7. Security & Compliance

### 7.1 Security Automation
- **Dependency scanning**: Automated vulnerability detection
- **Code security**: Static analysis security testing (SAST)
- **Container security**: Docker image vulnerability scanning
- **Secrets scanning**: Prevent secret commits to repository

### 7.2 Compliance Framework
- **Audit trails**: Complete audit logging for all actions
- **Access controls**: Role-based access with principle of least privilege
- **Data protection**: Encryption at rest and in transit
- **Backup strategy**: Automated backups with disaster recovery testing

## 8. Performance & Scalability

### 8.1 Performance Monitoring
- **Synthetic monitoring**: Automated performance testing
- **Real user monitoring**: Actual user experience tracking
- **Database performance**: Query optimization and monitoring
- **API performance**: Response time and throughput monitoring

### 8.2 Scalability Planning
- **Horizontal scaling**: Auto-scaling groups for application tiers
- **Database scaling**: Read replicas and connection pooling
- **CDN integration**: Static asset optimization and delivery
- **Caching strategy**: Multi-tier caching implementation

## Implementation Priority

### Phase 0.1 (Week 1): Foundation
1. Docker Compose development environment
2. Basic CI/CD pipelines for backend/frontend
3. Branch protection and review workflows
4. Environment configuration templates

### Phase 0.2 (Week 2): Automation
1. n8n business process workflows
2. Monitoring and alerting setup  
3. Security scanning integration
4. Performance monitoring baseline

### Phase 0.3 (Week 3): Production Readiness
1. Production deployment strategy
2. Disaster recovery procedures
3. Performance optimization
4. Documentation and runbooks

This plan establishes a robust DevOps foundation that supports the multi-agent development approach while ensuring production-ready quality and automated enforcement of team principles.

## Detailed Implementation Files

### Docker Compose Configuration
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: case_management_db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: case_management
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
      - ./docker/postgres/config/postgresql.conf:/etc/postgresql/postgresql.conf
    networks:
      - case_management_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d case_management"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: case_management_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - case_management_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: case_management_minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - case_management_network
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: case_management_pgadmin
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@localhost
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
    volumes:
      - pgadmin_data:/var/lib/pgadmin
      - ./docker/pgadmin/servers.json:/pgadmin4/servers.json
    depends_on:
      - postgres
    networks:
      - case_management_network

volumes:
  postgres_data:
  redis_data:
  minio_data:
  pgadmin_data:

networks:
  case_management_network:
    driver: bridge
```

### GitHub Actions Workflows

#### Backend CI Pipeline
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  test:
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

      - name: Lint
        run: cd backend && npm run lint

      - name: Type check
        run: cd backend && npm run type-check

      - name: Run tests
        run: cd backend && npm run test:cov
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/case_management_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage/lcov.info

      - name: Security scan
        run: cd backend && npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

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

      - name: Build
        run: cd backend && npm run build

      - name: Build Docker image
        run: |
          cd backend
          docker build -t case-management-backend:${{ github.sha }} .
```

#### Frontend CI Pipeline
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main, develop]
    paths: ['frontend/**']

jobs:
  test:
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

      - name: Lint
        run: cd frontend && npm run lint

      - name: Type check
        run: cd frontend && npm run type-check

      - name: Run tests
        run: cd frontend && npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: frontend/coverage/lcov.info

  lighthouse:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'

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

      - name: Build
        run: cd frontend && npm run build

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          cd frontend && lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

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

      - name: Build
        run: cd frontend && npm run build

      - name: Build Docker image
        run: |
          cd frontend
          docker build -t case-management-frontend:${{ github.sha }} .
```

### Environment Configuration

#### Development Environment Template
```bash
# .env.development
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://admin:password@localhost:5432/case_management?schema=public"
DB_PASSWORD=password

# Redis
REDIS_URL="redis://localhost:6379"

# MinIO (S3 Alternative)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=case-documents

# JWT
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=1d

# pgAdmin
PGADMIN_PASSWORD=admin

# n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Prerequisites Check Script
```bash
#!/bin/bash
# scripts/check-prerequisites.sh

echo "🔍 Checking development prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION found"
else
    echo "❌ Node.js not found. Please install Node.js 18+ or 20+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm $NPM_VERSION found"
else
    echo "❌ npm not found"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ $DOCKER_VERSION found"
else
    echo "❌ Docker not found. Please install Docker Desktop"
    exit 1
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "✅ $COMPOSE_VERSION found"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

# Check n8n availability
if curl -s http://localhost:5678/healthz &> /dev/null; then
    echo "✅ n8n is running on localhost:5678"
else
    echo "⚠️  n8n not accessible on localhost:5678. Please start n8n."
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo "✅ $GIT_VERSION found"
else
    echo "❌ Git not found"
    exit 1
fi

echo "✅ All prerequisites checked!"
```

### Development Setup Makefile
```makefile
# Makefile
.PHONY: dev-setup dev-up dev-down dev-reset check-prereqs

# Check prerequisites and setup development environment
dev-setup: check-prereqs
	@echo "🚀 Setting up development environment..."
	cp .env.example .env.development
	docker-compose -f docker-compose.dev.yml up -d
	@echo "⏳ Waiting for services to be ready..."
	./scripts/wait-for-services.sh
	cd backend && npm install && npx prisma migrate dev
	cd frontend && npm install
	@echo "✅ Development environment ready!"

# Start development services
dev-up:
	docker-compose -f docker-compose.dev.yml up -d

# Stop development services
dev-down:
	docker-compose -f docker-compose.dev.yml down

# Reset development environment
dev-reset:
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev.yml up -d
	./scripts/wait-for-services.sh
	cd backend && npx prisma migrate reset --force

# Check prerequisites
check-prereqs:
	./scripts/check-prerequisites.sh
```

This comprehensive DevOps plan ensures a robust, automated, and scalable infrastructure foundation for the Case Management System development lifecycle.