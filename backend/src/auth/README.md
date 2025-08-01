# Authentication Module

Complete JWT authentication system with Role-Based Access Control (RBAC) for the Case Management System.

## Features

- JWT-based authentication with access and refresh tokens
- Bcrypt password hashing with configurable rounds
- Role-based authorization (CLERK, CHAIR, CASEWORKER)
- Comprehensive input validation
- Rate limiting protection
- Comprehensive error handling
- OpenAPI/Swagger documentation
- Extensive unit and integration tests

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john.clerk@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "email": "john.clerk@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CLERK",
    "isActive": true,
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET /api/auth/profile
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "email": "john.clerk@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CLERK",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "lastLoginAt": "2024-01-01T12:00:00.000Z"
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** Same as login response with new tokens.

#### POST /api/auth/logout
Logout user (client should discard tokens).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

## Usage Examples

### Protecting Routes with Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { CurrentUser, Roles } from '../auth/decorators';
import { UserRole } from '../common/enums';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CasesController {
  
  // Accessible by any authenticated user
  @Get('my-cases')
  async getMyCases(@CurrentUser() user: AuthenticatedUser) {
    return this.casesService.findByUser(user.id);
  }

  // Only accessible by CHAIR and CLERK roles
  @Get('all')
  @Roles(UserRole.CHAIR, UserRole.CLERK)
  async getAllCases() {
    return this.casesService.findAll();
  }

  // Only accessible by CHAIR role
  @Get('reports')
  @Roles(UserRole.CHAIR)
  async getReports() {
    return this.reportsService.generateReports();
  }
}
```

### Making Routes Public

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators';

@Controller('public')
export class PublicController {
  
  @Get('health')
  @Public() // Skip authentication for this route
  getHealth() {
    return { status: 'ok' };
  }
}
```

### Using Current User Information

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('cases')
export class CasesController {
  
  @Post()
  async createCase(
    @Body() createCaseDto: CreateCaseDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    // Automatically set the creator from authenticated user
    return this.casesService.create({
      ...createCaseDto,
      createdBy: user.id
    });
  }

  @Post('assign')
  @Roles(UserRole.CHAIR)
  async assignCase(
    @Body() assignDto: AssignCaseDto,
    @CurrentUser('id') userId: string // Extract specific field
  ) {
    return this.casesService.assign(assignDto, userId);
  }
}
```

## Role-Based Access Control

The system supports three user roles:

- **CLERK**: Basic user, can create and view own cases
- **CHAIR**: Supervisor role, can manage all cases and assign to caseworkers
- **CASEWORKER**: Can work on assigned cases

### Role Hierarchy Example

```typescript
// Example controller with different role access levels
@Controller('admin')
export class AdminController {
  
  // Only CHAIR can access
  @Get('dashboard')
  @Roles(UserRole.CHAIR)
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // CHAIR and CASEWORKER can access
  @Get('workload')
  @Roles(UserRole.CHAIR, UserRole.CASEWORKER)
  getWorkload() {
    return this.adminService.getWorkload();
  }

  // All authenticated users can access (no @Roles decorator)
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
```

## Security Features

### Password Security
- Bcrypt hashing with configurable rounds (default: 12)
- Password validation with minimum length requirements
- Secure password comparison

### Token Security
- Separate secrets for access and refresh tokens
- Configurable token expiration times
- Token validation includes user status check
- Email verification in token payload

### Request Security
- Rate limiting protection
- Input validation with class-validator
- Comprehensive error handling without information leakage
- CORS protection

## Environment Configuration

Required environment variables:

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Password Hashing
BCRYPT_ROUNDS=12

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

## Testing

### Running Tests
```bash
# Unit tests
npm test auth

# E2E tests
npm run test:e2e auth

# Test coverage
npm run test:cov
```

### Test Coverage
- AuthService: 100% statement coverage
- AuthController: 100% statement coverage
- Guards and Decorators: 100% statement coverage
- E2E tests cover all authentication flows

## Error Handling

The authentication system provides comprehensive error handling:

### Common Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": [
    "Please provide a valid email address",
    "Password must be at least 6 characters long"
  ],
  "error": "Bad Request"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Access denied. Required roles: CHAIR. Your role: CLERK",
  "error": "Forbidden"
}
```

## Integration with Prisma

The authentication system is fully integrated with Prisma ORM:

- User model validation
- Password hashing on user creation
- Last login timestamp updates
- User status verification
- Audit trail support

## Future Enhancements

Potential improvements for production:

1. **Token Blacklisting**: Implement token blacklist for enhanced logout security
2. **Password Reset**: Add password reset functionality with email verification
3. **Multi-Factor Authentication**: Add 2FA support
4. **Account Lockout**: Implement account lockout after failed attempts
5. **Session Management**: Add session tracking and management
6. **Audit Logging**: Enhanced audit logging for authentication events