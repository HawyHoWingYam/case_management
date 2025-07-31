/**
 * Database testing helper utilities
 * Provides comprehensive database testing capabilities including seeding, cleanup, and transaction management
 */

import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TEST_CONFIG } from '../setup';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { Case, CaseStatus, CasePriority, CaseType } from '../../cases/entities/case.entity';
import { CaseNote } from '../../cases/entities/case-note.entity';
import { CaseDocument } from '../../cases/entities/case-document.entity';
import * as bcrypt from 'bcryptjs';

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  phoneNumber?: string;
}

export interface TestCase {
  id?: string;
  caseNumber: string;
  title: string;
  description?: string;
  type?: CaseType;
  status?: CaseStatus;
  priority?: CasePriority;
  clientId: string;
  assignedToId?: string;
  createdById: string;
  dueDate?: Date;
}

export interface TestCaseNote {
  id?: string;
  caseId: string;
  authorId: string;
  content: string;
  type?: string;
  title?: string;
  isConfidential?: boolean;
  isBillable?: boolean;
  billableHours?: number;
  contactDate?: Date;
}

export interface TestCaseDocument {
  id?: string;
  caseId: string;
  uploadedById: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type?: string;
  description?: string;
  isConfidential?: boolean;
  isClientAccessible?: boolean;
}

export class DatabaseTestHelper {
  private dataSource: DataSource;
  private module: TestingModule;
  private queryRunner: QueryRunner | null = null;

