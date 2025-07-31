# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Case Management System built with Next.js (frontend) and NestJS (backend), designed for legal/administrative case processing with role-based workflows (Clerk, Chair, Caseworker). The repository has been cleaned and is ready for fresh implementation using a **multi-agent development approach** with 8 specialized agents.

## Multi-Agent Development Team

This project uses specialized AI agents for different aspects of development:

- **spec-architect**: System architecture, technical decisions, API contracts
- **database-specialist**: Database design, performance optimization, data integrity  
- **api-developer**: Backend API implementation, business logic, NestJS services
- **frontend-expert**: UI/UX implementation, Next.js components, responsive design
- **product-manager**: Product vision, user stories, feature prioritization
- **qa-engineer**: Quality assurance, testing strategy, E2E automation
- **devops-engineer**: Infrastructure, CI/CD, deployment automation
- **ui-ux-designer**: User interface design, design systems, accessibility

## Core Team Principles (行為與文化基石)

All development must strictly follow these three fundamental principles:

### 1. Peer Review Model (同儕審查模式)
**Definition**: Collective ownership and continuous learning culture where all code requires peer approval.

**Implementation**:
- GitHub PR templates in `.github/pull_request_template.md`
- Branch protection rules for `main` and `develop` branches
- n8n workflow monitors `review_requested` events for automatic reviewer notifications
- Review criteria: logic correctness, readability, performance, test coverage, architectural consistency

**Goal**: Early bug detection, unified coding standards, knowledge sharing, collective code quality responsibility.

### 2. Data-Driven Decisions (數據驅動決策)
**Definition**: Technical disagreements resolved through objective, quantifiable data rather than personal preferences.

**Process Example**: 
- When frontend/backend teams disagree on API design (nested vs flat structures)
- 48-hour time-boxed spike: both approaches implemented and tested
- Metrics collected: response times (p95, p99), RPS, data transfer, FCP, TTI, main thread blocking
- Decision based on overall user experience data
- Final decision documented in `docs/architecture/` as ADR

**Goal**: Objective technical decisions, avoid endless debates, maintain traceable decision history.

### 3. Definition of Done (完整流程的「完成」定義)
**Definition**: A task is only complete when it meets production-ready quality standards.

**Mandatory Checklist**:
- ✅ Code passes peer review with all comments resolved
- ✅ Test coverage ≥90% with all CI tests passing  
- ✅ No new high/medium priority bugs introduced
- ✅ Successfully deployed to staging environment
- ✅ E2E automated tests pass
- ✅ Documentation updated (OpenAPI, README, ADRs)
- ✅ WCAG accessibility compliance verified
- ✅ Feature flags configured (if applicable)

**Goal**: Enable true continuous deployment, eliminate "works on my machine" issues.

## Architecture & Tech Stack

### Core Technology Stack
- **Frontend**: Next.js with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: NestJS with TypeScript, Prisma ORM
- **Database**: PostgreSQL with optimized indexing
- **File Storage**: AWS S3 with presigned URLs
- **Authentication**: JWT-based with proper token management
- **Email**: SendGrid integration with templates
- **Automation**: n8n workflow automation system
- **Testing**: Jest, Cypress/Playwright for E2E
- **CI/CD**: GitHub Actions with automated quality gates

### Core Entities & Workflow
- **User**: Clerk, Chair, Caseworker roles with RBAC
- **Case**: Status workflow: `New → Pending Review → Assigned → In Progress → Pending Completion → Completed`
- **Case_Log**: Complete audit trail for all case activities

## Directory Structure (統一專案目錄結構)

```
CASE_MANAGEMENT/
├── .claude/                    # AI Agent local configurations
│   └── agents/                 # Agent-specific settings
├── .github/
│   ├── workflows/              # GitHub Actions CI/CD automation
│   └── pull_request_template.md # Enforced PR template
├── backend/                    # 【Application Core】NestJS backend
├── frontend/                   # 【Application Core】Next.js frontend  
├── n8n/                        # 【Automation Core】n8n workflow definitions
│   └── workflows/              # Version-controlled JSON workflow exports
├── docs/                       # 【Knowledge Repository】Project documentation
│   ├── architecture/           # Architecture Decision Records (ADRs)
│   ├── api/                    # OpenAPI/Swagger specifications
│   └── product/                # Product requirements, user research
├── logs/                       # 【Runtime Records】Generated logs (not committed)
│   └── n8n/                    # n8n deployment logs
├── scripts/                    # 【Efficiency Tools】Executable helper scripts
│   ├── db/                     # Database-related scripts
│   └── n8n/                    # n8n deployment automation
├── tests/
│   └── e2e/                    # End-to-end test automation
├── screenshot/                 # 【Visual Documentation】Screenshots for PRs, bugs
└── project_instruction/        # 【Project Command Center】
    ├── draft_plan/             # Initial phase planning documents
    ├── actual_plan/            # Confirmed implementation plans
    └── project_progress/       # Daily/weekly progress journals
```

### Directory Deep Analysis

- **`project_instruction/`**: **Project Command Center** - Centralizes all high-level guidance from draft plans to confirmed plans to daily progress, ensuring consistency between instructions, plans, and progress.

- **`n8n/`**: **Automation Core** - Workflows exported as JSON for version control, enabling workflow-as-code management.

- **`docs/`**: **Collective Intelligence** - Beyond architecture and API docs, includes `product/` for product manager and UI/UX designer outputs.

- **`screenshot/`**: **Visual Communication Aid** - Centralized screenshot storage for GitHub issues, PRs, and documentation references.

