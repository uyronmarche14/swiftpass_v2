-- Function 1: Create the sections table if it doesn't exist
-- Drop the function first to avoid the return type error
DROP FUNCTION IF EXISTS create_sections_table();

CREATE FUNCTION create_sections_table()
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
  
  -- Create policies
  DROP POLICY IF EXISTS authenticated_sections_all ON sections;
  CREATE POLICY authenticated_sections_all ON sections
    FOR ALL USING (auth.role() = 'authenticated');
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sections table: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Add a section (bypasses RLS)
-- Drop function first to avoid return type errors
DROP FUNCTION IF EXISTS add_section(TEXT, TEXT, TEXT);

CREATE FUNCTION add_section(
  section_name TEXT,
  section_code TEXT,
  section_year TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  new_section JSONB;
BEGIN
  -- Create the table if it doesn't exist
  PERFORM create_sections_table();
  
  -- Check if section code already exists
  IF EXISTS (SELECT 1 FROM sections WHERE code = section_code) THEN
    RAISE EXCEPTION 'Section with code % already exists', section_code;
  END IF;

  -- Insert the new section
  INSERT INTO sections (name, code, year)
  VALUES (section_name, section_code, section_year)
  RETURNING to_jsonb(sections.*) INTO new_section;
  
  RETURN new_section;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating section: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Update a section (bypasses RLS)
-- Drop function first to avoid return type errors
DROP FUNCTION IF EXISTS update_section(UUID, TEXT, TEXT, TEXT);

CREATE FUNCTION update_section(
  section_id UUID,
  section_name TEXT DEFAULT NULL,
  section_code TEXT DEFAULT NULL,
  section_year TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  updated_section JSONB;
  current_section RECORD;
BEGIN
  -- Get the current section
  SELECT * INTO current_section FROM sections WHERE id = section_id;
  
  -- Check if section exists
  IF current_section IS NULL THEN
    RAISE EXCEPTION 'Section with ID % does not exist', section_id;
  END IF;
  
  -- Check if the new code already exists (only if changing the code)
  IF section_code IS NOT NULL AND section_code != current_section.code THEN
    IF EXISTS (SELECT 1 FROM sections WHERE code = section_code) THEN
      RAISE EXCEPTION 'Section with code % already exists', section_code;
    END IF;
  END IF;

  -- Update the section
  UPDATE sections
  SET 
    name = COALESCE(section_name, name),
    code = COALESCE(section_code, code),
    year = COALESCE(section_year, year),
    updated_at = NOW()
  WHERE id = section_id
  RETURNING to_jsonb(sections.*) INTO updated_section;
  
  RETURN updated_section;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error updating section: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Delete a section (bypasses RLS)
-- Drop function first to avoid return type errors
DROP FUNCTION IF EXISTS delete_section(UUID);

CREATE FUNCTION delete_section(
  section_id UUID
) RETURNS JSONB AS $$
DECLARE
  deleted_section JSONB;
BEGIN
  -- Check if section exists
  IF NOT EXISTS (SELECT 1 FROM sections WHERE id = section_id) THEN
    RAISE EXCEPTION 'Section with ID % does not exist', section_id;
  END IF;

  -- Delete the section
  DELETE FROM sections
  WHERE id = section_id
  RETURNING to_jsonb(sections.*) INTO deleted_section;
  
  RETURN deleted_section;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error deleting section: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Get all sections (bypasses RLS)
-- Drop function first to avoid return type errors
DROP FUNCTION IF EXISTS get_all_sections();

CREATE FUNCTION get_all_sections()
RETURNS JSONB AS $$
DECLARE
  sections_data JSONB;
BEGIN
  -- Create the table if it doesn't exist
  PERFORM create_sections_table();
  
  -- Get all sections
  SELECT jsonb_agg(to_jsonb(s)) INTO sections_data FROM sections s ORDER BY s.name;
  
  -- If no sections, initialize with defaults
  IF sections_data IS NULL THEN
    -- Insert default sections
    INSERT INTO sections (name, code, year)
    VALUES
      ('Section A2024', 'A2024', '2024'),
      ('Section B2024', 'B2024', '2024'),
      ('Section C2024', 'C2024', '2024');
      
    -- Get the sections again
    SELECT jsonb_agg(to_jsonb(s)) INTO sections_data FROM sections s ORDER BY s.name;
  END IF;
  
  RETURN sections_data;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error getting sections: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment to explain the function
COMMENT ON FUNCTION add_section IS 'Adds a new section with the given name, code, and year. Bypasses RLS for admin functionality.';

-- Create a function to update sections
CREATE OR REPLACE FUNCTION update_section(
  section_id UUID,
  section_name TEXT DEFAULT NULL,
  section_code TEXT DEFAULT NULL,
  section_year TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  updated_section JSONB;
  current_section RECORD;
BEGIN
  -- Get the current section
  SELECT * INTO current_section FROM sections WHERE id = section_id;
  
  -- Check if section exists
  IF current_section IS NULL THEN
    RAISE EXCEPTION 'Section with ID % does not exist', section_id;
  END IF;
  
  -- Check if the new code already exists (only if changing the code)
  IF section_code IS NOT NULL AND section_code != current_section.code THEN
    IF EXISTS (SELECT 1 FROM sections WHERE code = section_code) THEN
      RAISE EXCEPTION 'Section with code % already exists', section_code;
    END IF;
  END IF;

  -- Update the section
  UPDATE sections
  SET 
    name = COALESCE(section_name, name),
    code = COALESCE(section_code, code),
    year = COALESCE(section_year, year),
    updated_at = NOW()
  WHERE id = section_id
  RETURNING to_jsonb(sections.*) INTO updated_section;
  
  RETURN updated_section;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error updating section: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to delete sections
CREATE OR REPLACE FUNCTION delete_section(
  section_id UUID
) RETURNS JSONB AS $$
DECLARE
  deleted_section JSONB;
BEGIN
  -- Check if section exists
  IF NOT EXISTS (SELECT 1 FROM sections WHERE id = section_id) THEN
    RAISE EXCEPTION 'Section with ID % does not exist', section_id;
  END IF;

  -- Delete the section
  DELETE FROM sections
  WHERE id = section_id
  RETURNING to_jsonb(sections.*) INTO deleted_section;
  
  RETURN deleted_section;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error deleting section: %', SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