  /**
   * Initialize test database connection
   */
  async initialize(): Promise<void> {
    this.module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(TEST_CONFIG.database),
        TypeOrmModule.forFeature([User, Case, CaseNote, CaseDocument]),
      ],
    }).compile();

    this.dataSource = this.module.get<DataSource>(DataSource);
    await this.dataSource.synchronize(true);
  }

  /**
   * Clean up and close database connection
   */
  async cleanup(): Promise<void> {
    if (this.queryRunner) {
      await this.rollbackTransaction();
    }
    
    if (this.dataSource && this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
    if (this.module) {
      await this.module.close();
    }
  }

  /**
   * Get repository for entity
   */
  getRepository<T>(entity: any): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  /**
   * Clear all data from specified tables in proper order (respecting foreign key constraints)
   */
  async clearTables(tableNames: string[]): Promise<void> {
    // Disable foreign key checks temporarily
    await this.dataSource.query('SET session_replication_role = replica;');
    
    try {
      for (const tableName of tableNames) {
        await this.dataSource.query(`DELETE FROM "${tableName}";`);
        // Reset auto-increment sequences if they exist
        await this.dataSource.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 1, false) 
          WHERE pg_get_serial_sequence('${tableName}', 'id') IS NOT NULL;
        `);
      }
    } finally {
      // Re-enable foreign key checks
      await this.dataSource.query('SET session_replication_role = DEFAULT;');
    }
  }

  /**
   * Clear all data from all tables in correct order
   */
  async clearAllTables(): Promise<void> {
    const tableOrder = [
      'case_documents',
      'case_notes', 
      'cases',
      'users',
      'audit_logs'
    ];
    
    await this.clearTables(tableOrder);
  }

  /**
   * Execute raw SQL query
   */
  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.dataSource.query(sql, parameters);
  }

  /**
   * Start database transaction for testing
   */
  async startTransaction(): Promise<QueryRunner> {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    return this.queryRunner;
  }

  /**
   * Commit database transaction
   */
  async commitTransaction(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.commitTransaction();
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  /**
   * Rollback database transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (this.queryRunner) {
      await this.queryRunner.rollbackTransaction();
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  /**
   * Create test user
   */
  async createTestUser(userData: TestUser): Promise<User> {
    const userRepo = this.getRepository<User>(User);
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = userRepo.create({
      ...userData,
      password: hashedPassword,
      status: userData.status || UserStatus.ACTIVE,
      emailVerified: true,
    });

    return await userRepo.save(user);
  }

  /**
   * Create test case
   */
  async createTestCase(caseData: TestCase): Promise<Case> {
    const caseRepo = this.getRepository<Case>(Case);
    
    const testCase = caseRepo.create({
      ...caseData,
      type: caseData.type || CaseType.CONSULTATION,
      status: caseData.status || CaseStatus.OPEN,
      priority: caseData.priority || CasePriority.MEDIUM,
    });

    return await caseRepo.save(testCase);
  }

  /**
   * Create test case note
   */
  async createTestCaseNote(noteData: TestCaseNote): Promise<CaseNote> {
    const noteRepo = this.getRepository<CaseNote>(CaseNote);
    
    const note = noteRepo.create({
      ...noteData,
      type: noteData.type || 'general',
      isConfidential: noteData.isConfidential || false,
      isBillable: noteData.isBillable || false,
    });

    return await noteRepo.save(note);
  }

  /**
   * Create test case document
   */
  async createTestCaseDocument(docData: TestCaseDocument): Promise<CaseDocument> {
    const docRepo = this.getRepository<CaseDocument>(CaseDocument);
    
    const document = docRepo.create({
      ...docData,
      type: docData.type || 'other',
      isConfidential: docData.isConfidential || false,
      isClientAccessible: docData.isClientAccessible !== undefined ? docData.isClientAccessible : true,
    });

    return await docRepo.save(document);
  }

  /**
   * Seed comprehensive test data
   */
  async seedTestData(): Promise<{
    users: User[];
    cases: Case[];
    notes: CaseNote[];
    documents: CaseDocument[];
  }> {
    console.log('Seeding comprehensive test data...');

    // Create test users
    const users = [];
    
    // Admin user
    users.push(await this.createTestUser({
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    }));

    // Caseworker
    users.push(await this.createTestUser({
      email: 'caseworker@example.com',
      password: 'CasePass123!',
      firstName: 'Case',
      lastName: 'Worker',
      role: UserRole.CASEWORKER,
      phoneNumber: '+1234567890',
    }));

    // Supervisor
    users.push(await this.createTestUser({
      email: 'supervisor@example.com',
      password: 'SuperPass123!',
      firstName: 'Super',
      lastName: 'Visor',
      role: UserRole.SUPERVISOR,
      phoneNumber: '+1234567891',
    }));

    // Clients
    users.push(await this.createTestUser({
      email: 'client1@example.com',
      password: 'ClientPass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CLIENT,
      phoneNumber: '+1234567892',
    }));

    users.push(await this.createTestUser({
      email: 'client2@example.com',
      password: 'ClientPass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.CLIENT,
      phoneNumber: '+1234567893',
    }));

    // Create test cases
    const cases = [];
    const [admin, caseworker, supervisor, client1, client2] = users;

    cases.push(await this.createTestCase({
      caseNumber: 'CASE-001',
      title: 'Legal Consultation for Property Dispute',
      description: 'Client needs legal advice regarding property boundary dispute',
      type: CaseType.LEGAL_ADVICE,
      status: CaseStatus.OPEN,
      priority: CasePriority.HIGH,
      clientId: client1.id,
      assignedToId: caseworker.id,
      createdById: admin.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }));

    cases.push(await this.createTestCase({
      caseNumber: 'CASE-002',
      title: 'Family Mediation',
      description: 'Mediation services for custody arrangement',
      type: CaseType.MEDIATION,
      status: CaseStatus.IN_PROGRESS,
      priority: CasePriority.MEDIUM,
      clientId: client2.id,
      assignedToId: supervisor.id,
      createdById: caseworker.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    }));

    cases.push(await this.createTestCase({
      caseNumber: 'CASE-003',
      title: 'Document Review - Contract Analysis',
      description: 'Review and analysis of employment contract',
      type: CaseType.DOCUMENT_REVIEW,
      status: CaseStatus.PENDING_REVIEW,
      priority: CasePriority.LOW,
      clientId: client1.id,
      assignedToId: caseworker.id,
      createdById: supervisor.id,
    }));

    // Create test case notes
    const notes = [];
    
    notes.push(await this.createTestCaseNote({
      caseId: cases[0].id,
      authorId: caseworker.id,
      content: 'Initial consultation completed. Client provided property documents.',
      type: 'meeting',
      title: 'Initial Consultation',
      isConfidential: false,
      isBillable: true,
      billableHours: 1.5,
      contactDate: new Date(),
    }));

    notes.push(await this.createTestCaseNote({
      caseId: cases[0].id,
      authorId: admin.id,
      content: 'Reviewed case details. Recommending external legal counsel.',
      type: 'internal',
      title: 'Case Review',
      isConfidential: true,
      isBillable: false,
    }));

    notes.push(await this.createTestCaseNote({
      caseId: cases[1].id,
      authorId: supervisor.id,
      content: 'First mediation session scheduled for next week.',
      type: 'phone_call',
      title: 'Scheduling Call',
      isConfidential: false,
      isBillable: true,
      billableHours: 0.25,
      contactDate: new Date(),
    }));

    // Create test case documents
    const documents = [];
    
    documents.push(await this.createTestCaseDocument({
      caseId: cases[0].id,
      uploadedById: client1.id,
      filename: 'property_deed_001.pdf',
      originalFilename: 'Property Deed.pdf',
      filePath: '/uploads/cases/001/property_deed_001.pdf',
      fileSize: 1024000,
      mimeType: 'application/pdf',
      documentType: 'legal_document',
      description: 'Original property deed',
    }));

    documents.push(await this.createTestCaseDocument({
      caseId: cases[1].id,
      uploadedById: caseworker.id,
      filename: 'mediation_agreement_002.pdf',
      originalFilename: 'Mediation Agreement.pdf',
      filePath: '/uploads/cases/002/mediation_agreement_002.pdf',
      fileSize: 512000,
      mimeType: 'application/pdf',
      documentType: 'agreement',
      description: 'Initial mediation agreement',
    }));

    documents.push(await this.createTestCaseDocument({
      caseId: cases[2].id,
      uploadedById: client1.id,
      filename: 'employment_contract_003.pdf',
      originalFilename: 'Employment Contract.pdf',
      filePath: '/uploads/cases/003/employment_contract_003.pdf',
      fileSize: 256000,
      mimeType: 'application/pdf',
      documentType: 'contract',
      description: 'Employment contract for review',
    }));

    console.log(`Seeded ${users.length} users, ${cases.length} cases, ${notes.length} notes, ${documents.length} documents`);

    return { users, cases, notes, documents };
  }

  /**
   * Create minimal test data set for quick tests
   */
  async seedMinimalTestData(): Promise<{ user: User; case: Case }> {
    const user = await this.createTestUser({
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.CASEWORKER,
    });

    const client = await this.createTestUser({
      email: 'client@example.com',
      password: 'ClientPass123!',
      firstName: 'Test',
      lastName: 'Client',
      role: UserRole.CLIENT,
    });

    const testCase = await this.createTestCase({
      caseNumber: 'TEST-001',
      title: 'Test Case',
      description: 'A test case for unit testing',
      clientId: client.id,
      createdById: user.id,
    });

    return { user, case: testCase };
  }

  /**
   * Get data source instance
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    const result = await this.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )
    `, [tableName]);
    
    return result[0].exists;
  }

  /**
   * Get table row count
   */
  async getTableCount(tableName: string): Promise<number> {
    const result = await this.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return parseInt(result[0].count);
  }

  /**
   * Verify database constraints
   */
  async verifyConstraints(): Promise<boolean> {
    try {
      // Test unique constraint on user email
      const user1 = await this.createTestUser({
        email: 'unique-test@example.com',
        password: 'pass',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLIENT,
      });

      // This should fail due to unique constraint
      try {
        await this.createTestUser({
          email: 'unique-test@example.com', // Same email
          password: 'pass',
          firstName: 'Test2',
          lastName: 'User2',
          role: UserRole.CLIENT,
        });
        return false; // Should not reach here
      } catch (error) {
        // Expected to fail
        return true;
      }
    } catch (error) {
      return false;
    }
  }
}