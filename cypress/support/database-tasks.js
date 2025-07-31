/**
 * Cypress database tasks for E2E testing
 * These tasks handle database seeding and cleanup for tests
 */

const { Client } = require('pg');

// Database configuration for tests
const dbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5433,
  database: process.env.TEST_DB_NAME || 'case_management_test',
  user: process.env.TEST_DB_USER || 'test_user',
  password: process.env.TEST_DB_PASSWORD || 'test_password',
};

// Test users data
const testUsers = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'clerk@example.com',
    password_hash: '$2b$10$example.hash.for.testing',
    first_name: 'Test',
    last_name: 'Clerk',
    role: 'clerk',
    is_active: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'chair@example.com',
    password_hash: '$2b$10$example.hash.for.testing',
    first_name: 'Test',
    last_name: 'Chair',
    role: 'chair',
    is_active: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    email: 'caseworker@example.com',
    password_hash: '$2b$10$example.hash.for.testing',
    first_name: 'Test',
    last_name: 'Caseworker',
    role: 'caseworker',
    is_active: true,
  },
];

// Test clients data
const testClients = [
  {
    id: '223e4567-e89b-12d3-a456-426614174000',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St, City, State 12345',
    date_of_birth: '1990-01-01',
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1234567891',
    address: '456 Oak Ave, City, State 12345',
    date_of_birth: '1985-05-15',
  },
];

// Test cases data
const testCases = [
  {
    id: '323e4567-e89b-12d3-a456-426614174000',
    title: 'Test Case 1',
    description: 'This is a test case for E2E testing',
    status: 'open',
    priority: 'medium',
    assigned_user_id: '123e4567-e89b-12d3-a456-426614174000',
    client_id: '223e4567-e89b-12d3-a456-426614174000',
  },
  {
    id: '323e4567-e89b-12d3-a456-426614174001',
    title: 'High Priority Case',
    description: 'Urgent case requiring immediate attention',
    status: 'open',
    priority: 'high',
    assigned_user_id: '123e4567-e89b-12d3-a456-426614174002',
    client_id: '223e4567-e89b-12d3-a456-426614174001',
  },
];

/**
 * Create database connection
 */
async function createDbConnection() {
  const client = new Client(dbConfig);
  await client.connect();
  return client;
}

/**
 * Clean all test data from database
 */
async function cleanDatabase() {
  const client = await createDbConnection();
  
  try {
    console.log('Cleaning test database...');
    
    // Clean tables in reverse order to respect foreign keys
    await client.query('DELETE FROM case_notes');
    await client.query('DELETE FROM documents');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM cases');
    await client.query('DELETE FROM clients');
    await client.query('DELETE FROM users');
    
    console.log('Test database cleaned successfully');
    return null;
  } catch (error) {
    console.error('Failed to clean database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Seed database with test data
 */
async function seedDatabase() {
  const client = await createDbConnection();
  
  try {
    console.log('Seeding test database...');
    
    // Insert test users
    for (const user of testUsers) {
      await client.query(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.role, user.is_active]);
    }
    
    // Insert test clients
    for (const client_data of testClients) {
      await client.query(`
        INSERT INTO clients (id, first_name, last_name, email, phone, address, date_of_birth, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [client_data.id, client_data.first_name, client_data.last_name, client_data.email, client_data.phone, client_data.address, client_data.date_of_birth]);
    }
    
    // Insert test cases
    for (const case_data of testCases) {
      await client.query(`
        INSERT INTO cases (id, title, description, status, priority, assigned_user_id, client_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, [case_data.id, case_data.title, case_data.description, case_data.status, case_data.priority, case_data.assigned_user_id, case_data.client_id]);
    }
    
    console.log('Test database seeded successfully');
    return null;
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Create a specific test user
 */
async function createTestUser(userData) {
  const client = await createDbConnection();
  
  try {
    console.log('Creating test user:', userData.email);
    
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
    `, [
      userData.id || require('crypto').randomUUID(),
      userData.email,
      userData.password_hash || '$2b$10$example.hash.for.testing',
      userData.first_name,
      userData.last_name,
      userData.role,
      userData.is_active !== undefined ? userData.is_active : true
    ]);
    
    console.log('Test user created successfully');
    return null;
  } catch (error) {
    console.error('Failed to create test user:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Get test data by type
 */
async function getTestData(type) {
  const client = await createDbConnection();
  
  try {
    let query = '';
    switch (type) {
      case 'users':
        query = 'SELECT * FROM users ORDER BY created_at';
        break;
      case 'clients':
        query = 'SELECT * FROM clients ORDER BY created_at';
        break;
      case 'cases':
        query = 'SELECT * FROM cases ORDER BY created_at';
        break;
      default:
        throw new Error(`Unknown test data type: ${type}`);
    }
    
    const result = await client.query(query);
    return result.rows;
  } catch (error) {
    console.error(`Failed to get test data for ${type}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  cleanDatabase,
  seedDatabase,
  createTestUser,
  getTestData,
};