## n8n Automation System (自動化神經中樞)

The n8n system handles business process automation and DevOps workflows:

### Available Commands
```bash
# Deploy workflow with templates
./scripts/n8n/claude-n8n-auto-deploy.sh [options] <workflow-name> [description]

# Options:
-t, --template <type>    # Templates: api-slack, webhook-db, basic
-v, --validate          # Validate only, don't deploy  
-a, --activate          # Deploy and auto-activate
-d, --debug             # Debug mode with detailed output

# Examples:
./scripts/n8n/claude-n8n-auto-deploy.sh -t api-slack -a "Case Assignment Notification"
```

### Core Business Process Workflows

1. **New Case Notification**
   - **Trigger**: Webhook from backend after case creation
   - **Action**: Notify all Chair users via email/Slack with case details

2. **Case Assignment Notification** 
   - **Trigger**: Webhook after successful case assignment
   - **Action**: Query PostgreSQL for Caseworker email, send notification with case link

3. **Case Status Change Notification**
   - **Trigger**: Webhook on status changes (accepted, rejected, completion request, final approval)
   - **Action**: Switch node routes notifications based on status to relevant parties

### DevOps Automation Workflows

4. **PR Review Reminder**
   - **Trigger**: GitHub `review_requested` event
   - **Action**: Send Slack/email reminder to assigned reviewer with PR link

5. **CI/CD Deployment Status Notification**
   - **Trigger**: Webhook from GitHub Actions at deployment completion
   - **Action**: Formatted status message to team #deployments channel with success/failure indicators

6. **Production Error Alerting**
   - **Trigger**: Webhook from Sentry monitoring service
   - **Action**: Auto-create GitHub issue with `bug` and `high-priority` labels, notify emergency channel

### Data & Reporting Workflows

7. **Weekly Operations Summary Report**
   - **Trigger**: Schedule node (Monday 9AM)
   - **Action**: Call `/api/stats/overview`, format KPI data, email to all Chair users

8. **Case Backlog Alert**
   - **Trigger**: Daily schedule
   - **Action**: PostgreSQL query for overdue cases, alert Chair if backlog exists

## Development Commands

### n8n Prerequisites
```bash
# Ensure n8n is running
n8n start
curl http://localhost:5678/healthz

# Make scripts executable
chmod +x scripts/n8n/claude-n8n-auto-deploy.sh
chmod +x scripts/n8n/quick-deploy.sh
```

### Backend (NestJS) - when created
```bash
cd backend/
npm run start:dev          # Development server
npm run build             # Production build
npm run test              # Unit tests
npm run test:e2e          # Integration tests  
npm run lint              # ESLint checking
npm run format            # Prettier formatting
```

### Frontend (Next.js) - when created
```bash
cd frontend/
npm run dev               # Development server
npm run build             # Production build
npm run start             # Production server
npm run test              # Component tests
npm run lint              # ESLint checking
npm run type-check        # TypeScript checking
```

### Database Operations - when configured
```bash
npx prisma init --datasource-provider postgresql    # Initialize Prisma
npx prisma migrate dev --name init                  # Create migration
npx prisma migrate deploy                          # Deploy migrations
npx prisma studio                                  # Database GUI
npm run seed                                       # Populate test data
```

## Implementation Standards

### Backend (NestJS)
- Modular architecture: modules, controllers, services, DTOs
- Comprehensive error handling with proper HTTP status codes
- JWT authentication with guards and role-based authorization
- OpenAPI/Swagger documentation auto-generation
- TypeScript strict mode enforcement

### Frontend (Next.js)  
- App Router with file-based routing
- Responsive design with Tailwind CSS and shadcn/ui
- TypeScript interfaces for all props and state
- Context API or Zustand for state management
- WCAG accessibility compliance

### Database Design
- Optimized PostgreSQL queries with proper indexing
- Prisma ORM with migration version control
- Database constraints and relationships properly defined
- Materialized views for reporting data optimization

### Testing Requirements
- 90%+ test coverage mandatory
- Unit tests for all services and components
- Integration tests for API endpoints
- E2E tests for critical user workflows
- Automated testing in CI pipeline

## Quality & Performance Standards

### Security Implementation
- Environment variables for all sensitive data
- Input validation and sanitization
- Rate limiting on public APIs  
- Regular automated security audits
- Secure file upload to S3 with presigned URLs

### Performance Targets
- API response times <200ms for core operations
- Frontend Lighthouse scores >95 for performance and accessibility
- Database query optimization with monitoring
- Strategic caching implementation

## Project Phases & Agent Responsibilities

### Phase 0: Foundation Setup
- **spec-architect**: System architecture, API contracts, risk assessment
- **database-specialist**: Schema implementation, relationships, seed data
- **devops-engineer**: Environment setup, CI/CD pipelines

### Phase 1-3: Core Development  
- **api-developer**: Case CRUD, workflow endpoints, business logic
- **frontend-expert**: Dashboard, case forms, role-based UI
- **qa-engineer**: API testing, E2E automation, quality gates

### Phase 4: Reporting & Analytics
- **database-specialist**: Materialized views for reporting
- **api-developer**: Report endpoints
- **frontend-expert**: Charts and BI integration

### Phase 5: Production Readiness
- **devops-engineer**: Containerization, deployment strategy, monitoring
- **qa-engineer**: UAT coordination, regression testing, go-live approval

This multi-agent approach ensures specialized expertise while maintaining unified quality standards through the core team principles.