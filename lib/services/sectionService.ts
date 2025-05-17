/**
 * SectionService - Handles all section-related operations
 * 
 * This service manages interactions with the sections table and
 * ensures proper data handling for section management functionality.
 */

import { supabase } from "../supabase";

export interface Section {
  id: string;
  name: string;
  code: string;
  year?: string | null;
  created_at?: string;
}

export interface SectionResponse {
  success: boolean;
  error?: string;
  data?: Section | Section[];
  notice?: string; // Optional message to display to the user
}

// Local storage key for sections cache
const SECTIONS_STORAGE_KEY = 'swiftpass_sections_cache';

// Helper functions for local storage
const getLocalSections = (): Section[] => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const sectionsJson = localStorage.getItem(SECTIONS_STORAGE_KEY);
    return sectionsJson ? JSON.parse(sectionsJson) : [];
  } catch (e) {
    console.error('Error retrieving sections from local storage:', e);
    return [];
  }
};

const saveLocalSections = (sections: Section[]): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
  } catch (e) {
    console.error('Error saving sections to local storage:', e);
  }
};

export class SectionService {
  /**
   * Get all sections
   */
  static async getAllSections(): Promise<SectionResponse> {
    try {
      // First try to get sections using our RPC function (bypasses RLS)
      try {
        console.log("Fetching sections with RPC function...");
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_sections');
        
        if (!rpcError && rpcData) {
          console.log("Successfully retrieved sections via RPC");
          
          // Convert from JSONB to array of Section objects
          const sectionsArray = Array.isArray(rpcData) ? rpcData : [];
          
          // Save to local storage for offline use
          saveLocalSections(sectionsArray as Section[]);
          
          return {
            success: true,
            data: sectionsArray as Section[]
          };
        }
        
        console.log("RPC function failed, trying direct query", rpcError);
      } catch (rpcErr) {
        console.log("RPC function not available, trying direct query", rpcErr);
      }
      
      // If RPC failed, try direct database query
      const { data, error } = await supabase
        .from("sections")
        .select('*')
        .order('name');
      
      if (error) {
        // Handle table not existing or RLS errors
        if (error.code === '42P01' || error.code === '42501') {
          console.log(`Database error (${error.code}), trying to create table...`);
          
          // Try to create the table using our function
          try {
            const { error: createError } = await supabase.rpc('create_sections_table');
            if (!createError) {
              console.log("Table created successfully, retrying query...");
              
              // Retry the query now that the table exists
              const { data: retryData, error: retryError } = await supabase
                .from("sections")
                .select('*')
                .order('name');
              
              if (!retryError && retryData) {
                console.log("Retrieved sections after creating table");
                saveLocalSections(retryData as Section[]);
                
                return {
                  success: true,
                  data: retryData as Section[]
                };
              }
            }
          } catch (createErr) {
            console.log("Error creating table:", createErr);
          }
          
          // If we still have issues, fall back to local storage
          console.log("Using local storage as fallback");
          const localSections = getLocalSections();
          
          if (localSections.length > 0) {
            return {
              success: true,
              data: localSections,
              notice: "Using locally stored sections due to database connection issues"
            };
          }
          
          // Last resort - default sections
          const defaultSections = [
            { 
              id: Math.random().toString(36).substring(2, 15), 
              name: "Section A2024", 
              code: "A2024", 
              year: "2024",
              created_at: new Date().toISOString() 
            },
            { 
              id: Math.random().toString(36).substring(2, 15), 
              name: "Section B2024", 
              code: "B2024", 
              year: "2024",
              created_at: new Date().toISOString() 
            },
            { 
              id: Math.random().toString(36).substring(2, 15), 
              name: "Section C2024", 
              code: "C2024", 
              year: "2024",
              created_at: new Date().toISOString() 
            },
          ];
          
          saveLocalSections(defaultSections);
          return {
            success: true,
            data: defaultSections,
            notice: "Using default sections (database connection issues)"
          };
        }
        
        throw error;
      }
      
      // Successful database query
      console.log("Successfully retrieved sections via direct query");
      saveLocalSections(data as Section[]);
      
      return {
        success: true,
        data: data as Section[]
      };
    } catch (error: any) {
      console.error("Error fetching sections:", error);
      
      // Last resort - try local storage
      const localSections = getLocalSections();
      if (localSections.length > 0) {
        return {
          success: true,
          data: localSections,
          notice: "Using local data (error with database connection)"
        };
      }
      
      return {
        success: false,
        error: error.message || "Failed to fetch sections"
      };
    }
  }
  
