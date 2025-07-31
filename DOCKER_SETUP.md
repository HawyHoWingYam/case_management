# Case Management System - Docker Development Environment Setup

This guide will help you set up the complete Docker development environment for the Case Management System.

## Overview

The development environment includes:
- **PostgreSQL 15** - Primary database with dev/test databases
- **Redis 7** - Cache and session storage
- **LocalStack** - AWS S3 simulation for file storage
- **MailHog** - Email testing server
- **pgAdmin** - Database administration interface

## Prerequisites

Before starting, make sure you have:

1. **Docker Desktop** installed and running
2. **Git** for version control
3. **Node.js 16+** for local development (optional)
4. **Make** for simplified commands (optional)

### Quick Prerequisites Check

Run this command to check if everything is ready:

```bash
./scripts/check-prerequisites.sh
```

## Setup Instructions

### Step 1: Check Prerequisites

```bash
# Check if all tools are installed and Docker is running
./scripts/check-prerequisites.sh
```

If Docker is not running, start Docker Desktop first.

### Step 2: Initial Setup

```bash
# Make all scripts executable and prepare environment
make setup
```

Or manually:

```bash
chmod +x scripts/*.sh
chmod +x docker/localstack/init/*.sh
```

### Step 3: Start Development Environment

```bash
# Start all services
make dev-start
```

Or use the script directly:

```bash
./scripts/docker-dev.sh start
```

This will:
- Start PostgreSQL with development and test databases
- Start Redis cache server
- Start LocalStack for S3 simulation
- Start MailHog for email testing
- Start pgAdmin for database management
- Initialize databases with schema and seed data
- Create S3 buckets for file storage

### Step 4: Validate Setup

```bash
# Validate that all services are working correctly
make dev-validate
```

Or:

```bash
./scripts/validate-docker-env.sh
```

This comprehensive validation will check:
- Docker and Docker Compose availability
- All container status
- Database connectivity and schema
- Redis functionality
- LocalStack S3 service
- MailHog email service
- Port availability
- Integration tests

## Service Access Information

Once everything is running, you can access:

### PostgreSQL Database
- **Host:** `localhost:5432`
- **Development DB:** `case_management_dev`
- **Test DB:** `case_management_test`
- **Username:** `postgres`
- **Password:** `postgres_dev_password`

**Connection URL:**
```
postgresql://postgres:postgres_dev_password@localhost:5432/case_management_dev
```

### Redis Cache
- **Host:** `localhost:6379`
- **No authentication required**

**Connection URL:**
```
redis://localhost:6379
```

### LocalStack (AWS S3)
- **S3 Endpoint:** `http://localhost:4566`
- **Access Key:** `test`
- **Secret Key:** `test`
- **Region:** `us-east-1`

**Available Buckets:**
- `case-management-dev` - Main application bucket
- `case-management-documents` - Case documents
- `case-management-uploads` - File uploads
- `case-management-exports` - Report exports
- `case-management-backups` - System backups

### MailHog (Email Testing)
- **SMTP Server:** `localhost:1025`
- **Web Interface:** http://localhost:8025

### pgAdmin (Database Admin)
- **Web Interface:** http://localhost:5050
- **Email:** `admin@casemanagement.dev`
- **Password:** `admin123`

## Common Commands

### Using Makefile (Recommended)

```bash
make help                    # Show all available commands
make dev-start              # Start all services
make dev-stop               # Stop all services
make dev-restart            # Restart all services
make dev-status             # Show service status
make dev-logs               # Show all service logs
make dev-validate           # Validate environment
make dev-clean              # Remove all data and volumes
make urls                   # Show service URLs and credentials
make health                 # Quick health check
```

### Using Scripts Directly

```bash
./scripts/docker-dev.sh start           # Start services
./scripts/docker-dev.sh stop            # Stop services
./scripts/docker-dev.sh status          # Show status
./scripts/docker-dev.sh logs            # Show all logs
./scripts/docker-dev.sh logs postgres   # Show PostgreSQL logs
./scripts/docker-dev.sh cleanup         # Remove all data
./scripts/docker-dev.sh backup          # Create DB backup
./scripts/docker-dev.sh reset-db        # Reset database
```

### Database Commands

```bash
make db-connect             # Connect to development database
make db-test-connect        # Connect to test database
make redis-cli              # Connect to Redis CLI
```

## Development Workflow

### Daily Development

1. **Start your development session:**
   ```bash
   make dev-start
   make dev-status      # Verify everything is running
   ```

