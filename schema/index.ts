/**
 * SwiftPass Schema Module
 * 
 * This is the entry point for the schema module that provides database
 * validation, repair, and authentication error fixing functionality.
 */

// Export the database schema types
export * from './database_schema';

// Export the schema validator functions
export { 
  validateDatabaseSchema, 
  repairDatabaseSchema,
  ensureUserProfileExists
} from './validator';

// Export the schema initializer functions
export {
  fixAuthSessionMissingError,
  initializeDatabase,
  ensureUserData
} from './initializer';

// For conveniences, re-export the main functions with simple names
import { initializeDatabase } from './initializer';
import { validateDatabaseSchema } from './validator';

/**
 * Main entry point for schema checking
 * Call this when the app starts to ensure the database is
 * properly set up and authentication issues are fixed
 */
export async function checkAndFixSchema() {
  const result = await initializeDatabase();
  console.log('Schema check result:', result);
  return result;
}

/**
 * Quick validation function to call before critical operations
 */
export async function isSchemaValid() {
  const { valid } = await validateDatabaseSchema();
  return valid;
}
