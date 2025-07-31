# Phase 0 Implementation Guide
## Practical Execution Guide for Foundation Setup

### 🎯 Overview
This guide provides step-by-step instructions to implement Phase 0 of the case management system, based on the expert team's collaborative analysis and recommendations.

**Target Completion Time**: 21 days (3 weeks)
**Team Approach**: Multi-expert collaboration with defined roles and responsibilities

---

## 📋 Prerequisites Checklist

Before starting Phase 0 implementation, ensure you have:

### Development Environment
- [ ] **Node.js 18+** installed
- [ ] **Docker Desktop** installed and running
- [ ] **Git** configured with proper SSH keys
- [ ] **VS Code** with recommended extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - Docker
  - PostgreSQL
  - Tailwind CSS IntelliSense

### Accounts & Access
- [ ] **AWS Account** with appropriate permissions (or LocalStack for development)
- [ ] **GitHub Repository** access with proper branch permissions
- [ ] **Development Team Communication** channel established

### Project Structure
- [ ] **Repository** cloned and organized:
  ```
  case_management/
  ├── frontend/          # Next.js application
  ├── backend/           # NestJS application
  ├── docs/              # Documentation
  ├── docker/            # Docker configurations
  └── scripts/           # Automation scripts
  ```

---

## 🗓️ Week 1: Infrastructure & Foundation (Days 1-7)

### Day 1-2: Docker Environment Setup

#### Step 1.1: Create Docker Configuration
Create `docker-compose.dev.yml` in project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: case-management-postgres
    environment:
      POSTGRES_DB: case_management_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_user -d case_management_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: case-management-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

  localstack:
    image: localstack/localstack:latest
    container_name: case-management-localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,ses
      - DEBUG=1
    volumes:
      - localstack_data:/tmp/localstack

  mailhog:
    image: mailhog/mailhog
    container_name: case-management-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_dev_data:
  redis_dev_data:
  localstack_data:
```

#### Step 1.2: Start Development Environment
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps

# Check logs if needed
docker-compose -f docker-compose.dev.yml logs postgres
```

#### Step 1.3: Create Environment Files
Create `.env.development` files for both frontend and backend:

**Backend `.env.development`:**
```bash
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/case_management_dev"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_password
DB_NAME=case_management_dev

# JWT
JWT_SECRET=dev-secret-key-change-in-production-very-long-string
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AWS (LocalStack)
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=localstack
AWS_SECRET_ACCESS_KEY=localstack
AWS_S3_BUCKET=case-management-dev
AWS_S3_ENDPOINT=http://localhost:4566

# Email (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM=noreply@case-management.local

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend `.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="Case Management System"
```

### Day 3-4: Database Schema & Migrations

#### Step 3.1: Initialize NestJS Backend
```bash
cd backend
npm i -g @nestjs/cli
nest new . --skip-git
npm install @nestjs/typeorm typeorm pg @nestjs/config
npm install bcrypt jsonwebtoken @nestjs/jwt @nestjs/passport passport-jwt
npm install class-validator class-transformer
```

#### Step 3.2: Create Database Entities
Follow the entity structure defined in Phase 0 documentation:

**User Entity** (`src/entities/user.entity.ts`):
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Case } from './case.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ type: 'enum', enum: ['Clerk', 'Chair', 'Caseworker'] })
  role: string;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Case, (case_) => case_.created_by)
  created_cases: Case[];

  @OneToMany(() => Case, (case_) => case_.assigned_caseworker)
  assigned_cases: Case[];
}
```

#### Step 3.3: Create and Run Migrations
```bash
# Generate migration
npm run migration:generate -- -n InitialSchema

# Run migration
npm run migration:run

# Verify database structure
docker exec -it case-management-postgres psql -U dev_user -d case_management_dev -c "\dt"
```

### Day 5-7: Authentication System

#### Step 5.1: Create Authentication Module
```bash
nest generate module auth
nest generate service auth
nest generate controller auth
```

#### Step 5.2: Implement JWT Strategy
Create authentication service with JWT implementation following the API developer's specifications.

#### Step 5.3: Create User Seed Data
```typescript
// src/database/seeds/user.seed.ts
export const seedUsers = [
  {
    email: 'clerk@example.com',
    password: 'Password123!',
    role: 'Clerk',
    name: 'Alice Clerk'
  },
  {
    email: 'chair@example.com',
    password: 'Password123!',
    role: 'Chair',
    name: 'Bob Chair'
  },
  {
    email: 'caseworker1@example.com',
    password: 'Password123!',
    role: 'Caseworker',
    name: 'Carol Caseworker'
  },
  {
    email: 'caseworker2@example.com',
    password: 'Password123!',
    role: 'Caseworker',
    name: 'David Caseworker'
  }
];
```

---

## 🗓️ Week 2: Core Development (Days 8-14)

### Day 8-10: CRUD Operations & API Endpoints

#### Step 8.1: Create Cases Module
```bash
nest generate module cases
nest generate service cases
nest generate controller cases
```

#### Step 8.2: Implement Core Endpoints
Based on frontend expert's requirements:
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id`

#### Step 8.3: Add Role-Based Guards
Implement the role-based access control system as specified by the API developer.

### Day 11-12: Frontend Authentication Components

#### Step 11.1: Initialize Next.js Frontend
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm install @hookform/resolvers zod react-hook-form swr
npm install @headlessui/react @heroicons/react
```

