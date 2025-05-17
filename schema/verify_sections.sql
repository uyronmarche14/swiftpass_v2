-- This script checks and fixes section issues in the database

-- First, check if the sections table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'sections'
) AS sections_table_exists;

-- Check if RPC functions exist
SELECT 
  routine_name,
  routine_schema
FROM information_schema.routines
WHERE routine_name IN ('create_sections_table', 'get_all_sections', 'add_section')
AND routine_schema = 'public';

-- Check content of sections table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sections') THEN
    EXECUTE 'SELECT COUNT(*) FROM sections';
  END IF;
END$$;

-- Recreate all section functions to ensure they work correctly
-- Function 1: Create the sections table if it doesn't exist
DROP FUNCTION IF EXISTS create_sections_table();

CREATE OR REPLACE FUNCTION create_sections_table()
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
  CREATE INDEX IF NOT EXISTS idx_sections_year ON sections(year);
  
  -- Enable RLS
  ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
  
  -- Create policies (ensure authenticated users can access)
  DROP POLICY IF EXISTS authenticated_sections_all ON sections;
  CREATE POLICY authenticated_sections_all ON sections
    FOR ALL USING (true);  -- Allow all operations for now to troubleshoot
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sections table: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Get all sections (with improved error handling)
DROP FUNCTION IF EXISTS get_all_sections();

CREATE OR REPLACE FUNCTION get_all_sections()
RETURNS JSONB AS $$
DECLARE
  sections_data JSONB;
BEGIN
  -- Create the table if it doesn't exist
  PERFORM create_sections_table();
  
  -- Get all sections
  SELECT jsonb_agg(to_jsonb(s)) INTO sections_data FROM sections s ORDER BY s.name;
  
  -- If no sections, initialize with defaults
  IF sections_data IS NULL OR jsonb_array_length(sections_data) = 0 THEN
    -- Insert default sections
    INSERT INTO sections (name, code, year)
    VALUES
      ('Section A2024', 'A2024', '2024'),
      ('Section B2024', 'B2024', '2024'),
      ('Section C2024', 'C2024', '2024');
      
    -- Get the sections again
    SELECT jsonb_agg(to_jsonb(s)) INTO sections_data FROM sections s ORDER BY s.name;
  END IF;
  
  -- Return empty array instead of null
  RETURN COALESCE(sections_data, '[]'::jsonb);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in get_all_sections: %', SQLERRM;
    -- Return error details
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the table and populate default sections
SELECT get_all_sections();

-- Finally, directly query the sections to check they exist
SELECT * FROM sections;
