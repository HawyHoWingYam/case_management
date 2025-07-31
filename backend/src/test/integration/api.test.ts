import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../../app.module';
import { User } from '../../entities/user.entity';
import { Case } from '../../entities/case.entity';
import { getConnection } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'test_user',
          password: 'test_password',
          database: 'case_management_test',
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Create test user and auth token
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'Clerk',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    testUser = response.body.user;
    authToken = response.body.access_token;
  });

  afterAll(async () => {
    const connection = getConnection();
    await connection.dropDatabase();
    await connection.close();
    await app.close();
  });

  afterEach(async () => {
    // Clean up case data after each test
    const connection = getConnection();
    await connection.query('DELETE FROM case_logs');
    await connection.query('DELETE FROM case_attachments');
    await connection.query('DELETE FROM cases');
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(loginData.email);
        expect(response.body.user.password_hash).toBeUndefined();
      });

      it('should reject invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
          .expect(401);
      });

      it('should validate required fields', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(400);
      });

      it('should validate email format', async () => {
        const loginData = {
          email: 'invalid-email',
          password: 'password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
          .expect(400);
      });
    });

    describe('POST /auth/register', () => {
      it('should register new user with valid data', async () => {
        const userData = {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          role: 'Caseworker',
        };

        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.name).toBe(userData.name);
        expect(response.body.user.role).toBe(userData.role);
      });

      it('should reject duplicate email', async () => {
        const userData = {
          email: 'test@example.com', // Already exists
          password: 'password123',
          name: 'Duplicate User',
          role: 'Clerk',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData)
          .expect(409);
      });

      it('should validate password strength', async () => {
        const userData = {
          email: 'weak@example.com',
          password: '123', // Too weak
          name: 'Weak Password User',
          role: 'Clerk',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(userData)
          .expect(400);
      });
    });

    describe('GET /auth/profile', () => {
      it('should return user profile with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.email).toBe('test@example.com');
        expect(response.body.password_hash).toBeUndefined();
      });

      it('should reject request without token', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .expect(401);
      });

      it('should reject request with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);
      });
    });
  });

  describe('Cases Endpoints', () => {
    describe('POST /cases', () => {
      it('should create new case with valid data', async () => {
        const caseData = {
          title: 'Test Case',
          description: 'This is a test case',
          priority: 'High',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        const response = await request(app.getHttpServer())
          .post('/cases')
          .set('Authorization', `Bearer ${authToken}`)
          .send(caseData)
          .expect(201);

        expect(response.body.title).toBe(caseData.title);
        expect(response.body.status).toBe('New');
        expect(response.body.created_by.id).toBe(testUser.id);
      });

      it('should reject unauthorized request', async () => {
        const caseData = {
          title: 'Unauthorized Case',
          description: 'This should fail',
          priority: 'Medium',
        };

        await request(app.getHttpServer())
          .post('/cases')
          .send(caseData)
          .expect(401);
      });

      it('should validate required fields', async () => {
        await request(app.getHttpServer())
          .post('/cases')
          .set('Authorization', `Bearer ${authToken}`)
          .send({})
          .expect(400);
      });

      it('should validate due date is in future', async () => {
        const caseData = {
          title: 'Invalid Date Case',
          description: 'This has past due date',
          priority: 'Medium',
          due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        };

        await request(app.getHttpServer())
          .post('/cases')
          .set('Authorization', `Bearer ${authToken}`)
          .send(caseData)
          .expect(400);
      });
    });

    describe('GET /cases', () => {
      beforeEach(async () => {
        // Create test cases
        const casesData = [
          {
            title: 'Case 1',
            description: 'First test case',
            priority: 'High',
            status: 'New',
          },
          {
            title: 'Case 2',
            description: 'Second test case',
            priority: 'Medium',
            status: 'Assigned',
          },
        ];

        for (const caseData of casesData) {
          await request(app.getHttpServer())
            .post('/cases')
            .set('Authorization', `Bearer ${authToken}`)
            .send(caseData);
        }
      });

      it('should return paginated cases', async () => {
        const response = await request(app.getHttpServer())
          .get('/cases?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body.data).toHaveLength(2);
      });

      it('should filter cases by status', async () => {
        const response = await request(app.getHttpServer())
          .get('/cases?status=New')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].status).toBe('New');
      });

      it('should sort cases by creation date desc', async () => {
        const response = await request(app.getHttpServer())
          .get('/cases')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const cases = response.body.data;
        for (let i = 1; i < cases.length; i++) {
          const currentDate = new Date(cases[i].created_at);
          const previousDate = new Date(cases[i - 1].created_at);
          expect(currentDate.getTime()).toBeLessThanOrEqual(previousDate.getTime());
        }
      });
    });

    describe('GET /cases/:id', () => {
      let testCase: any;

      beforeEach(async () => {
        const caseData = {
          title: 'Detailed Test Case',
          description: 'Case for detail testing',
          priority: 'Medium',
        };

        const response = await request(app.getHttpServer())
          .post('/cases')
          .set('Authorization', `Bearer ${authToken}`)
          .send(caseData);

        testCase = response.body;
      });

      it('should return case details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/cases/${testCase.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testCase.id);
        expect(response.body.title).toBe(testCase.title);
        expect(response.body).toHaveProperty('logs');
        expect(response.body).toHaveProperty('attachments');
      });

      it('should return 404 for non-existent case', async () => {
        const fakeId = '123e4567-e89b-12d3-a456-426614174000';
        
        await request(app.getHttpServer())
          .get(`/cases/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should return 400 for invalid UUID', async () => {
        await request(app.getHttpServer())
          .get('/cases/invalid-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      });
    });
  });

  describe('File Upload Endpoints', () => {
    let testCase: any;

    beforeEach(async () => {
      const caseData = {
        title: 'File Upload Test Case',
        description: 'Case for file upload testing',
        priority: 'Medium',
      };

      const response = await request(app.getHttpServer())
        .post('/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(caseData);

      testCase = response.body;
    });

    describe('POST /cases/:id/attachments', () => {
      it('should upload file successfully', async () => {
        const testFileContent = Buffer.from('Test file content');

        const response = await request(app.getHttpServer())
          .post(`/cases/${testCase.id}/attachments`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFileContent, {
            filename: 'test-document.pdf',
            contentType: 'application/pdf',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.filename).toBe('test-document.pdf');
        expect(response.body.content_type).toBe('application/pdf');
        expect(response.body).toHaveProperty('s3_key');
      });

      it('should reject files larger than size limit', async () => {
        const largeFileContent = Buffer.alloc(11 * 1024 * 1024); // 11MB, over 10MB limit

        await request(app.getHttpServer())
          .post(`/cases/${testCase.id}/attachments`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', largeFileContent, {
            filename: 'large-file.pdf',
            contentType: 'application/pdf',
          })
          .expect(413);
      });

      it('should reject unsupported file types', async () => {
        const testFileContent = Buffer.from('Test executable content');

        await request(app.getHttpServer())
          .post(`/cases/${testCase.id}/attachments`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFileContent, {
            filename: 'malicious.exe',
            contentType: 'application/x-executable',
          })
          .expect(400);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginData)
          .expect(401);
      }

      // Next attempt should be rate limited
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(429);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body.statusCode).toBe(400);
    });

    it('should not expose sensitive information in errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/cases/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Should not contain database details or internal paths
      expect(response.body.message).not.toContain('postgres');
      expect(response.body.message).not.toContain('/src/');
      expect(response.body.message).not.toContain('node_modules');
    });
  });
});