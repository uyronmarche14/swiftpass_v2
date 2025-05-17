/**
 * SectionService - Handles all section-related operations
 * 
 * This service manages interactions with the sections table and
 * ensures proper data handling for section management functionality.
 */

import { supabase } from "../supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Helper functions for local storage using AsyncStorage for React Native compatibility
const getLocalSections = async (): Promise<Section[]> => {
  try {
    console.log('Retrieving sections from AsyncStorage...');
    const sectionsJson = await AsyncStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!sectionsJson) {
      console.log('No sections found in AsyncStorage');
      return [];
    }
    const sections = JSON.parse(sectionsJson);
    console.log(`Retrieved ${sections.length} sections from AsyncStorage`);
    return sections;
  } catch (e) {
    console.error('Error retrieving sections from AsyncStorage:', e);
    return [];
  }
};

const saveLocalSections = async (sections: Section[]): Promise<void> => {
  try {
    console.log(`Saving ${sections.length} sections to AsyncStorage`);
    await AsyncStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
    console.log('Sections saved successfully to AsyncStorage');
  } catch (e) {
    console.error('Error saving sections to AsyncStorage:', e);
  }
};

export class SectionService {
  /**
   * Get all sections
   */
  static async getAllSections(): Promise<SectionResponse> {
    console.log("===== SECTIONS SERVICE: getAllSections CALLED =====");
    try {
      // DIAGNOSTIC: Test direct database connection first
      console.log("Testing direct database connection to sections table...");
      const { data: directData, error: directError } = await supabase
        .from('sections')
        .select('*')
        .limit(10);
      
      console.log("Direct database query result:", { 
        success: !directError, 
        count: directData?.length || 0,
        error: directError?.message || null
      });

      // Try to get sections from RPC first (most reliable when set up)
      console.log("Attempting to get sections via RPC function...");
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_sections');
      
      // Log RPC results for diagnostics
      console.log("RPC get_all_sections result:", {
        success: !rpcError,
        dataType: rpcData ? typeof rpcData : 'undefined',
        isArray: rpcData && Array.isArray(rpcData),
        count: rpcData && Array.isArray(rpcData) ? rpcData.length : 0,
        error: rpcError?.message || null
      });
      
      // If RPC succeeds and returns data
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        console.log("Successfully loaded sections via RPC");
        
        // Save the sections to AsyncStorage for offline use
        try {
          await saveLocalSections(rpcData);
          console.log("Sections saved to AsyncStorage");
        } catch (storageError) {
          console.warn("Failed to save sections to AsyncStorage:", storageError);
        }
        
        return {
          success: true,
          data: rpcData
        };
      }
      
      // If RPC fails, try direct query
      if (rpcError || !rpcData || !Array.isArray(rpcData) || rpcData.length === 0) {
        console.log("RPC failed or returned no data, trying direct query...");
        
        // If we already have direct data from our diagnostic query, use it
        if (!directError && directData && Array.isArray(directData) && directData.length > 0) {
          console.log("Using direct query data:", directData.length, "sections found");
          
          // Save the sections to AsyncStorage for offline use
          try {
            await saveLocalSections(directData);
            console.log("Direct query sections saved to AsyncStorage");
          } catch (storageError) {
            console.warn("Failed to save sections to AsyncStorage:", storageError);
          }
          
          return {
            success: true,
            data: directData
          };
        }
        
        // If direct query also failed, try insertion with defaults
        console.log("Direct query returned no data, trying to insert defaults...");
        try {
          // Try inserting default sections directly and return them
          const defaultSections = [
            { name: 'Section A2024', code: 'A2024', year: '2024' },
            { name: 'Section B2024', code: 'B2024', year: '2024' },
            { name: 'Section C2024', code: 'C2024', year: '2024' },
            { name: 'Section D2024', code: 'D2024', year: '2024' },
            { name: 'Section E2024', code: 'E2024', year: '2024' }
          ];
          
          // Insert defaults one at a time to handle duplicates
          const insertedSections: Section[] = [];
          
          for (const section of defaultSections) {
            const { data: insertedSection, error: insertError } = await supabase
              .from('sections')
              .insert([section])
              .select()
              .single();
              
            if (!insertError && insertedSection) {
              insertedSections.push(insertedSection as Section);
            } else {
              console.log(`Failed to insert section ${section.code}:`, insertError);
            }
          }
          
          if (insertedSections.length > 0) {
            console.log("Successfully inserted default sections:", insertedSections.length);
            
            // Save the sections to AsyncStorage
            try {
              await saveLocalSections(insertedSections);
              console.log("Default sections saved to AsyncStorage");
            } catch (storageError) {
              console.warn("Failed to save sections to AsyncStorage:", storageError);
            }
            
            return {
              success: true,
              data: insertedSections
            };
          }
        } catch (insertError) {
          console.error("Failed to insert default sections:", insertError);
        }
      }
      
      // If database operations failed, try local storage
      console.log("All database operations failed, falling back to AsyncStorage...");
      const localSections = await getLocalSections();
      
      if (localSections && localSections.length > 0) {
        console.log("Using", localSections.length, "sections from AsyncStorage");
        return {
          success: true,
          data: localSections,
          notice: "Using cached sections from local storage. Database connection failed."
        };
      }
      
      // If local storage is empty too, generate and use default local sections
      console.log("AsyncStorage empty, generating default sections locally...");
      const currentYear = new Date().getFullYear().toString();
      const defaultSections: Section[] = [
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
        {
          id: Math.random().toString(36).substring(2, 15),
          name: "Section D2024",
          code: "D2024",
          year: "2024",
          created_at: new Date().toISOString()
        },
        {
          id: Math.random().toString(36).substring(2, 15),
          name: "Section E2024",
          code: "E2024",
          year: "2024",
          created_at: new Date().toISOString()
        }
      ];
      
      // Save default sections to AsyncStorage
      try {
        await saveLocalSections(defaultSections);
        console.log("Default local sections saved to AsyncStorage");
      } catch (storageError) {
        console.warn("Failed to save default sections to AsyncStorage:", storageError);
      }
      
      return {
        success: true,
        data: defaultSections,
        notice: "Using generated default sections. Database connection failed."
      };
    } catch (error: any) {
      console.error("Unexpected error in getAllSections:", error);
      // Create and return emergency fallback sections
      const emergencySections = [
        {
          id: "emergency-1",
          name: "Section A2024",
          code: "A2024",
          year: "2024",
          created_at: new Date().toISOString()
        },
        {
          id: "emergency-2",
          name: "Section B2024",
          code: "B2024",
          year: "2024",
          created_at: new Date().toISOString()
        }
      ];
      
      return {
        success: true,
        data: emergencySections,
        error: `Database error: ${error.message}`,
        notice: "EMERGENCY: Using hardcoded sections due to critical error."
      };
    }
  }
  
  /**
   * Get a section by ID
   */
  static async getSectionById(id: string): Promise<SectionResponse> {
    try {
      console.log(`Getting section by ID: ${id}`);
      
      // Try to find in local storage first for speed
      try {
        const localSections = await getLocalSections();
        console.log(`Checking among ${localSections.length} local sections`);
        const localSection = localSections.find((s: Section) => s.id === id);
        
        if (localSection) {
          console.log(`Section ${id} found in AsyncStorage`);
          return {
            success: true,
            data: localSection
          };
        }
      } catch (storageError) {
        console.log(`Error accessing AsyncStorage: ${storageError}`);
      }
      
      // If not in local storage, try database
      console.log(`Section ${id} not found locally, checking database...`);
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
          try {
            const localSections = await getLocalSections();
            localSections.push(rpcData as Section);
            await saveLocalSections(localSections);
            console.log("Section saved to AsyncStorage");
          } catch (storageError) {
            console.warn("Could not save section to AsyncStorage:", storageError);
            // We continue anyway since we have the database copy
          }
          
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
        console.log("Creating sections table if it doesn't exist...");
        await supabase.rpc('create_sections_table');
        console.log("Table creation attempted");
      } catch (tableErr) {
        console.log("Table creation error or table already exists:", tableErr);
      }
      
      // 3. Try direct insert as a fallback
      try {
        console.log("Attempting direct insert to sections table...");
        const newSection: Section = {
          id: Math.random().toString(36).substring(2, 15),
          name: sectionData.name,
          code: sectionData.code,
          year: sectionData.year || null,
          created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from("sections")
          .insert([newSection])
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
          try {
            const localSections = await getLocalSections();
            localSections.push(data[0] as Section);
            await saveLocalSections(localSections);
            console.log("Section also saved to AsyncStorage");
          } catch (storageError) {
            console.warn("Could not update AsyncStorage:", storageError);
          }
          
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

  /**
   * Update an existing section
   */
  static async updateSection(id: string, sectionData: {
    name?: string;
    code?: string;
    year?: string;
  }): Promise<SectionResponse> {
    try {
      // Validate section data
      if (!id) {
        return {
          success: false,
          error: "Section ID is required for updates"
        };
      }

      if (!sectionData.name && !sectionData.code && !sectionData.year) {
        return {
          success: false,
          error: "No update data provided"
        };
      }
      
      console.log(`Updating section ${id} with:`, sectionData);
      
      // 1. First try to update using RPC function (bypasses RLS)
      try {
        console.log("Updating section with RPC function...");
        // Build updates with only defined fields
        const updates: any = {};
        if (sectionData.name) updates.name = sectionData.name;
        if (sectionData.code) updates.code = sectionData.code;
        if (sectionData.year) updates.year = sectionData.year;
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_section', {
          section_id: id,
          section_name: sectionData.name || null,
          section_code: sectionData.code || null,
          section_year: sectionData.year || null
        });
        
        if (rpcError) {
          // Check for duplicate error
          const errorMessage = (rpcError as any).message || '';
          if (errorMessage.includes('already exists')) {
            return {
              success: false,
              error: `Section with code ${sectionData.code} already exists`
            };
          }
          
          console.log("RPC error, trying direct update:", rpcError);
          throw rpcError; // Fall through to direct update
        }
        
        if (rpcData && typeof rpcData === 'object' && !('error' in rpcData)) {
          console.log("Section updated with RPC successfully:", rpcData);
          
          // Update local storage
          try {
            const localSections = await getLocalSections();
            const updatedIndex = localSections.findIndex(s => s.id === id);
            
            if (updatedIndex !== -1) {
              localSections[updatedIndex] = {
                ...localSections[updatedIndex],
                ...updates,
                updated_at: new Date().toISOString()
              };
              await saveLocalSections(localSections);
              console.log("Updated section in AsyncStorage");
            }
          } catch (storageError) {
            console.warn("Could not update section in AsyncStorage:", storageError);
          }
          
          return {
            success: true,
            data: rpcData as Section
          };
        }
      } catch (rpcErr) {
        console.log("RPC update failed, falling back to direct update", rpcErr);
      }
      
      // 2. Try direct update if RPC failed
      try {
        console.log("Attempting direct update to section...");
        const updates: any = {};
        if (sectionData.name) updates.name = sectionData.name;
        if (sectionData.code) updates.code = sectionData.code;
        if (sectionData.year) updates.year = sectionData.year;
        updates.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from("sections")
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          // Special case for duplicate key
          if (error.code === '23505') {
            return {
              success: false,
              error: `Section with code ${sectionData.code} already exists`
            };
          }
          
          console.error("Direct update error:", error);
          throw error;
        }
        
        console.log("Section updated successfully via direct update:", data);
        
        // Update local storage
        try {
          const localSections = await getLocalSections();
          const updatedIndex = localSections.findIndex(s => s.id === id);
          
          if (updatedIndex !== -1) {
            localSections[updatedIndex] = {
              ...localSections[updatedIndex],
              ...updates
            };
            await saveLocalSections(localSections);
            console.log("Updated section in AsyncStorage");
          }
        } catch (storageError) {
          console.warn("Could not update section in AsyncStorage:", storageError);
        }
        
        return {
          success: true,
          data: data as Section
        };
      } catch (updateError: any) {
        console.error("All update methods failed:", updateError);
        
        if (updateError.code === '42501') { // Permission denied
          return {
            success: false,
            error: "Permission denied. Please check your RLS policies or run the section_functions.sql script."
          };
        }
        
        return {
          success: false,
          error: `Database error: ${updateError.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      console.error("Unexpected top-level error updating section:", error);
      return {
        success: false,
        error: error.message || "Failed to update section"
      };
    }
  }

  /**
   * Delete a section by ID
   */
  static async deleteSection(id: string): Promise<SectionResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "Section ID is required"
        };
      }
      
      console.log(`Deleting section ${id}...`);
      
      // 1. First try using RPC function (bypasses RLS)
      try {
        console.log("Deleting section with RPC function...");
        const { data: rpcData, error: rpcError } = await supabase.rpc('delete_section', {
          section_id: id
        });
        
        if (rpcError) {
          console.log("RPC delete error, falling back to direct delete:", rpcError);
          throw rpcError;
        }
        
        if (rpcData && typeof rpcData === 'object') {
          console.log("Section deleted with RPC successfully");
          
          // Update local storage
          try {
            const localSections = await getLocalSections();
            const filteredSections = localSections.filter(s => s.id !== id);
            await saveLocalSections(filteredSections);
            console.log("Removed section from AsyncStorage");
          } catch (storageError) {
            console.warn("Could not update AsyncStorage after delete:", storageError);
          }
          
          return {
            success: true,
            data: rpcData as Section
          };
        }
      } catch (rpcErr) {
        console.log("RPC delete failed, falling back to direct delete", rpcErr);
      }
      
      // 2. Try direct delete if RPC failed
      try {
        console.log("Attempting direct delete of section...");
        const { data, error } = await supabase
          .from("sections")
          .delete()
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error("Direct delete error:", error);
          throw error;
        }
        
        console.log("Section deleted successfully via direct delete");
        
        // Update local storage
        try {
          const localSections = await getLocalSections();
          const filteredSections = localSections.filter(s => s.id !== id);
          await saveLocalSections(filteredSections);
          console.log("Removed section from AsyncStorage");
        } catch (storageError) {
          console.warn("Could not update AsyncStorage after delete:", storageError);
        }
        
        return {
          success: true,
          data: data as Section
        };
      } catch (deleteError: any) {
        console.error("All delete methods failed:", deleteError);
        
        if (deleteError.code === '42501') { // Permission denied
          return {
            success: false,
            error: "Permission denied. Please check your RLS policies or run the section_functions.sql script."
          };
        }
        
        return {
          success: false,
          error: `Database error: ${deleteError.message || 'Unknown error'}`
        };
      }
    } catch (error: any) {
      console.error("Unexpected top-level error deleting section:", error);
      return {
        success: false,
        error: error.message || "Failed to delete section"
      };
    }
  }
}
