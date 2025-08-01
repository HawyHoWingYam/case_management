# Case Management System - Backend API

NestJS backend API for the Case Management System with n8n workflow integration.

## Features

- **Health Check System**: Basic and detailed health monitoring endpoints
- **n8n Integration**: Webhook endpoints for workflow automation
- **Database Integration**: PostgreSQL with Prisma ORM
- **Security**: Helmet, CORS, rate limiting, input validation
- **Comprehensive Logging**: Winston-based logging with different levels
- **Error Handling**: Global exception filters with structured error responses
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Unit and integration tests with Jest

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- n8n instance (for webhook integration)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database and n8n settings
# DATABASE_URL="postgresql://username:password@localhost:5432/case_management"
# N8N_WEBHOOK_URL="http://localhost:5678/webhook/case-management-test"
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run seed
```

### Development

```bash
# Start development server
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## API Endpoints

### Application
- `GET /api` - Application information

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with database and memory info

### Webhooks
- `POST /api/n8n-test` - Test n8n integration

### API Documentation
- `GET /api/docs` - Swagger/OpenAPI documentation (development only)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production/test) | development |
| `PORT` | Server port | 3001 |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 1d |
| `N8N_WEBHOOK_URL` | n8n webhook endpoint | Required |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |
| `LOG_LEVEL` | Logging level | info |
| `THROTTLE_TTL` | Rate limit window (seconds) | 60 |
| `THROTTLE_LIMIT` | Rate limit max requests | 100 |

## Project Structure

```
src/
├── common/           # Shared utilities, DTOs, filters
├── config/           # Configuration files
├── health/           # Health check module
├── webhooks/         # n8n webhook integration
├── prisma/           # Database service
├── app.module.ts     # Main application module
└── main.ts           # Application bootstrap

prisma/
├── schema.prisma     # Database schema
├── migrations/       # Database migrations
└── seed.ts           # Database seeding

test/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── e2e/              # End-to-end tests
```

## Database Schema

The system includes these main entities:

- **User**: System users with roles (CLERK, CHAIR, CASEWORKER)
- **Case**: Case management with workflow status
- **CaseLog**: Audit trail for all case activities

## Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Debug tests
npm run test:debug
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure `JWT_SECRET`
4. Configure production `N8N_WEBHOOK_URL`
5. Run migrations: `npm run prisma:deploy`
6. Build application: `npm run build`
7. Start production server: `npm run start:prod`

## Security Features

- Helmet for security headers
- CORS configuration
- Rate limiting (100 requests/minute by default)
- Input validation with class-validator
- Password hashing with bcrypt
- JWT authentication (ready for implementation)
- Global exception handling

## Logging

The application uses Winston for structured logging:

- **Console**: Colorized output for development
- **File**: JSON logs for production (error.log, combined.log)
- **Levels**: error, warn, info, debug, verbose

## n8n Integration

The system includes webhook endpoints for n8n workflow automation:

- Test webhook endpoint for integration verification
- Business event webhooks for case lifecycle events
- Non-blocking webhook delivery with error handling
- Health check for webhook service connectivity

## Development

This backend follows NestJS best practices:

- Modular architecture
- Dependency injection
- TypeScript strict mode
- Comprehensive error handling
- Global pipes and filters
- OpenAPI documentation
- Test-driven development

## License

Private - Case Management System