  /**
   * Get a section by ID
   */
  static async getSectionById(id: string): Promise<SectionResponse> {
    try {
      // Try to find in local storage first for speed
      const localSections = getLocalSections();
      const localSection = localSections.find(s => s.id === id);
      
      if (localSection) {
        return {
          success: true,
          data: localSection
        };
      }
      
      // If not in local storage, try database
      const { data, error } = await supabase
        .from("sections")
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        return {
          success: false,
          error: "Section not found"
        };
      }
      
      return {
        success: true,
        data: data as Section
      };
    } catch (error: any) {
      console.error(`Error fetching section with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || "Failed to fetch section"
      };
    }
  }
  
  /**
   * Create a new section
   */
  static async createSection(sectionData: {
    name: string;
    code: string;
    year?: string;
  }): Promise<SectionResponse> {
    try {
      // Validate section data
      if (!sectionData.name || !sectionData.code) {
        return {
          success: false,
          error: "Section name and code are required"
        };
      }
      
      console.log("Creating new section:", sectionData);
      
      // 1. First try creating using the RPC function (best option - bypasses RLS)
      try {
        console.log("Creating section with RPC function...");
        const { data: rpcData, error: rpcError } = await supabase.rpc('add_section', {
          section_name: sectionData.name,
          section_code: sectionData.code,
          section_year: sectionData.year || null
        });
        
        // Log detailed response to help with debugging
        console.log("RPC response:", { rpcData, rpcError });
        
        if (rpcError) {
          // If error contains a message property, check if it's a duplicate
          const errorMessage = (rpcError as any).message || '';
          if (errorMessage.includes('already exists')) {
            return {
              success: false,
              error: `Section with code ${sectionData.code} already exists`
            };
          }
          
          // For other errors, we'll try the next approach
          console.log("RPC error, trying direct insert:", rpcError);
          throw rpcError; // This will be caught by the outer try/catch
        }
        
        if (rpcData && typeof rpcData === 'object' && !('error' in rpcData)) {
          console.log("Section created with RPC successfully:", rpcData);
          
          // Save to local storage for offline access
          const localSections = getLocalSections();
          localSections.push(rpcData as Section);
          saveLocalSections(localSections);
          
          return {
            success: true,
            data: rpcData as Section
          };
        } else {
          console.log("RPC returned unexpected data format:", rpcData);
          throw new Error("Invalid response format from RPC");
        }
      } catch (rpcError) {
        // RPC failed, we'll try direct insert next
        console.log("RPC method failed, falling back to direct insert", rpcError);
      }
      
      // 2. Try to create the table first if it doesn't exist
      try {
        await supabase.rpc('create_sections_table');
      } catch (tableErr) {
        console.log("Table creation attempted but failed or table already exists:", tableErr);
      }
      
      // 3. Try direct insert as a fallback
      try {
        console.log("Attempting direct insert to sections table...");
        const { data, error } = await supabase
          .from("sections")
          .insert([{
            name: sectionData.name,
            code: sectionData.code,
            year: sectionData.year || null
          }])
          .select();
        
        if (error) {
          // Special case for duplicate key
          if (error.code === '23505') {
            return {
              success: false,
              error: `Section with code ${sectionData.code} already exists`
            };
          }
          
          // Log the full error for debugging
          console.error("Direct insert error:", { 
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Section created successfully via direct insert:", data[0]);
          
          // Update local storage
          const localSections = getLocalSections();
          localSections.push(data[0] as Section);
          saveLocalSections(localSections);
          
          return {
            success: true,
            data: data[0] as Section
          };
        }
        
        // This should rarely happen
        throw new Error("Insert succeeded but no data returned");
      } catch (insertError: any) {
        console.error("All database methods failed:", insertError);
        
        // If this is an RLS policy error, we should tell the user to run the SQL scripts
        if (insertError.code === '42501') {
          return {
            success: false,
            error: "Permission denied. Please run the section_functions.sql script in your Supabase SQL editor to enable section management."
          };
        }
        
        // For other errors, return a clear message
        return {
          success: false,
          error: `Database error: ${insertError.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      console.error("Unexpected top-level error creating section:", error);
      return {
        success: false,
        error: error.message || "Failed to create section"
      };
    }
  }
}
