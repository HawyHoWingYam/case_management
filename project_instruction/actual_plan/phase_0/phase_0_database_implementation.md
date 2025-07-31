# Database Implementation Plan for Phase 0

## Overview
This plan provides comprehensive database implementation guidelines for the Case Management System Phase 0, focusing on PostgreSQL setup, Prisma ORM integration, and performance optimization strategies.

## 1. Core Database Schema Design

### Entity Relationship Overview
```
User (1) -----> (M) Case
User (1) -----> (M) Case_Log  
Case (1) -----> (M) Case_Log
Case (1) -----> (M) Case_Document
```

### Primary Entities

#### User Entity
- **Purpose**: Authentication and role-based access control
- **Roles**: Clerk, Chair, Caseworker with distinct permissions
- **Security**: Password hashing with bcrypt, JWT token management

#### Case Entity  
- **Purpose**: Core business entity for case management workflow
- **Status Flow**: `New → Pending Review → Assigned → In Progress → Pending Completion → Completed`
- **Business Rules**: Status transitions with validation, assignment constraints

#### Case_Log Entity
- **Purpose**: Complete audit trail for regulatory compliance
- **Tracking**: All case activities, status changes, user actions
- **Retention**: Permanent storage for legal/audit requirements

## 2. Prisma Schema Implementation

### Complete Schema Definition
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  role      UserRole
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  createdCases  Case[]     @relation("CaseCreator")
  assignedCases Case[]     @relation("CaseAssignee")
  caseLogs      Case_Log[]
  uploadedDocs  Case_Document[]

  @@map("users")
}

model Case {
  id          String     @id @default(uuid())
  title       String
  description String
  status      CaseStatus @default(NEW)
  priority    Priority   @default(MEDIUM)
  createdBy   String
  assignedTo  String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relationships
  creator   User            @relation("CaseCreator", fields: [createdBy], references: [id])
  assignee  User?           @relation("CaseAssignee", fields: [assignedTo], references: [id])
  logs      Case_Log[]
  documents Case_Document[]

  // Indexes for performance
  @@index([status])
  @@index([createdBy])
  @@index([assignedTo])
  @@index([createdAt])
  @@map("cases")
}

