-- SwiftPass Database Initialization Script
-- This script creates all tables needed for the SwiftPass application

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  course TEXT,
  section TEXT,
  phone_number TEXT,
  address TEXT,
  emergency_contact TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lab_schedule JSONB
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- Labs Table
CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  section TEXT,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_labs_subject_id ON labs(subject_id);
CREATE INDEX IF NOT EXISTS idx_labs_day_of_week ON labs(day_of_week);

-- Student Labs Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS student_labs (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (student_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_student_labs_student_id ON student_labs(student_id);
CREATE INDEX IF NOT EXISTS idx_student_labs_lab_id ON student_labs(lab_id);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIMESTAMP WITH TIME ZONE NOT NULL,
  time_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_lab_id ON attendance_records(lab_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- QR Codes Table
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  qr_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_student_id ON qr_codes(student_id);

-- Row Level Security Policies
-- These policies control who can access which rows

-- Allow students to read their own data
CREATE POLICY student_select_own ON students
  FOR SELECT USING (auth.uid() = id);

-- Allow students to update their own data
CREATE POLICY student_update_own ON students
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to read all student data
CREATE POLICY admin_select_students ON students
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Allow admins to update all student data
CREATE POLICY admin_update_students ON students
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- QR codes access policies
CREATE POLICY qr_code_select_own ON qr_codes
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Attendance records policies
CREATE POLICY attendance_select_own ON attendance_records
  FOR SELECT USING (
    student_id = auth.uid() OR
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- Default admin account (remove in production)
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@swiftpass.edu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admins (id, email, full_name, role)
VALUES ('00000000-0000-0000-0000-000000000000', 'admin@swiftpass.edu', 'System Administrator', 'admin')
ON CONFLICT (id) DO NOTHING;
