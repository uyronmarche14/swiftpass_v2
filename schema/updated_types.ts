/**
 * SwiftPass Database TypeScript Definitions
 * 
 * This file defines the TypeScript types that match the SQL schema structure
 * for proper type safety throughout the application.
 */

import { createClient } from '@supabase/supabase-js';

export interface DatabaseSchema {
  // Students table
  students: {
    id: string;
    email: string;
    full_name: string;
    student_id: string;
    course?: string | null;
    section?: string | null;
    phone_number?: string | null;
    address?: string | null;
    emergency_contact?: string | null;
    bio?: string | null;
    created_at: string;
    updated_at: string;
  };
  
  // Admins table
  admins: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  
  // Subjects table (courses)
  subjects: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    created_at: string;
  };
  
  // Labs table
  labs: {
    id: string;
    name: string;
    section?: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
    subject_id: string;
    created_at: string;
  };
  
  // Student_labs junction table
  student_labs: {
    id: string;
    student_id: string;
    lab_id: string;
    created_at: string;
  };
  
  // Attendance records table
  attendance: {
    id: string;
    student_id: string;
    lab_id: string;
    time_in: string;
    time_out?: string | null;
    created_at: string;
  };
  
  // QR codes table
  qr_codes: {
    id: string;
    student_id: string;
    qr_data: {
      userId: string;
      studentId: string;
      name: string;
      course?: string;
      section?: string;
      created: string;
      timestamp?: string;
      currentDay?: string;
      currentTime?: string;
      labId?: string | null;
      currentLab?: {
        id?: string;
        name?: string;
        time?: string;
        day?: string;
      } | null;
      enrolledLabs?: Array<{
        id: string;
        name: string;
        day: string;
        time: string;
      }>;
    };
    created_at: string;
    updated_at: string;
  };
}

export type Tables = keyof DatabaseSchema;
export type TableColumns<T extends Tables> = keyof DatabaseSchema[T];

/**
 * Type-safe Supabase query builder
 */
export function typedSupabaseQuery<T extends Tables>(
  supabase: ReturnType<typeof createClient>,
  table: T
) {
  return supabase.from(table as string);
}

/**
 * Required tables for the system to function
 */
export const REQUIRED_TABLES: Tables[] = [
  'students',
  'admins',
  'subjects', // Note: This is the "courses" table in the application
  'labs',
  'student_labs',
  'attendance',
  'qr_codes'
];
