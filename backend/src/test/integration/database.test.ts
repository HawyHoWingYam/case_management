import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Case } from '../../entities/case.entity';
import { CaseLog } from '../../entities/case-log.entity';
import { CaseAttachment } from '../../entities/case-attachment.entity';
import { UserRole, CaseStatus, CasePriority } from '../../common/enums';

describe('Database Integration Tests', () => {
  let connection: Connection;
  let userRepository: Repository<User>;
  let caseRepository: Repository<Case>;
  let caseLogRepository: Repository<CaseLog>;
  let caseAttachmentRepository: Repository<CaseAttachment>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433,
          username: 'test_user',
          password: 'test_password',
          database: 'case_management_test',
          entities: [User, Case, CaseLog, CaseAttachment],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([User, Case, CaseLog, CaseAttachment]),
      ],
    }).compile();

    connection = module.get<Connection>(Connection);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    caseRepository = module.get<Repository<Case>>(getRepositoryToken(Case));
    caseLogRepository = module.get<Repository<CaseLog>>(getRepositoryToken(CaseLog));
    caseAttachmentRepository = module.get<Repository<CaseAttachment>>(getRepositoryToken(CaseAttachment));
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await caseAttachmentRepository.delete({});
    await caseLogRepository.delete({});
    await caseRepository.delete({});
    await userRepository.delete({});
  });

  describe('User Entity Operations', () => {
    it('should create and retrieve user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Test User',
      };

      // Act
      const user = userRepository.create(userData);
      const savedUser = await userRepository.save(user);
      const retrievedUser = await userRepository.findOne({ where: { id: savedUser.id } });

      // Assert
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.email).toBe(userData.email);
      expect(retrievedUser.role).toBe(userData.role);
      expect(retrievedUser.created_at).toBeDefined();
      expect(retrievedUser.updated_at).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Test User 1',
      };

      const duplicateUserData = {
        email: 'duplicate@example.com', // Same email
        password_hash: 'hashedPassword456',
        role: UserRole.CASEWORKER,
        name: 'Test User 2',
      };

      // Act
      const user1 = userRepository.create(userData);
      await userRepository.save(user1);

      const user2 = userRepository.create(duplicateUserData);

      // Assert
      await expect(userRepository.save(user2)).rejects.toThrow();
    });

    it('should validate role enum values', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password_hash: 'hashedPassword123',
        role: 'InvalidRole' as UserRole,
        name: 'Test User',
      };

      // Act & Assert
      const user = userRepository.create(userData);
      await expect(userRepository.save(user)).rejects.toThrow();
    });

    it('should update user timestamps on modification', async () => {
      // Arrange
      const userData = {
        email: 'timestamp@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Timestamp User',
      };

      // Act
      const user = userRepository.create(userData);
      const savedUser = await userRepository.save(user);
      const originalUpdatedAt = savedUser.updated_at;

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedUser.name = 'Updated Name';
      const updatedUser = await userRepository.save(savedUser);

      // Assert
      expect(updatedUser.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Case Entity Operations', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = userRepository.create({
        email: 'casetest@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Case Test User',
      });
      testUser = await userRepository.save(testUser);
    });

    it('should create case with proper relationships', async () => {
      // Arrange
      const caseData = {
        title: 'Test Case',
        description: 'Test case description',
        status: CaseStatus.NEW,
        priority: CasePriority.HIGH,
        created_by: testUser,
      };

      // Act
      const case_ = caseRepository.create(caseData);
      const savedCase = await caseRepository.save(case_);
      const retrievedCase = await caseRepository.findOne({
        where: { id: savedCase.id },
        relations: ['created_by'],
      });

      // Assert
      expect(retrievedCase).toBeDefined();
      expect(retrievedCase.title).toBe(caseData.title);
      expect(retrievedCase.created_by.id).toBe(testUser.id);
      expect(retrievedCase.status).toBe(CaseStatus.NEW);
      expect(retrievedCase.priority).toBe(CasePriority.HIGH);
    });

    it('should handle case assignment', async () => {
      // Arrange
      const caseworker = userRepository.create({
        email: 'caseworker@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CASEWORKER,
        name: 'Test Caseworker',
      });
      await userRepository.save(caseworker);

      const case_ = caseRepository.create({
        title: 'Assignment Test Case',
        description: 'Test case for assignment',
        status: CaseStatus.NEW,
        priority: CasePriority.MEDIUM,
        created_by: testUser,
      });
      const savedCase = await caseRepository.save(case_);

      // Act
      savedCase.assigned_caseworker = caseworker;
      savedCase.status = CaseStatus.ASSIGNED;
      const updatedCase = await caseRepository.save(savedCase);

      const retrievedCase = await caseRepository.findOne({
        where: { id: updatedCase.id },
        relations: ['created_by', 'assigned_caseworker'],
      });

      // Assert
      expect(retrievedCase.assigned_caseworker).toBeDefined();
      expect(retrievedCase.assigned_caseworker.id).toBe(caseworker.id);
      expect(retrievedCase.status).toBe(CaseStatus.ASSIGNED);
    });

    it('should enforce foreign key constraints', async () => {
      // Arrange
      const invalidCase = caseRepository.create({
        title: 'Invalid Case',
        description: 'Case with invalid user reference',
        status: CaseStatus.NEW,
        priority: CasePriority.MEDIUM,
        created_by: { id: 'non-existent-id' } as User,
      });

      // Act & Assert
      await expect(caseRepository.save(invalidCase)).rejects.toThrow();
    });
  });

  describe('Case Log Operations', () => {
    let testUser: User;
    let testCase: Case;

    beforeEach(async () => {
      testUser = userRepository.create({
        email: 'logtest@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Log Test User',
      });
      testUser = await userRepository.save(testUser);

      testCase = caseRepository.create({
        title: 'Log Test Case',
        description: 'Test case for logging',
        status: CaseStatus.NEW,
        priority: CasePriority.MEDIUM,
        created_by: testUser,
      });
      testCase = await caseRepository.save(testCase);
    });

    it('should create case log with proper relationships', async () => {
      // Arrange
      const logData = {
        case: testCase,
        user: testUser,
        action: 'CASE_CREATED',
        description: 'Case was created',
      };

      // Act
      const log = caseLogRepository.create(logData);
      const savedLog = await caseLogRepository.save(log);
      const retrievedLog = await caseLogRepository.findOne({
        where: { id: savedLog.id },
        relations: ['case', 'user'],
      });

      // Assert
      expect(retrievedLog).toBeDefined();
      expect(retrievedLog.case.id).toBe(testCase.id);
      expect(retrievedLog.user.id).toBe(testUser.id);
      expect(retrievedLog.action).toBe('CASE_CREATED');
      expect(retrievedLog.created_at).toBeDefined();
    });

    it('should maintain chronological order of logs', async () => {
      // Arrange & Act
      const log1 = caseLogRepository.create({
        case: testCase,
        user: testUser,
        action: 'CASE_CREATED',
        description: 'First log entry',
      });
      await caseLogRepository.save(log1);

      await new Promise(resolve => setTimeout(resolve, 10));

      const log2 = caseLogRepository.create({
        case: testCase,
        user: testUser,
        action: 'STATUS_CHANGED',
        description: 'Second log entry',
      });
      await caseLogRepository.save(log2);

      const logs = await caseLogRepository.find({
        where: { case: { id: testCase.id } },
        order: { created_at: 'ASC' },
      });

      // Assert
      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('CASE_CREATED');
      expect(logs[1].action).toBe('STATUS_CHANGED');
      expect(logs[0].created_at.getTime()).toBeLessThan(logs[1].created_at.getTime());
    });
  });

  describe('Case Attachment Operations', () => {
    let testUser: User;
    let testCase: Case;

    beforeEach(async () => {
      testUser = userRepository.create({
        email: 'attachmenttest@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Attachment Test User',
      });
      testUser = await userRepository.save(testUser);

      testCase = caseRepository.create({
        title: 'Attachment Test Case',
        description: 'Test case for attachments',
        status: CaseStatus.NEW,
        priority: CasePriority.MEDIUM,
        created_by: testUser,
      });
      testCase = await caseRepository.save(testCase);
    });

    it('should create case attachment with metadata', async () => {
      // Arrange
      const attachmentData = {
        case: testCase,
        filename: 'test-document.pdf',
        s3_key: 'cases/123/attachments/test-document.pdf',
        file_size: 1024000,
        content_type: 'application/pdf',
        uploaded_by: testUser,
      };

      // Act
      const attachment = caseAttachmentRepository.create(attachmentData);
      const savedAttachment = await caseAttachmentRepository.save(attachment);
      const retrievedAttachment = await caseAttachmentRepository.findOne({
        where: { id: savedAttachment.id },
        relations: ['case', 'uploaded_by'],
      });

      // Assert
      expect(retrievedAttachment).toBeDefined();
      expect(retrievedAttachment.filename).toBe(attachmentData.filename);
      expect(retrievedAttachment.s3_key).toBe(attachmentData.s3_key);
      expect(retrievedAttachment.file_size).toBe(attachmentData.file_size);
      expect(retrievedAttachment.case.id).toBe(testCase.id);
      expect(retrievedAttachment.uploaded_by.id).toBe(testUser.id);
    });
  });

  describe('Complex Queries and Performance', () => {
    beforeEach(async () => {
      // Create test data for performance testing
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = userRepository.create({
          email: `user${i}@example.com`,
          password_hash: 'hashedPassword123',
          role: i < 5 ? UserRole.CLERK : UserRole.CASEWORKER,
          name: `Test User ${i}`,
        });
        users.push(await userRepository.save(user));
      }

      // Create multiple cases
      const cases = [];
      for (let i = 0; i < 50; i++) {
        const case_ = caseRepository.create({
          title: `Test Case ${i}`,
          description: `Description for test case ${i}`,
          status: i % 2 === 0 ? CaseStatus.NEW : CaseStatus.ASSIGNED,
          priority: CasePriority.MEDIUM,
          created_by: users[i % 5],
          assigned_caseworker: i % 2 === 1 ? users[5 + (i % 5)] : null,
        });
        cases.push(await caseRepository.save(case_));
      }
    });

    it('should efficiently query cases with pagination', async () => {
      // Act
      const startTime = Date.now();
      const result = await caseRepository.findAndCount({
        relations: ['created_by', 'assigned_caseworker'],
        order: { created_at: 'DESC' },
        skip: 0,
        take: 20,
      });
      const queryTime = Date.now() - startTime;

      // Assert
      expect(result[0]).toHaveLength(20);
      expect(result[1]).toBe(50);
      expect(queryTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should efficiently filter cases by status', async () => {
      // Act
      const startTime = Date.now();
      const newCases = await caseRepository.find({
        where: { status: CaseStatus.NEW },
        relations: ['created_by'],
      });
      const queryTime = Date.now() - startTime;

      // Assert
      expect(newCases).toHaveLength(25);
      expect(queryTime).toBeLessThan(50);
    });

    it('should handle concurrent operations', async () => {
      // Arrange
      const user = await userRepository.findOne();
      const concurrentOperations = [];

      // Act - Simulate concurrent case creation
      for (let i = 0; i < 5; i++) {
        const operation = caseRepository.save(caseRepository.create({
          title: `Concurrent Case ${i}`,
          description: `Concurrent case description ${i}`,
          status: CaseStatus.NEW,
          priority: CasePriority.MEDIUM,
          created_by: user,
        }));
        concurrentOperations.push(operation);
      }

      const results = await Promise.all(concurrentOperations);

      // Assert
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeDefined();
      });
    });
  });

  describe('Database Constraints and Validation', () => {
    it('should enforce NOT NULL constraints', async () => {
      // Arrange
      const invalidUser = userRepository.create({
        email: null, // Should be NOT NULL
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Invalid User',
      });

      // Act & Assert
      await expect(userRepository.save(invalidUser)).rejects.toThrow();
    });

    it('should enforce enum constraints', async () => {
      // Arrange
      const testUser = userRepository.create({
        email: 'enumtest@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Enum Test User',
      });
      await userRepository.save(testUser);

      const invalidCase = caseRepository.create({
        title: 'Invalid Status Case',
        description: 'Case with invalid status',
        status: 'InvalidStatus' as CaseStatus,
        priority: CasePriority.MEDIUM,
        created_by: testUser,
      });

      // Act & Assert
      await expect(caseRepository.save(invalidCase)).rejects.toThrow();
    });

    it('should handle cascading deletes properly', async () => {
      // Arrange
      const user = userRepository.create({
        email: 'cascade@example.com',
        password_hash: 'hashedPassword123',
        role: UserRole.CLERK,
        name: 'Cascade Test User',
      });
      const savedUser = await userRepository.save(user);

      const case_ = caseRepository.create({
        title: 'Cascade Test Case',
        description: 'Case for cascade testing',
        status: CaseStatus.NEW,
        priority: CasePriority.MEDIUM,
        created_by: savedUser,
      });
      const savedCase = await caseRepository.save(case_);

      const log = caseLogRepository.create({
        case: savedCase,
        user: savedUser,
        action: 'CASE_CREATED',
        description: 'Case created',
      });
      await caseLogRepository.save(log);

      // Act - Delete case should cascade to logs
      await caseRepository.delete(savedCase.id);

      // Assert
      const remainingLogs = await caseLogRepository.find({
        where: { case: { id: savedCase.id } },
      });
      expect(remainingLogs).toHaveLength(0);
    });
  });
});