2. **Develop your application:**
   - Backend connects to `localhost:5432` (PostgreSQL)
   - Cache connects to `localhost:6379` (Redis)
   - File storage uses `http://localhost:4566` (LocalStack S3)
   - Email testing via `localhost:1025` (MailHog SMTP)

3. **Stop when finished:**
   ```bash
   make dev-stop
   ```

### Database Management

```bash
# Create a backup before making changes
make dev-backup

# Reset database to initial state
make dev-reset

# Connect to database for manual queries
make db-connect

# View database through pgAdmin
open http://localhost:5050
```

### Debugging and Logs

```bash
# View all service logs
make dev-logs

# View specific service logs
make dev-logs-postgres
make dev-logs-redis
make dev-logs-localstack

# Check service health
make health
```

## Environment Configuration

The environment is configured through `.env.dev`:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres_dev_password@localhost:5432/case_management_dev
TEST_DATABASE_URL=postgresql://postgres:postgres_dev_password@localhost:5432/case_management_test

# Redis
REDIS_URL=redis://localhost:6379

# AWS/LocalStack
S3_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=case-management-dev

# Email
SMTP_HOST=localhost
SMTP_PORT=1025

# Application
NODE_ENV=development
JWT_SECRET=dev_jwt_secret_key_change_in_production
```

## Database Schema

The database is automatically initialized with:

### Core Tables
- `users` - System users and caseworkers
- `cases` - Case management records
- `case_notes` - Case documentation
- `audit.audit_logs` - System audit trail
- `security.user_sessions` - Authentication sessions

### Sample Data
- Default admin user: `admin@casemanagement.dev`
- Sample caseworkers and supervisors
- Example cases with different statuses
- Sample case notes and audit logs

## Troubleshooting

### Common Issues

**Docker not running:**
```bash
# Start Docker Desktop
open -a Docker  # macOS
# Or start Docker service on Linux
sudo systemctl start docker
```

**Services not starting:**
```bash
# Check logs for errors
make dev-logs

# Try restarting
make dev-restart

# If problems persist, clean and restart
make dev-clean
make dev-start
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -an | grep :5432
lsof -i :5432

# Stop conflicting services or change ports
```

**Database connection issues:**
```bash
# Wait for services to be ready
make dev-validate

# Check PostgreSQL specifically
make dev-logs-postgres

# Test connection
make db-connect
```

**LocalStack S3 issues:**
```bash
# Check LocalStack logs
make dev-logs-localstack

# Test S3 endpoint
curl http://localhost:4566/_localstack/health

# Install AWS CLI for testing
pip install awscli awscli-local
awslocal s3 ls
```

### Reset Everything

If you encounter persistent issues:

```bash
# Complete reset - removes all data
make dev-clean
make dev-start
make dev-validate
```

### Getting Help

1. **Check prerequisites:** `./scripts/check-prerequisites.sh`
2. **Validate environment:** `make dev-validate`
3. **Check service logs:** `make dev-logs`
4. **Review documentation:** `docker/README.md`

## Integration with Applications

### Backend Configuration (NestJS)

```typescript
// database.config.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  database: process.env.DATABASE_NAME || 'case_management_dev',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres_dev_password',
};

// redis.config.ts
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
};
```

### Frontend Configuration (Next.js)

```javascript
// next.config.js
module.exports = {
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    S3_ENDPOINT: process.env.S3_ENDPOINT || 'http://localhost:4566',
  },
};
```

## Advanced Usage

### Custom Configuration

You can modify the Docker Compose configuration in `docker-compose.dev.yml`:

- Change port mappings
- Add additional services
- Modify resource limits
- Update environment variables

### Additional Services

To add new services to the development environment:

1. Update `docker-compose.dev.yml`
2. Add configuration files to `docker/` directory
3. Update validation script
4. Update this documentation

### Production Considerations

⚠️ **This configuration is for development only!**

Production environments should:
- Use strong passwords
- Enable SSL/TLS
- Configure proper security groups
- Use managed database services
- Implement proper backup strategies
- Enable monitoring and logging

## Quick Reference

### Essential Commands
```bash
make setup                  # Initial setup
make dev-start             # Start environment
make dev-validate          # Validate setup
make dev-status            # Check status
make dev-stop              # Stop environment
```

### Service URLs
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- LocalStack: `http://localhost:4566`
- MailHog: `http://localhost:8025`
- pgAdmin: `http://localhost:5050`

### Default Credentials
- PostgreSQL: `postgres / postgres_dev_password`
- pgAdmin: `admin@casemanagement.dev / admin123`
- LocalStack: `test / test`

---

**Need help?** Run `make help` for available commands or `./scripts/check-prerequisites.sh` to verify your setup.