/**
 * Global setup for integration tests
 * This runs once before all integration tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  console.log('🔧 Setting up integration test environment...');

  try {
    // Start test database containers
    console.log('📦 Starting test database containers...');
    await execAsync('docker-compose -f docker-compose.test.yml up -d --wait');

    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Verify database connection
    console.log('🔍 Verifying database connection...');
    await execAsync('docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U test_user -d case_management_test');

    // Verify Redis connection
    console.log('🔍 Verifying Redis connection...');
    await execAsync('docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli ping');

    console.log('✅ Integration test environment setup complete');

  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    
    // Cleanup on failure
    try {
      await execAsync('docker-compose -f docker-compose.test.yml down -v');
    } catch (cleanupError) {
      console.error('Failed to cleanup after setup failure:', cleanupError);
    }
    
    throw error;
  }
}