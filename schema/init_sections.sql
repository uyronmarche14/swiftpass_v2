-- Function to initialize the sections table
CREATE OR REPLACE FUNCTION init_sections_table()
RETURNS boolean AS $$
BEGIN
    -- Create the sections table if it doesn't exist
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
    
    -- Enable RLS
    ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist to avoid errors
    DROP POLICY IF EXISTS admin_sections_all ON sections;
    DROP POLICY IF EXISTS student_sections_select ON sections;
    
    -- Create policies
    CREATE POLICY admin_sections_all ON sections
        FOR ALL USING (
            EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
        );
        
    CREATE POLICY student_sections_select ON sections
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM students WHERE id = auth.uid())
        );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating sections table: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
