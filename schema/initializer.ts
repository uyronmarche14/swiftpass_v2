/**
 * SwiftPass Database Schema Initializer
 * 
 * This utility provides functions to initialize, validate, and repair
 * the database schema. It specifically targets fixing authentication issues.
 */

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateDatabaseSchema, repairDatabaseSchema } from './validator';

/**
 * Fixes the authentication session issues by cleaning up stale sessions
 * and ensuring proper session handling
 */
export async function fixAuthSessionMissingError(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    console.log('Attempting to fix auth session issues...');
    
    // 1. Clear any potentially corrupted local storage
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    
    // 2. Check if we have a session and it's valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return {
        success: false,
        message: `Session error: ${sessionError.message}`
      };
    }
    
    if (!session) {
      console.log('No active session found, user needs to log in again');
      return {
        success: true,
        message: 'Session cleared. You need to log in again.'
      };
    }
    
    // 3. If we have a valid session, ensure it's properly stored
    // Store the session in AsyncStorage for backup
    await AsyncStorage.setItem('session', JSON.stringify(session));
    
    // 4. Test refreshing the session
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session refresh error:', error);
        // Continue anyway, it might be fixable by user login
      } else if (data && data.session) {
        console.log('Session refreshed successfully');
        await AsyncStorage.setItem('session', JSON.stringify(data.session));
      }
    } catch (refreshError) {
      console.error('Refresh error:', refreshError);
      // Continue anyway
    }
    
    return {
      success: true,
      message: 'Authentication session has been repaired.'
    };
  } catch (error) {
    console.error('Auth session fix error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Initializes the database with proper schema and fixes auth issues
 */
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  schemaValid: boolean;
}> {
  try {
    // First fix any auth session issues
    const authFix = await fixAuthSessionMissingError();
    
    // Then validate the database schema
    const schemaValidation = await validateDatabaseSchema();
    
    if (!schemaValidation.valid) {
      console.warn('Schema validation failed:', schemaValidation.missingTables);
      
      // Try to repair the schema
      const repaired = await repairDatabaseSchema();
      
      if (!repaired) {
        return {
          success: false,
          message: `Database schema is invalid. Missing tables: ${schemaValidation.missingTables.join(', ')}. Please run the SQL initialization script.`,
          schemaValid: false
        };
      }
    }
    
    return {
      success: true,
      message: authFix.message,
      schemaValid: schemaValidation.valid
    };
  } catch (error) {
    console.error('Database initialization error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      schemaValid: false
    };
  }
}

/**
 * Ensures all required tables exist for a specific user
 * This is especially useful after a user logs in to make
 * sure their profile data exists
 */
export async function ensureUserData(userId: string, email: string): Promise<boolean> {
  try {
    // 1. Make sure the basic schema is valid
    const { valid } = await validateDatabaseSchema();
    
    if (!valid) {
      console.error('Schema validation failed, cannot ensure user data');
      return false;
    }
    
    // 2. Check if user exists in students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    // 3. Create user profile if not exists
    if (studentError || !student) {
      console.log('Creating student profile...');
      
      // Generate a temporary student ID
      const tempStudentId = `TEMP-${Date.now().toString().slice(-6)}`;
      
      // Create the profile
      const { error: insertError } = await supabase
        .from('students')
        .insert([{
          id: userId,
          email: email,
          full_name: email.split('@')[0], // Temporary name from email
          student_id: tempStudentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      
      if (insertError) {
        console.error('Failed to create student profile:', insertError);
        return false;
      }
    }
    
    // 4. Check if QR code exists for the user
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('student_id', userId)
      .single();
    
    // 5. Create QR code if not exists
    if (qrError || !qrCode) {
      console.log('Creating QR code...');
      
      // Get the student data
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (studentData) {
        // Create QR code data
        const qrData = {
          userId: userId,
          studentId: studentData.student_id,
          name: studentData.full_name,
          course: studentData.course || 'Not Specified',
          section: studentData.section || 'Not Specified',
          created: new Date().toISOString(),
        };
        
        // Insert the QR code
        const { error: insertQrError } = await supabase
          .from('qr_codes')
          .insert([{
            student_id: userId,
            qr_data: qrData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        
        if (insertQrError) {
          console.error('Failed to create QR code:', insertQrError);
          // Continue anyway, QR code can be created later
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user data:', error);
    return false;
  }
}
