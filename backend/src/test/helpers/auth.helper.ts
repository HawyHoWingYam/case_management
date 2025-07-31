/**
 * Authentication testing helper utilities
 */

import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TEST_CONFIG } from '../setup';

export class AuthTestHelper {
  private jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService({
      secret: TEST_CONFIG.jwt.secret,
      signOptions: { expiresIn: TEST_CONFIG.jwt.expiresIn },
    });
  }

  /**
   * Generate JWT token for testing
   */
  generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  /**
   * Create test user token
   */
  createUserToken(userId: string, email: string, role: string = 'caseworker'): string {
    return this.generateToken({
      sub: userId,
      email,
      role,
    });
  }

  /**
   * Create admin token
   */
  createAdminToken(userId: string = 'admin-id', email: string = 'admin@example.com'): string {
    return this.createUserToken(userId, email, 'admin');
  }

  /**
   * Create caseworker token
   */
  createCaseworkerToken(userId: string = 'caseworker-id', email: string = 'caseworker@example.com'): string {
    return this.createUserToken(userId, email, 'caseworker');
  }

  /**
   * Create supervisor token
   */
  createSupervisorToken(userId: string = 'supervisor-id', email: string = 'supervisor@example.com'): string {
    return this.createUserToken(userId, email, 'supervisor');
  }

  /**
   * Get authorization header with Bearer token
   */
  getAuthHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Login user and get token (for integration tests)
   */
  async loginUser(app: INestApplication, email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken;
  }

  /**
   * Register test user (for integration tests)
   */
  async registerTestUser(
    app: INestApplication,
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role?: string;
    }
  ): Promise<any> {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);
  }

  /**
   * Create authenticated request for testing
   */
  createAuthenticatedRequest(app: INestApplication, token: string) {
    return {
      get: (url: string) => request(app.getHttpServer()).get(url).set(this.getAuthHeader(token)),
      post: (url: string) => request(app.getHttpServer()).post(url).set(this.getAuthHeader(token)),
      put: (url: string) => request(app.getHttpServer()).put(url).set(this.getAuthHeader(token)),
      patch: (url: string) => request(app.getHttpServer()).patch(url).set(this.getAuthHeader(token)),
      delete: (url: string) => request(app.getHttpServer()).delete(url).set(this.getAuthHeader(token)),
    };
  }

  /**
   * Decode JWT token (for testing purposes)
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }

  /**
   * Create mock JWT payload
   */
  createMockJwtPayload(overrides = {}) {
    return {
      sub: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'caseworker',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...overrides,
    };
  }
}