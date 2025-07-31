# Case Management Docker Development Environment

This directory contains the Docker configuration for the Case Management System development environment.

## Overview

The development environment includes the following services:

- **PostgreSQL 15** - Primary database with development and test databases
- **Redis 7** - Caching and session storage
- **LocalStack** - AWS S3 simulation for file storage
- **MailHog** - Email testing server
- **pgAdmin** - Database administration interface

## Quick Start

1. **Start the environment:**
   ```bash
   make dev-start
   # or
   ./scripts/docker-dev.sh start
   ```

2. **Validate the setup:**
   ```bash
   make dev-validate
   # or
   ./scripts/validate-docker-env.sh
   ```

3. **Check service status:**
   ```bash
   make dev-status
   # or
   ./scripts/docker-dev.sh status
   ```

## Service Access

### PostgreSQL Database
- **Host:** localhost:5432
- **Development Database:** case_management_dev
- **Test Database:** case_management_test
- **Username:** postgres
- **Password:** postgres_dev_password

### Redis Cache
- **Host:** localhost:6379
- **No password required**

### LocalStack (AWS S3 Simulation)
- **S3 Endpoint:** http://localhost:4566
- **Access Key:** test
- **Secret Key:** test
- **Region:** us-east-1

### MailHog (Email Testing)
- **SMTP Server:** localhost:1025
- **Web Interface:** http://localhost:8025

### pgAdmin (Database Administration)
- **Web Interface:** http://localhost:5050
- **Email:** admin@casemanagement.dev
- **Password:** admin123

## Directory Structure

```
docker/
├── README.md                    # This file
├── postgres/
│   ├── init/                   # Database initialization scripts
│   │   ├── 01-create-databases.sql
│   │   ├── 02-create-initial-tables.sql
│   │   └── 03-seed-data.sql
│   └── config/
│       └── postgresql.conf     # PostgreSQL configuration
├── redis/
│   └── redis.conf             # Redis configuration
├── localstack/
│   └── init/
│       └── 01-create-s3-buckets.sh  # S3 bucket initialization
└── pgadmin/
    └── servers.json           # pgAdmin server configuration
```

## Common Commands

### Using Makefile (Recommended)
```bash
make help                  # Show all available commands
make dev-start            # Start all services
make dev-stop             # Stop all services
make dev-restart          # Restart all services
make dev-status           # Show service status
make dev-logs             # Show all service logs
make dev-validate         # Validate environment
make dev-clean            # Remove all data and volumes
make dev-reset            # Reset database
make dev-backup           # Create database backup
```

### Using Scripts Directly
```bash
./scripts/docker-dev.sh start           # Start services
./scripts/docker-dev.sh stop            # Stop services
./scripts/docker-dev.sh logs postgres   # Show PostgreSQL logs
./scripts/docker-dev.sh status          # Show status
./scripts/validate-docker-env.sh        # Validate setup
```

### Database Management
```bash
make db-connect           # Connect to development database
make db-test-connect      # Connect to test database
make redis-cli            # Connect to Redis CLI
```

## Environment Variables

The development environment uses variables from `.env.dev`:

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

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Data Persistence

All service data is persisted in Docker volumes:
- `case_management_postgres_data` - PostgreSQL data
- `case_management_redis_data` - Redis data
- `case_management_localstack_data` - LocalStack data
- `case_management_mailhog_data` - MailHog emails
- `case_management_pgadmin_data` - pgAdmin settings

## Database Schema

The PostgreSQL initialization scripts create:

1. **Development and test databases** with extensions:
   - uuid-ossp (UUID generation)
   - pgcrypto (cryptographic functions)
   - citext (case-insensitive text)

2. **Core tables:**
   - users (system users and caseworkers)
   - cases (case management records)
   - case_notes (case documentation)
   - audit_logs (system audit trail)
   - user_sessions (authentication sessions)

3. **Schemas:**
   - public (main application tables)
   - audit (audit logging)
   - security (authentication and sessions)

## S3 Buckets (LocalStack)

The following S3 buckets are automatically created:
- `case-management-dev` - Main application bucket
- `case-management-documents` - Case documents and files
- `case-management-uploads` - Temporary file uploads
- `case-management-exports` - Report exports
- `case-management-backups` - System backups

## Troubleshooting

### Services Not Starting
1. Check Docker is running: `docker info`
2. Check for port conflicts: `netstat -an | grep :5432`
3. View service logs: `make dev-logs`

### Database Connection Issues
1. Wait for services to be ready: `make dev-validate`
2. Check PostgreSQL logs: `make dev-logs-postgres`
3. Test connection: `make db-connect`

### LocalStack Issues
1. Check if LocalStack is ready: `curl http://localhost:4566/_localstack/health`
2. View LocalStack logs: `make dev-logs-localstack`
3. Verify S3 buckets: `awslocal s3 ls` (if awslocal is installed)

### Reset Environment
```bash
make dev-clean          # Remove all data and start fresh
make dev-full-reset     # Complete reset with validation
```

## Development Workflow

1. **Initial Setup:**
   ```bash
   make setup              # Make scripts executable
   make dev-start          # Start all services
   make dev-validate       # Verify everything works
   ```

2. **Daily Development:**
   ```bash
   make dev-start          # Start services
   make dev-status         # Check status
   # ... develop your application ...
   make dev-stop           # Stop when done
   ```

3. **Database Changes:**
   ```bash
   make dev-backup         # Backup before changes
   # ... make schema changes ...
   make dev-reset          # Reset if needed
   ```

## Integration with Applications

### Backend (NestJS)
Configure your NestJS application to use these environment variables:
```typescript
database: {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
}
```

### Frontend (Next.js)
Configure your Next.js application for API calls:
```javascript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

## Security Notes

⚠️ **Development Only**: This configuration is for development use only. Never use these settings in production:

- Database has weak passwords
- SSL is disabled
- Permissive CORS settings
- Debug logging enabled
- No authentication on Redis
- LocalStack uses test credentials

## Support

For issues with the Docker environment:

1. Check the troubleshooting section above
2. Run the validation script: `make dev-validate`
3. Check service logs: `make dev-logs`
4. Review the Docker Compose file: `docker-compose.dev.yml`

## Contributing

When adding new services to the development environment:

1. Update `docker-compose.dev.yml`
2. Add configuration files to appropriate directories
3. Update initialization scripts if needed
4. Add new service checks to `validate-docker-env.sh`
5. Update this README with new service information