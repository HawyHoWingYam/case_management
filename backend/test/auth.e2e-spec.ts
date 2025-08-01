import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';

import { AuthModule } from '../src/auth/auth.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/common/enums';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CLERK,
    isActive: true,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply global pipes and filters
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    // Clean up database
    await prismaService.user.deleteMany();
    
    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    await prismaService.user.create({
      data: {
        ...testUser,
        password: hashedPassword,
      },
    });
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('tokenType', 'Bearer');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.body.user).toMatchObject({
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
            isActive: testUser.isActive,
          });
        });
    });

    it('should return 401 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid email or password');
        });
    });

    it('should return 401 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid email or password');
        });
    });

    it('should return 400 for invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Please provide a valid email address');
        });
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Password is required');
        });
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      const inactiveUser = {
        id: 'inactive-user-id',
        email: 'inactive@example.com',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.CLERK,
        isActive: false,
      };

      await prismaService.user.create({ data: inactiveUser });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'password123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Account is inactive. Please contact administrator.');
        });
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      accessToken = loginResponse.body.accessToken;
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
            isActive: testUser.isActive,
          });
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidBearer token')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('tokenType', 'Bearer');
          expect(res.body).toHaveProperty('expiresIn');
          expect(res.body.user).toMatchObject({
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: testUser.role,
            isActive: testUser.isActive,
          });
        });
    });

    it('should return 401 for invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Invalid or expired refresh token');
        });
    });

    it('should return 400 for missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Refresh token is required');
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      
      accessToken = loginResponse.body.accessToken;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Logout successful');
        });
    });

    it('should return 401 without authorization header', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });
});