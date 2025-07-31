/**
 * Database Schema Integration Tests
 * 
 * These tests validate that the database schema is correctly created,
 * all tables exist with proper structure, and relationships are established.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { Case, CaseStatus, CasePriority, CaseType } from '../../cases/entities/case.entity';
import { CaseNote } from '../../cases/entities/case-note.entity';
import { CaseDocument } from '../../cases/entities/case-document.entity';
import { TEST_CONFIG } from '../setup';

describe('Database Schema Tests', () => {
  let dataSource: DataSource;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => TEST_CONFIG.database,
        }),
        TypeOrmModule.forFeature([User, Case, CaseNote, CaseDocument]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(getDataSourceToken());
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (module) {
      await module.close();
    }
  });

  describe('Table Structure Validation', () => {
    it('should have all required tables created', async () => {
      const tables = await dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      const tableNames = tables.map(t => t.table_name);
      
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('cases');
      expect(tableNames).toContain('case_notes');
      expect(tableNames).toContain('case_documents');
      expect(tableNames).toContain('audit_logs');
    });

    it('should have correct users table structure', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);

      const columnNames = columns.map(c => c.column_name);
      
      // Check required columns exist
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password');
      expect(columnNames).toContain('first_name');
      expect(columnNames).toContain('last_name');
      expect(columnNames).toContain('phone_number');
      expect(columnNames).toContain('role');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('profile_image_url');
      expect(columnNames).toContain('last_login_at');
      expect(columnNames).toContain('email_verified');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      // Check specific column properties
      const idColumn = columns.find(c => c.column_name === 'id');
      expect(idColumn.data_type).toBe('uuid');
      expect(idColumn.is_nullable).toBe('NO');

      const emailColumn = columns.find(c => c.column_name === 'email');
      expect(emailColumn.data_type).toBe('character varying');
      expect(emailColumn.is_nullable).toBe('NO');
    });

    it('should have correct cases table structure', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'cases' 
        ORDER BY ordinal_position
      `);

      const columnNames = columns.map(c => c.column_name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_number');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('type');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('priority');
      expect(columnNames).toContain('client_id');
      expect(columnNames).toContain('assigned_to');
      expect(columnNames).toContain('created_by');
      expect(columnNames).toContain('due_date');
      expect(columnNames).toContain('closed_at');
      expect(columnNames).toContain('closed_by');
      expect(columnNames).toContain('closure_reason');
      expect(columnNames).toContain('metadata');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have correct case_notes table structure', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'case_notes' 
        ORDER BY ordinal_position
      `);

      const columnNames = columns.map(c => c.column_name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_id');
      expect(columnNames).toContain('author_id');
      expect(columnNames).toContain('content');
      expect(columnNames).toContain('note_type');
      expect(columnNames).toContain('is_private');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have correct case_documents table structure', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'case_documents' 
        ORDER BY ordinal_position
      `);

      const columnNames = columns.map(c => c.column_name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_id');
      expect(columnNames).toContain('uploaded_by');
      expect(columnNames).toContain('filename');
      expect(columnNames).toContain('original_filename');
      expect(columnNames).toContain('file_path');
      expect(columnNames).toContain('file_size');
      expect(columnNames).toContain('mime_type');
      expect(columnNames).toContain('document_type');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('Constraints and Indexes', () => {
    it('should have primary key constraints', async () => {
      const constraints = await dataSource.query(`
        SELECT tc.table_name, tc.constraint_name, tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `);

      const tables = constraints.map(c => c.table_name);
      expect(tables).toContain('users');
      expect(tables).toContain('cases');
      expect(tables).toContain('case_notes');
      expect(tables).toContain('case_documents');
    });

    it('should have foreign key constraints', async () => {
      const constraints = await dataSource.query(`
        SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `);

      // Verify foreign key relationships exist
      const fkRelations = constraints.reduce((acc, constraint) => {
        const key = `${constraint.table_name}.${constraint.column_name}`;
        acc[key] = constraint.foreign_table_name;
        return acc;
      }, {});

      expect(fkRelations['cases.client_id']).toBe('users');
      expect(fkRelations['cases.assigned_to']).toBe('users');
      expect(fkRelations['cases.created_by']).toBe('users');
      expect(fkRelations['case_notes.case_id']).toBe('cases');
      expect(fkRelations['case_notes.author_id']).toBe('users');
      expect(fkRelations['case_documents.case_id']).toBe('cases');
      expect(fkRelations['case_documents.uploaded_by']).toBe('users');
    });

    it('should have unique constraints', async () => {
      const constraints = await dataSource.query(`
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `);

      const uniqueColumns = constraints.map(c => `${c.table_name}.${c.column_name}`);
      expect(uniqueColumns).toContain('users.email');
      expect(uniqueColumns).toContain('cases.case_number');
    });

    it('should have proper indexes', async () => {
      const indexes = await dataSource.query(`
        SELECT indexname, tablename, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname NOT LIKE 'PK_%'
        ORDER BY tablename, indexname
      `);

      // Check that indexes exist for frequently queried columns
      const indexNames = indexes.map(i => i.indexname);
      
      // These indexes should be created automatically for unique constraints and foreign keys
      expect(indexes.some(i => i.tablename === 'users' && i.indexdef.includes('email'))).toBe(true);
      expect(indexes.some(i => i.tablename === 'cases' && i.indexdef.includes('case_number'))).toBe(true);
    });
  });

  describe('Enum Types', () => {
    it('should have correct enum values for user roles', async () => {
      const enumValues = await dataSource.query(`
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'users_role_enum'
        ORDER BY e.enumsortorder
      `);

      const values = enumValues.map(e => e.enum_value);
      expect(values).toContain('admin');
      expect(values).toContain('caseworker');
      expect(values).toContain('supervisor');
      expect(values).toContain('client');
    });

    it('should have correct enum values for user status', async () => {
      const enumValues = await dataSource.query(`
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'users_status_enum'
        ORDER BY e.enumsortorder
      `);

      const values = enumValues.map(e => e.enum_value);
      expect(values).toContain('active');
      expect(values).toContain('inactive');
      expect(values).toContain('suspended');
    });

    it('should have correct enum values for case status', async () => {
      const enumValues = await dataSource.query(`
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'cases_status_enum'
        ORDER BY e.enumsortorder
      `);

      const values = enumValues.map(e => e.enum_value);
      expect(values).toContain('open');
      expect(values).toContain('in_progress');
      expect(values).toContain('pending_review');
      expect(values).toContain('closed');
      expect(values).toContain('archived');
    });

    it('should have correct enum values for case priority', async () => {
      const enumValues = await dataSource.query(`
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'cases_priority_enum'
        ORDER BY e.enumsortorder
      `);

      const values = enumValues.map(e => e.enum_value);
      expect(values).toContain('low');
      expect(values).toContain('medium');
      expect(values).toContain('high');
      expect(values).toContain('urgent');
    });

    it('should have correct enum values for case type', async () => {
      const enumValues = await dataSource.query(`
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'cases_type_enum'
        ORDER BY e.enumsortorder
      `);

      const values = enumValues.map(e => e.enum_value);
      expect(values).toContain('consultation');
      expect(values).toContain('legal_advice');
      expect(values).toContain('representation');
      expect(values).toContain('mediation');
      expect(values).toContain('document_review');
      expect(values).toContain('other');
    });
  });

  describe('Data Types Validation', () => {
    it('should have correct UUID columns', async () => {
      const uuidColumns = await dataSource.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE data_type = 'uuid'
        AND table_schema = 'public'
        ORDER BY table_name, column_name
      `);

      const uuidCols = uuidColumns.map(c => `${c.table_name}.${c.column_name}`);
      
      expect(uuidCols).toContain('users.id');
      expect(uuidCols).toContain('cases.id');
      expect(uuidCols).toContain('case_notes.id');
      expect(uuidCols).toContain('case_documents.id');
    });

    it('should have correct timestamp columns', async () => {
      const timestampColumns = await dataSource.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE data_type = 'timestamp without time zone'
        AND table_schema = 'public'
        ORDER BY table_name, column_name
      `);

      const timestampCols = timestampColumns.map(c => `${c.table_name}.${c.column_name}`);
      
      expect(timestampCols).toContain('users.created_at');
      expect(timestampCols).toContain('users.updated_at');
      expect(timestampCols).toContain('cases.created_at');
      expect(timestampCols).toContain('cases.updated_at');
    });

    it('should have correct JSONB columns', async () => {
      const jsonbColumns = await dataSource.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE data_type = 'jsonb'
        AND table_schema = 'public'
        ORDER BY table_name, column_name
      `);

      const jsonbCols = jsonbColumns.map(c => `${c.table_name}.${c.column_name}`);
      expect(jsonbCols).toContain('cases.metadata');
    });
  });

  describe('Default Values', () => {
    it('should have correct default values for users table', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_default IS NOT NULL
        ORDER BY column_name
      `);

      const defaults = columns.reduce((acc, col) => {
        acc[col.column_name] = col.column_default;
        return acc;
      }, {});

      expect(defaults.role).toContain('client');
      expect(defaults.status).toContain('active');
      expect(defaults.email_verified).toContain('false');
    });

    it('should have correct default values for cases table', async () => {
      const columns = await dataSource.query(`
        SELECT column_name, column_default
        FROM information_schema.columns
        WHERE table_name = 'cases'
        AND column_default IS NOT NULL
        ORDER BY column_name
      `);

      const defaults = columns.reduce((acc, col) => {
        acc[col.column_name] = col.column_default;
        return acc;
      }, {});

      expect(defaults.type).toContain('consultation');
      expect(defaults.status).toContain('open');
      expect(defaults.priority).toContain('medium');
    });
  });

  describe('Schema Synchronization', () => {
    it('should have synchronized schema with entities', async () => {
      // This test ensures that the database schema matches the TypeORM entities
      const entityMetadata = dataSource.entityMetadatas;
      
      expect(entityMetadata).toHaveLength(4); // User, Case, CaseNote, CaseDocument
      
      const tableNames = entityMetadata.map(meta => meta.tableName);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('cases');
      expect(tableNames).toContain('case_notes');
      expect(tableNames).toContain('case_documents');
    });

    it('should have all entity columns in database', async () => {
      const userMetadata = dataSource.getMetadata(User);
      const userColumns = userMetadata.columns.map(col => col.databaseName);
      
      const dbColumns = await dataSource.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY column_name
      `);
      
      const dbColumnNames = dbColumns.map(c => c.column_name);
      
      // Check that all entity columns exist in database
      userColumns.forEach(colName => {
        expect(dbColumnNames).toContain(colName);
      });
    });
  });
});