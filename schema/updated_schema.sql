-- SwiftPass Updated Database Schema
-- This schema is aligned with the backend 1_schema.sql file
-- and includes all necessary tables for proper functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create students table with simplified required fields
CREATE TABLE IF NOT EXISTS students (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    course TEXT,
    section TEXT,
    phone_number TEXT,
    address TEXT,
    emergency_contact TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create subjects table (courses)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    section TEXT,
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create student_labs table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS student_labs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, lab_id)
);

-- Create attendance table (references labs instead of containing lab_schedule)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE NOT NULL,
    time_in TIMESTAMP WITH TIME ZONE NOT NULL,
    time_out TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create qr_codes table
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    qr_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for improved performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_labs_subject_id ON labs(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_labs_student_id ON student_labs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_labs_lab_id ON student_labs(lab_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lab_id ON attendance(lab_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_student_id ON qr_codes(student_id);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Students policies
CREATE POLICY "Students can view their own data"
    ON students FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Students can update their own data"
    ON students FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all student data"
    ON students FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can update all student data"
    ON students FOR UPDATE
    USING (is_admin());

-- Admins policies
CREATE POLICY "Admins can view their own data"
    ON admins FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can update their own data"
    ON admins FOR UPDATE
    USING (auth.uid() = id);

-- Subjects (Courses) policies
CREATE POLICY "Anyone can view subjects"
    ON subjects FOR SELECT
    USING (true);

CREATE POLICY "Admins can create subjects"
    ON subjects FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update subjects"
    ON subjects FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete subjects"
    ON subjects FOR DELETE
    USING (is_admin());

-- Labs policies
CREATE POLICY "Anyone can view labs"
    ON labs FOR SELECT
    USING (true);

CREATE POLICY "Admins can create labs"
    ON labs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update labs"
    ON labs FOR UPDATE
    USING (is_admin());

CREATE POLICY "Admins can delete labs"
    ON labs FOR DELETE
    USING (is_admin());

-- Student_labs policies
CREATE POLICY "Students can view their own lab enrollments"
    ON student_labs FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can enroll in labs"
    ON student_labs FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can unenroll from labs"
    ON student_labs FOR DELETE
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all lab enrollments"
    ON student_labs FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can manage lab enrollments"
    ON student_labs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can delete lab enrollments"
    ON student_labs FOR DELETE
    USING (is_admin());

-- Attendance policies
CREATE POLICY "Students can view their own attendance"
    ON attendance FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own attendance records"
    ON attendance FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all attendance"
    ON attendance FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can manage attendance"
    ON attendance FOR ALL
    USING (is_admin());

-- QR codes policies
CREATE POLICY "Students can view their own QR codes"
    ON qr_codes FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own QR codes"
    ON qr_codes FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all QR codes"
    ON qr_codes FOR SELECT
    USING (is_admin());

-- Insert a default admin account
-- Note: Using the same ID and credentials as in backend 1_schema.sql
INSERT INTO auth.users (id, email, email_confirmed_at, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@swiftpass.edu',
    NOW(),
    'admin'
) ON CONFLICT (id) DO NOTHING;

-- Set a password for the admin (password: Admin123!)
INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    jsonb_build_object(
        'sub', '00000000-0000-0000-0000-000000000001',
        'email', 'admin@swiftpass.edu'
    ),
    'email',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Link admin user to admins table
INSERT INTO admins (id, email, full_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@swiftpass.edu',
    'System Administrator',
    'super_admin'
) ON CONFLICT (id) DO NOTHING;

-- Create sample courses/subjects for testing
INSERT INTO subjects (id, name, code, description)
VALUES 
    (uuid_generate_v4(), 'Computer Science', 'CS101', 'Introduction to Computer Science'),
    (uuid_generate_v4(), 'Engineering', 'ENG101', 'Basic Engineering Principles'),
    (uuid_generate_v4(), 'Mathematics', 'MATH101', 'Calculus and Analysis')
ON CONFLICT (code) DO NOTHING;
