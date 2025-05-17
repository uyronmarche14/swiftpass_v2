-- Create sections table with proper structure
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    year TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sections_code ON sections(code);
CREATE INDEX IF NOT EXISTS idx_sections_year ON sections(year);

-- Enable RLS for security
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS admin_sections_all ON sections;
DROP POLICY IF EXISTS student_sections_select ON sections;
DROP POLICY IF EXISTS authenticated_sections_all ON sections;

-- IMPORTANT: This policy allows any authenticated user to access sections
-- This is needed for development but can be restricted later
CREATE POLICY authenticated_sections_all ON sections
    FOR ALL USING (auth.role() = 'authenticated');
    
-- More specific policies for production use
CREATE POLICY admin_sections_all ON sections
    FOR ALL USING (
        EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
    );
    
CREATE POLICY student_sections_select ON sections
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM students WHERE id = auth.uid())
    );
    
-- Insert default sections if none exist
INSERT INTO sections (name, code, year)
SELECT 'Section A2024', 'A2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections LIMIT 1);

INSERT INTO sections (name, code, year)
SELECT 'Section B2024', 'B2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE code = 'B2024');

INSERT INTO sections (name, code, year)
SELECT 'Section C2024', 'C2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE code = 'C2024');

-- Insert default sections if none exist
INSERT INTO sections (name, code, year)
SELECT 'Section A2024', 'A2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections LIMIT 1);

INSERT INTO sections (name, code, year)
SELECT 'Section B2024', 'B2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE code = 'B2024');

INSERT INTO sections (name, code, year)
SELECT 'Section C2024', 'C2024', '2024'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE code = 'C2024');
