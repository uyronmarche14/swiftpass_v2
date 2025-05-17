/**
 * SwiftPass Database Schema Validator
 * 
 * This utility validates and repairs the database schema to ensure
 * all necessary tables and fields exist for proper functioning.
 */

import { supabase } from '../lib/supabase';
import { REQUIRED_TABLES } from './database_schema';

export interface ValidationResult {
  valid: boolean;
  missingTables: string[];
  error?: string;
}

/**
 * Validates the database schema, checking if required tables exist
 */
export async function validateDatabaseSchema(): Promise<ValidationResult> {
  try {
    console.log('Validating database schema...');
    
    const missingTables: string[] = [];
    
    // Check each required table
    for (const table of REQUIRED_TABLES) {
      console.log(`Checking table: ${table}`);
      
      // Try to select a single row to verify table exists
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') { // PostgreSQL code for undefined_table
        console.error(`Missing table: ${table}`, error);
        missingTables.push(table);
      } else if (error) {
        console.warn(`Error checking table ${table}:`, error);
        // Other errors might be permission related, not necessarily missing table
      }
    }
    
    const valid = missingTables.length === 0;
    console.log(`Schema validation ${valid ? 'passed' : 'failed'}`);
    
    return { valid, missingTables };
  } catch (error) {
    console.error('Database schema validation failed:', error);
    return { 
      valid: false, 
      missingTables: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Tries to fix common schema issues
 */
export async function repairDatabaseSchema(): Promise<boolean> {
  try {
    const validationResult = await validateDatabaseSchema();
    
    if (validationResult.valid) {
      console.log('Database schema is valid, no repairs needed');
      return true;
    }
    
    console.log('Attempting to repair database schema...');
    
    // Here's where we would execute schema migration scripts
    // In a production environment, you'd want to use a proper migration system
    // For this example, we're just suggesting to run the SQL script manually
    
    console.log('Please execute the SQL script at schema/init_database.sql');
    console.log('You may need admin privileges to execute this script');
    
    // In the future, we could add automatic repair for tables we have permission to create
    
    return false;
  } catch (error) {
    console.error('Database schema repair failed:', error);
    return false;
  }
}

/**
 * Ensures the user profile table exists and has the current user
 * This is especially important for authentication
 */
export async function ensureUserProfileExists(userId: string, email: string): Promise<boolean> {
  try {
    // Check if the user exists in the students table
    const { data: existingUser, error: checkError } = await supabase
      .from('students')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!checkError && existingUser) {
      console.log('User profile exists');
      return true;
    }
    
    // Profile doesn't exist, try to create it
    console.log('Creating user profile...');
    
    const { error: insertError } = await supabase
      .from('students')
      .insert([{
        id: userId,
        email: email,
        full_name: email.split('@')[0], // Temporary name
        student_id: `TEMP-${Date.now().toString().slice(-6)}`, // Temporary ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    
    if (insertError) {
      console.error('Failed to create user profile:', insertError);
      return false;
    }
    
    console.log('User profile created successfully');
    return true;
  } catch (error) {
    console.error('Error ensuring user profile exists:', error);
    return false;
  }
}
