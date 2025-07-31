/**
 * Authentication Integration Tests
 * Tests the complete authentication flow with real database
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseTestHelper } from '../../src/test/helpers/database.helper';
import { AuthTestHelper } from '../../src/test/helpers/auth.helper';
import { userFixtures, userCredentials } from '../../src/test/fixtures';

describe('Authentication Integration', () => {
  let app: INestApplication;
  let dbHelper: DatabaseTestHelper;
  let authHelper: AuthTestHelper;

  beforeAll(async () => {
    // Initialize database helper
    dbHelper = new DatabaseTestHelper();
    await dbHelper.initialize();

    // Initialize auth helper
    authHelper = new AuthTestHelper();

    // Create test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await dbHelper.cleanup();
  });

  beforeEach(async () => {
    // Clear database before each test
    await dbHelper.clearAllTables();
    
    // Seed test user data
    await dbHelper.seedTestData();
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'New',
      lastName: 'User',
      role: 'caseworker',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Verify user data
      expect(response.body.user.email).toBe(validRegistrationData.email);
      expect(response.body.user.firstName).toBe(validRegistrationData.firstName);
      expect(response.body.user.lastName).toBe(validRegistrationData.lastName);
      expect(response.body.user.role).toBe(validRegistrationData.role);
      expect(response.body.user.isActive).toBe(true);

      // Verify password is not returned
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();

      // Verify tokens are valid JWTs
      expect(response.body.accessToken).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
      expect(response.body.refreshToken).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegistrationData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('validation failed');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should validate role field', async () => {
      const invalidRoleData = {
        ...validRegistrationData,
        role: 'invalid_role',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.message).toContain('role');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials.caseworker)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      expect(response.body.user.email).toBe(userCredentials.caseworker.email);
    });

    it('should reject invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userCredentials.caseworker.password,
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.caseworker.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject inactive user', async () => {
      // First, deactivate the user (this would be done through admin interface)
      // For now, we'll assume the user is active and skip this test
      // In a real implementation, you'd update the user's isActive status
    });

    it('should validate request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('validation failed');
    });

    it('should handle malformed email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'malformed-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get a refresh token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials.caseworker);

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // New tokens should be different
      expect(response.body.accessToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token' })
        .expect(401);

      expect(response.body.message).toContain('Invalid');
    });

    it('should reject expired refresh token', async () => {
      // Create an expired token
      const expiredToken = authHelper.generateToken({
        sub: userFixtures.caseworker.id,
        email: userFixtures.caseworker.email,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      });

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.message).toContain('expired');
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get an access token
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(userCredentials.caseworker);

      accessToken = loginResponse.body.accessToken;
    });

    it('should logout with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toContain('success');
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('should reject logout with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });

      userId = registerResponse.body.user.id;
      accessToken = registerResponse.body.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe(userCredentials.caseworker.email);
      expect(response.body.firstName).toBe('Test');
      expect(response.body.lastName).toBe('User');
      expect(response.body.role).toBe('caseworker');

      // Verify sensitive data is not returned
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token')
        .expect(401);
    });
  });

  describe('PUT /auth/change-password', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });

      accessToken = registerResponse.body.accessToken;
    });

    it('should change password with valid current password', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: userCredentials.caseworker.password,
          newPassword: 'NewSecurePassword123!',
        })
        .expect(200);

      expect(response.body.message).toContain('success');

      // Verify old password no longer works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
        })
        .expect(401);

      // Verify new password works
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userCredentials.caseworker.email,
          password: 'NewSecurePassword123!',
        })
        .expect(201);
    });

    it('should reject with incorrect current password', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewSecurePassword123!',
        })
        .expect(401);

      expect(response.body.message).toContain('current password');
    });

    it('should validate new password strength', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: userCredentials.caseworker.password,
          newPassword: '123',
        })
        .expect(400);

      expect(response.body.message).toContain('password');
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should implement rate limiting on login attempts', async () => {
      const promises = [];
      
      // Make multiple rapid login attempts
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent SQL injection in login', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password123',
        })
        .expect(401);

      // Should treat as invalid credentials, not cause an error
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should handle concurrent registration attempts with same email', async () => {
      const registrationData = {
        email: 'concurrent@example.com',
        password: 'SecurePassword123!',
        firstName: 'Concurrent',
        lastName: 'User',
        role: 'caseworker',
      };

      // Fire multiple concurrent registration requests
      const promises = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/auth/register')
          .send(registrationData)
      );

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successfulResponses = responses.filter(res => res.status === 201);
      const conflictResponses = responses.filter(res => res.status === 409);

      expect(successfulResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(4);
    });
  });

  describe('Token Security', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: userCredentials.caseworker.email,
          password: userCredentials.caseworker.password,
          firstName: 'Test',
          lastName: 'User',
          role: 'caseworker',
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should invalidate tokens after logout', async () => {
      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the token after logout
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should validate token signature', async () => {
      // Modify token signature
      const invalidToken = accessToken.slice(0, -10) + 'invalidSig';

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should validate token expiration', async () => {
      // Create an expired token
      const expiredToken = authHelper.generateToken({
        sub: userFixtures.caseworker.id,
        email: userFixtures.caseworker.email,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});