-- Create a function to create the sections table if it doesn't exist
CREATE OR REPLACE FUNCTION create_sections_table()
RETURNS void AS $$
BEGIN
    -- Check if the sections table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'sections'
    ) THEN
        -- Create the sections table
        CREATE TABLE public.sections (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            year TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX idx_sections_code ON public.sections(code);
        
        -- RLS policies
        ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
        
        -- Allow admins to manage sections
        CREATE POLICY admin_sections_all ON public.sections
            FOR ALL USING (
                EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
            );
            
        -- Allow students to view sections
        CREATE POLICY student_sections_select ON public.sections
            FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.students WHERE id = auth.uid())
            );
    END IF;
END;
$$ LANGUAGE plpgsql;
