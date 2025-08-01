# Database Configuration - Case Management System

## Overview

This directory contains the complete database configuration for the Case Management System, including Prisma schema, migrations, seed data, and database constraints.

## Schema Design

### Core Entities

#### User
- **Purpose**: Authentication and role-based access control
- **Roles**: `CLERK`, `CHAIR`, `CASEWORKER`
- **Key Fields**: email (unique), firstName, lastName, role, password (bcrypt hashed)

#### Case  
- **Purpose**: Core business entity for case workflow management
- **Status Flow**: `NEW → PENDING_REVIEW → ASSIGNED → IN_PROGRESS → PENDING_COMPLETION → COMPLETED`
- **Key Fields**: title, description, status, priority, createdBy, assignedTo

#### Case_Log
- **Purpose**: Complete audit trail for regulatory compliance
- **Key Fields**: caseId, userId, action, details (JSON), timestamp
- **Actions**: created, assigned, status_changed, commented, document_uploaded

#### Case_Document
- **Purpose**: File attachment management with S3 integration
- **Key Fields**: filename, s3Key (unique), mimeType, fileSize, uploadedBy

### Database Relationships

```
User (1) -----> (M) Case (createdBy)
User (1) -----> (M) Case (assignedTo)
User (1) -----> (M) Case_Log
User (1) -----> (M) Case_Document

Case (1) -----> (M) Case_Log
Case (1) -----> (M) Case_Document
```

## Setup Instructions

### Prerequisites
- PostgreSQL 15+ installed and running
- Node.js and npm
- `.env` file configured with `DATABASE_URL`

### Quick Setup
```bash
# Run the automated setup script
./scripts/setup-database.sh
```

### Manual Setup
```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Create and apply migrations
npx prisma migrate dev --name init

# 3. Apply database constraints
psql -d your_database -f prisma/constraints.sql

# 4. Seed with demo data
npm run seed

# 5. Refresh materialized views
psql -d your_database -c "SELECT refresh_case_statistics();"
```

## Performance Optimization

### Indexes
- **Primary indexes**: All foreign keys and frequently queried fields
- **Composite indexes**: Common query patterns (status + createdAt, assignedTo + status)
- **Partial indexes**: Active cases, pending assignments, user activity

### Materialized Views
- **case_statistics**: Aggregated case metrics by user role and status
- **Refresh**: Use `SELECT refresh_case_statistics();` to update

### Query Optimization
- Use Prisma's `include` and `select` to avoid N+1 queries
- Implement cursor-based pagination for large datasets
- Leverage prepared statements through Prisma's query caching

## Business Rules & Constraints

### Data Validation
- Email format validation using regex
- Non-empty names and case titles
- File size limits (100MB maximum)
- S3 key format validation

### Business Logic
- Cases can only be assigned when status allows it
- Audit trail is mandatory for all case changes
- Document uploads are tracked in audit logs

### Workflow Validation
The case status workflow is enforced at the application level:
```
NEW → PENDING_REVIEW → ASSIGNED → IN_PROGRESS → PENDING_COMPLETION → COMPLETED
```

## Seed Data

The seed script creates:
- **4 Users**: 1 Clerk, 1 Chair, 2 Caseworkers
- **6 Cases**: Representing all workflow stages
- **3 Documents**: Sample file attachments
- **15+ Audit Logs**: Complete activity history

### Demo Credentials
- `clerk@example.com` (password: `password123`)
- `chair@example.com` (password: `password123`)
- `caseworker1@example.com` (password: `password123`)
- `caseworker2@example.com` (password: `password123`)

## Development Commands

```bash
# Schema management
npx prisma migrate dev          # Create new migration
npx prisma migrate reset        # Reset database (dev only)
npx prisma migrate deploy       # Deploy to production
npx prisma generate             # Generate client

# Database tools
npx prisma studio               # Visual database browser
npm run seed                    # Populate with demo data

# Maintenance
psql -d database_name -f prisma/constraints.sql    # Apply constraints
psql -d database_name -c "SELECT refresh_case_statistics();"  # Refresh views
```

## Production Considerations

### Security
- Environment variables for all sensitive data
- Row-level security policies (template provided in constraints.sql)
- Regular security audits and updates

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Backup retention (7 days minimum)

### Monitoring
- Query performance monitoring
- Connection pool optimization
- Index usage analysis
- Materialized view refresh scheduling

## Files

- `schema.prisma` - Complete database schema definition
- `seed.ts` - Comprehensive demo data generation
- `constraints.sql` - Database validation rules and indexes
- `migrations/` - Versioned schema changes (generated)
- `README.md` - This documentation

## Architecture Compliance

This database configuration implements the Phase 0 Database Implementation Plan requirements:
- ✅ Complete entity relationships with proper indexing
- ✅ Comprehensive audit trail for regulatory compliance  
- ✅ Performance-optimized queries with strategic indexing
- ✅ Business rule validation at database level
- ✅ Seed data covering all workflow states
- ✅ Materialized views for reporting efficiency
- ✅ Security constraints and data validation