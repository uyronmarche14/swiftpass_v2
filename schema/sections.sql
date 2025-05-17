-- Create sections table for SwiftPass
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    year TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sections_code ON sections(code);

-- RLS policies
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage sections
DROP POLICY IF EXISTS admin_sections_all ON sections;
CREATE POLICY admin_sections_all ON sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
    
-- Allow students to view sections
DROP POLICY IF EXISTS student_sections_select ON sections;
CREATE POLICY student_sections_select ON sections
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM students WHERE id = auth.uid())
    );

-- Insert default sections if none exist
INSERT INTO sections (name, code, year)
SELECT 'Section A2021', 'A2021', '2021'
WHERE NOT EXISTS (SELECT 1 FROM sections LIMIT 1);

INSERT INTO sections (name, code, year)
SELECT 'Section B2021', 'B2021', '2021'
WHERE NOT EXISTS (SELECT 1 FROM sections LIMIT 1);

INSERT INTO sections (name, code, year)
SELECT 'Section C2021', 'C2021', '2021'
WHERE NOT EXISTS (SELECT 1 FROM sections LIMIT 1);