model Case_Log {
  id        String   @id @default(uuid())
  caseId    String
  userId    String
  action    String   // "created", "assigned", "status_changed", "commented"
  details   Json?    // Flexible JSON for additional context
  timestamp DateTime @default(now())
  
  // Relationships
  case Case @relation(fields: [caseId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  // Indexes for audit queries
  @@index([caseId])
  @@index([userId])
  @@index([timestamp])
  @@map("case_logs")
}

model Case_Document {
  id         String   @id @default(uuid())
  caseId     String
  filename   String
  s3Key      String   @unique
  mimeType   String
  fileSize   Int
  uploadedBy String
  uploadedAt DateTime @default(now())
  
  // Relationships
  case     Case @relation(fields: [caseId], references: [id], onDelete: Cascade)
  uploader User @relation(fields: [uploadedBy], references: [id])

  @@index([caseId])
  @@map("case_documents")
}

// Enums
enum UserRole {
  CLERK
  CHAIR
  CASEWORKER
}

enum CaseStatus {
  NEW
  PENDING_REVIEW
  ASSIGNED
  IN_PROGRESS
  PENDING_COMPLETION
  COMPLETED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

## 3. Migration Strategy

### Development Migration Workflow
```bash
# 1. Create initial migration
npx prisma migrate dev --name init

# 2. Generate Prisma client
npx prisma generate

# 3. Reset database (development only)
npx prisma migrate reset

# 4. Deploy to production
npx prisma migrate deploy
```

### Migration Best Practices
- **Atomic Migrations**: Each migration should be reversible and atomic
- **Backward Compatibility**: Ensure migrations don't break existing code
- **Data Preservation**: Always backup before destructive changes
- **Naming Convention**: Descriptive names with timestamps

## 4. Docker PostgreSQL Configuration

### docker-compose.yml Database Service
```yaml
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
    networks:
      - case_management_network

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
    depends_on:
      - postgres
    networks:
      - case_management_network

volumes:
  postgres_data:
  pgadmin_data:

networks:
  case_management_network:
    driver: bridge
```

### Performance Configuration
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

## 5. Performance Optimization

### Strategic Indexing
```sql
-- Composite indexes for complex queries
CREATE INDEX idx_cases_status_created ON cases(status, created_at);
CREATE INDEX idx_cases_assignee_status ON cases(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_case_logs_case_timestamp ON case_logs(case_id, timestamp);

-- Partial indexes for specific query patterns  
CREATE INDEX idx_active_cases ON cases(status) WHERE status IN ('ASSIGNED', 'IN_PROGRESS');
CREATE INDEX idx_pending_assignments ON cases(status) WHERE status = 'PENDING_REVIEW';
```

### Query Optimization Guidelines
- **Avoid N+1 Queries**: Use Prisma's `include` and `select` strategically
- **Pagination**: Implement cursor-based pagination for large datasets  
- **Connection Pooling**: Configure appropriate pool sizes
- **Prepared Statements**: Leverage Prisma's automatic query caching

## 6. Initial Seed Data Structure

### Seed Data Script
```typescript
import { PrismaClient, UserRole, CaseStatus, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create users for each role
  const clerk = await prisma.user.create({
    data: {
      email: 'clerk@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.CLERK,
      firstName: 'John',
      lastName: 'Clerk',
    },
  });

  const chair = await prisma.user.create({
    data: {
      email: 'chair@example.com', 
      password: await bcrypt.hash('password123', 10),
      role: UserRole.CHAIR,
      firstName: 'Jane',
      lastName: 'Chair',
    },
  });

  const caseworker = await prisma.user.create({
    data: {
      email: 'caseworker@example.com',
      password: await bcrypt.hash('password123', 10),
      role: UserRole.CASEWORKER,
      firstName: 'Bob', 
      lastName: 'Caseworker',
    },
  });

  // Create sample cases
  const sampleCase = await prisma.case.create({
    data: {
      title: 'Sample Case for Testing',
      description: 'This is a test case for Phase 0 validation',
      status: CaseStatus.NEW,
      priority: Priority.MEDIUM,
      createdBy: clerk.id,
    },
  });

  // Create audit log entry
  await prisma.case_Log.create({
    data: {
      caseId: sampleCase.id,
      userId: clerk.id,
      action: 'created',
      details: { message: 'Case created during Phase 0 setup' },
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
```

## 7. Security & Data Integrity

### Row-Level Security Policies
```sql
-- Enable RLS for multi-tenant security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see cases they created or are assigned to
CREATE POLICY case_access_policy ON cases
  USING (created_by = current_user_id() OR assigned_to = current_user_id());
```

### Data Validation Constraints
```sql
-- Ensure valid email formats
ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure case titles are not empty
ALTER TABLE cases ADD CONSTRAINT case_title_not_empty CHECK (length(trim(title)) > 0);

-- Ensure file sizes are reasonable (100MB limit)
ALTER TABLE case_documents ADD CONSTRAINT reasonable_file_size CHECK (file_size <= 104857600);
```

## 8. Backup & Recovery Strategy

### Automated Backup Configuration
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="case_management_backup_$DATE.sql"

pg_dump -h localhost -U admin -d case_management > "$BACKUP_DIR/$BACKUP_FILE"
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
```

### Recovery Procedures
```bash
# Restore from backup
gunzip case_management_backup_YYYYMMDD_HHMMSS.sql.gz
psql -h localhost -U admin -d case_management < case_management_backup_YYYYMMDD_HHMMSS.sql
```

## Implementation Timeline

### Week 1: Database Foundation
- Docker PostgreSQL setup and configuration
- Prisma schema implementation and initial migration
- Connection testing and basic CRUD operations

### Week 2: Optimization & Security  
- Index creation and query optimization
- Security policies and constraints implementation
- Backup strategy setup and testing

### Week 3: Integration & Testing
- Seed data creation and validation
- Integration testing with backend services
- Performance benchmarking and tuning

This comprehensive plan ensures a robust, scalable, and secure database foundation for the Case Management System.