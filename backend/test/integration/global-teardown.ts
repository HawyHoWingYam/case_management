/**
 * Global teardown for integration tests
 * This runs once after all integration tests complete
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalTeardown() {
  console.log('🧹 Cleaning up integration test environment...');

  try {
    // Stop and remove test containers
    console.log('🛑 Stopping test containers...');
    await execAsync('docker-compose -f docker-compose.test.yml down -v');

    // Clean up any leftover volumes
    console.log('🗑️ Cleaning up volumes...');
    await execAsync('docker volume prune -f');

    console.log('✅ Integration test environment cleanup complete');

  } catch (error) {
    console.error('❌ Failed to cleanup integration test environment:', error);
    // Don't throw here as it's cleanup - log and continue
  }
}