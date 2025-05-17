/**
 * SwiftPass Database Schema Definition
 * 
 * This file defines the structure of the database tables required by the SwiftPass application.
 */

import { createClient } from '@supabase/supabase-js';

export interface DatabaseSchema {
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
    lab_schedule?: Record<string, any[]> | null;
  };
  
  admins: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  
  courses: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
  };
  
  labs: {
    id: string;
    name: string;
    subject_id: string;
    section?: string | null;
    day_of_week: string;
    start_time: string;
    end_time: string;
    location?: string | null;
    created_at: string;
    updated_at: string;
  };
  
  student_labs: {
    student_id: string;
    lab_id: string;
    created_at: string;
  };
  
  attendance_records: {
    id: string;
    student_id: string;
    lab_id: string;
    date: string;
    time_in: string;
    time_out?: string | null;
    status: 'present' | 'late' | 'excused' | 'absent';
    notes?: string | null;
    created_at: string;
    updated_at: string;
  };
  
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
    };
    created_at: string;
    updated_at: string;
  };
}

export type Tables = keyof DatabaseSchema;
export type TableColumns<T extends Tables> = keyof DatabaseSchema[T];

/**
 * Type utility to help with type safety when using database queries
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
  'courses',
  'labs',
  'student_labs',
  'attendance_records',
  'qr_codes'
];