#### Step 11.2: Create Authentication Components
Following frontend expert's component structure:
- `AuthProvider`
- `LoginForm`
- `AuthGuard`
- `RoleGuard`

#### Step 11.3: Implement API Client
Create the API client with proper error handling and token management.

### Day 13-14: S3 File Upload Integration

#### Step 13.1: Backend File Service
Create file management service with S3 integration using LocalStack for development.

#### Step 13.2: Frontend File Upload Component
Implement the drag-and-drop file upload component with proper validation.

---

## 🗓️ Week 3: Testing & Quality (Days 15-21)

### Day 15-17: Test Suite Implementation

#### Step 15.1: Backend Testing Setup
```bash
cd backend
npm install --save-dev jest @nestjs/testing supertest @types/jest
```

#### Step 15.2: Frontend Testing Setup
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

#### Step 15.3: Implement Test Cases
Follow testing expert's comprehensive test strategy:
- Unit tests for authentication service
- Integration tests for database operations
- API endpoint tests
- Frontend component tests

### Day 18-19: Security & Performance Validation

#### Step 18.1: Security Audit
- Run security scans using npm audit
- Validate input sanitization
- Test authentication security
- Verify file upload security

#### Step 18.2: Performance Testing
- Database query performance testing
- API response time validation
- Frontend bundle size optimization

### Day 20-21: Documentation & Final Review

#### Step 20.1: Complete Documentation
- API documentation using Swagger
- Frontend component documentation using Storybook
- Environment setup guides
- Deployment instructions

#### Step 20.2: Final Review Process
Follow the code reviewer's quality standards:
- Multi-expert code review
- Automated quality gate validation
- Security review completion
- Performance benchmark verification

---

## 🔍 Quality Gates & Checkpoints

### Daily Checkpoints
At the end of each day, verify:
- [ ] All planned tasks completed
- [ ] Tests are passing
- [ ] No TypeScript compilation errors
- [ ] Git commits are properly formatted
- [ ] Documentation is updated

### Weekly Milestones

**Week 1 Completion:**
- [ ] Docker environment running successfully
- [ ] Database schema created and migrated
- [ ] Authentication system functional
- [ ] Basic API endpoints working

**Week 2 Completion:**
- [ ] All CRUD operations implemented
- [ ] Frontend authentication flow working
- [ ] File upload system functional
- [ ] Integration between frontend and backend established

**Week 3 Completion:**
- [ ] Test coverage ≥ 90% for critical modules
- [ ] Security review passed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Ready for Phase 1 development

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### Docker Issues
**Problem**: Containers won't start
**Solution**: 
```bash
docker-compose -f docker-compose.dev.yml down
docker system prune -f
docker-compose -f docker-compose.dev.yml up -d
```

#### Database Connection Issues
**Problem**: Can't connect to PostgreSQL
**Solution**:
1. Check if container is running: `docker ps`
2. Verify environment variables
3. Check firewall/port access
4. Review connection string format

#### Authentication Issues
**Problem**: JWT tokens not working
**Solution**:
1. Verify JWT_SECRET is properly set
2. Check token expiration times
3. Validate token format in requests
4. Review CORS configuration

#### File Upload Issues
**Problem**: S3 upload failures
**Solution**:
1. Verify LocalStack is running
2. Check AWS credentials configuration
3. Validate bucket creation
4. Review file size limits

---

## 📞 Support & Escalation

### Expert Contact Matrix
- **System Architecture Issues**: Escalate to spec-architect
- **Frontend Implementation**: Escalate to frontend-expert
- **Backend/API Issues**: Escalate to api-developer
- **Testing Problems**: Escalate to spec-tester
- **Code Quality Issues**: Escalate to spec-reviewer

### Daily Standup Format
1. **Yesterday**: What was completed
2. **Today**: What will be worked on
3. **Blockers**: Any impediments or questions
4. **Quality**: Test status and code review feedback

---

## ✅ Phase 0 Completion Criteria

Before declaring Phase 0 complete, ensure ALL of the following are met:

### Functional Requirements
- [ ] Docker development environment fully operational
- [ ] Database schema implemented with all entities and relationships
- [ ] Authentication system with JWT and role-based access control
- [ ] Core CRUD operations for Users and Cases
- [ ] File upload system with S3 integration
- [ ] Basic frontend components for authentication and navigation

### Quality Requirements
- [ ] Test coverage ≥ 90% for authentication module
- [ ] Test coverage ≥ 85% for core modules
- [ ] All TypeScript code compiles without errors in strict mode
- [ ] ESLint passes with no errors
- [ ] Security audit passed with no critical vulnerabilities

### Performance Requirements
- [ ] API response times < 200ms for simple operations
- [ ] Database queries < 100ms for basic operations
- [ ] Frontend initial load < 3 seconds
- [ ] File uploads complete within 5 seconds for files up to 10MB

### Documentation Requirements
- [ ] Complete API documentation (Swagger)
- [ ] Frontend component documentation (Storybook)
- [ ] Environment setup guide
- [ ] Troubleshooting documentation
- [ ] Code review standards documented

### Review Requirements
- [ ] System architect approval
- [ ] Frontend expert approval
- [ ] API developer approval
- [ ] Testing expert approval
- [ ] Code reviewer approval

Once all criteria are met, Phase 0 is considered complete and ready for Phase 1 development.

---

**Next Phase**: [Phase 1: MVP Core Development](./phase_1_mvp_core.md)