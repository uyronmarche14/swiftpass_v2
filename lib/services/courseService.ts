/**
 * CourseService - Handles all course/subject related operations
 * 
 * This service manages interactions with the subjects table (courses)
 * and ensures proper data handling for course management functionality.
 */

import { supabase } from "../supabase";

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  created_at: string;
}

export interface CourseResponse {
  success: boolean;
  error?: string;
  data?: Course | Course[];
}

export class CourseService {
  // Table name - try subjects first, then courses as fallback
  private static getPrimaryTableName(): string {
    return 'subjects';
  }
  
  private static getFallbackTableName(): string {
    return 'courses';
  }
  /**
   * Get all courses
   */
  static async getAllCourses(): Promise<CourseResponse> {
    try {
      console.log("Fetching all courses");
      
      // Try subjects table first
      try {
        const { data, error } = await supabase
          .from(this.getPrimaryTableName())
          .select('*')
          .order('name');
        
        if (error) {
          console.error("Error fetching from subjects table:", error);
          throw error; // Try courses table as fallback
        }
        
        console.log("Successfully fetched courses from subjects table");
        return {
          success: true,
          data: data as Course[]
        };
      } catch (subjectError) {
        // Try courses table as fallback
        console.warn("Failed to fetch from subjects table, trying courses table");
        
        const { data: courseData, error: courseError } = await supabase
          .from(this.getFallbackTableName())
          .select('*')
          .order('name');
        
        if (courseError) {
          console.error("Error fetching from courses table:", courseError);
          return {
            success: false,
            error: courseError.message
          };
        }
        
        console.log("Successfully fetched courses from courses table");
        return {
          success: true,
          data: courseData as Course[]
        };
      }
    } catch (error: any) {
      console.error("Unexpected error fetching courses:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch courses"
      };
    }
  }
  
  /**
   * Get a course by ID
   */
  static async getCourseById(id: string): Promise<CourseResponse> {
    try {
      // Try the primary table first
      try {
        const { data, error } = await supabase
          .from(this.getPrimaryTableName())
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          // Try the fallback table
          throw error;
        }
        
        return {
          success: true,
          data: data as Course
        };
      } catch (primaryError) {
        // Try the fallback table
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from(this.getFallbackTableName())
            .select('*')
            .eq('id', id)
            .single();
            
          if (fallbackError) {
            console.error(`Error fetching course with ID ${id} from fallback table:`, fallbackError);
            return {
              success: false,
              error: fallbackError.message
            };
          }
          
          return {
            success: true,
            data: fallbackData as Course
          };
        } catch (fallbackError) {
          console.error(`Unexpected error fetching course with ID ${id} from fallback table:`, fallbackError);
          return {
            success: false,
            error: 'Failed to fetch course from either table'
          };
        }
      }
      
      // This code will never be reached because we're handling all cases in the try-catch blocks above
      return {
        success: false,
        error: "Unknown error fetching course"
      };
    } catch (error: any) {
      console.error(`Unexpected error fetching course with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || "Failed to fetch course"
      };
    }
  }
  
  /**
   * Create a new course
   */
  static async createCourse(courseData: {
    name: string;
    code: string;
    description?: string;
  }): Promise<CourseResponse> {
    try {
      // Validate course data
      if (!courseData.name || !courseData.code) {
        return {
          success: false,
          error: "Course name and code are required"
        };
      }
      
      console.log("Creating new course:", courseData);
      
      // First check if the subjects table exists
      try {
        // Check if course with this code already exists in subjects table
        const { data: existingSubject, error: subjectCheckError } = await supabase
          .from(this.getPrimaryTableName())
          .select('id')
          .eq('code', courseData.code)
          .single();
        
        if (!subjectCheckError && existingSubject) {
          return {
            success: false,
            error: `Course with code ${courseData.code} already exists in subjects table`
          };
        }
        
        // Create course in subjects table
        const { data: newSubjectData, error: subjectError } = await supabase
          .from(this.getPrimaryTableName())
          .insert([{
            name: courseData.name,
            code: courseData.code,
            description: courseData.description || null,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (subjectError) {
          console.error("Error creating course in subjects table:", subjectError);
          throw subjectError;
        }
        
        console.log("Successfully created course in subjects table");
        return {
          success: true,
          data: newSubjectData as Course
        };
      } catch (subjectError) {
        // If subjects table failed, try the courses table as fallback
        console.warn("Failed to use subjects table, trying courses table");
        
        try {
          const { data: existingCourse, error: courseCheckError } = await supabase
            .from(this.getFallbackTableName())
            .select('id')
            .eq('code', courseData.code)
            .single();
          
          if (!courseCheckError && existingCourse) {
            return {
              success: false,
              error: `Course with code ${courseData.code} already exists in courses table`
            };
          }
          
          // Create the course in courses table as fallback
          const { data: newCourseData, error: courseError } = await supabase
            .from(this.getFallbackTableName())
            .insert([{
              name: courseData.name,
              code: courseData.code,
              description: courseData.description || null,
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
          
          if (courseError) {
            console.error("Error creating course in courses table:", courseError);
            throw courseError;
          }
          
          console.log("Successfully created course in courses table");
          return {
            success: true,
            data: newCourseData as Course
          };
        } catch (courseError: any) {
          console.error("Error creating course in courses table:", courseError);
          return {
            success: false,
            error: courseError.message || "Failed to create course in courses table"
          };
        }
      }
      
      // This code is unreachable because the try-catch above handles all cases
      // But we'll keep it for safety
      return {
        success: false,
        error: "Unknown error creating course"
      };
    } catch (error: any) {
      console.error("Unexpected error creating course:", error);
      return {
        success: false,
        error: error.message || "Failed to create course"
      };
    }
  }
  
  /**
   * Update an existing course
   */
  static async updateCourse(id: string, updates: {
    name?: string;
    code?: string;
    description?: string | null;
  }): Promise<CourseResponse> {
    try {
      // Validate that we have some data to update
      if (!updates.name && !updates.code && updates.description === undefined) {
        return {
          success: false,
          error: "No update data provided"
        };
      }
      
      // If updating code, check it doesn't conflict with another course
      if (updates.code) {
        const { data: existingCourse, error: checkError } = await supabase
          .from('subjects')
          .select('id')
          .eq('code', updates.code)
          .neq('id', id)
          .single();
        
        if (!checkError && existingCourse) {
          return {
            success: false,
            error: `Another course with code ${updates.code} already exists`
          };
        }
      }
      
      // Update the course
      const { data, error } = await supabase
        .from('subjects')
        .update({
          ...(updates.name && { name: updates.name }),
          ...(updates.code && { code: updates.code }),
          ...(updates.description !== undefined && { description: updates.description })
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating course with ID ${id}:`, error);
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data: data as Course
      };
    } catch (error: any) {
      console.error(`Unexpected error updating course with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || "Failed to update course"
      };
    }
  }
  
  /**
   * Delete a course
   */
  static async deleteCourse(id: string): Promise<CourseResponse> {
    try {
      // Check if there are labs using this course
      const { data: associatedLabs, error: checkError } = await supabase
        .from('labs')
        .select('id')
        .eq('subject_id', id);
      
      if (!checkError && associatedLabs && associatedLabs.length > 0) {
        return {
          success: false,
          error: `Cannot delete course: ${associatedLabs.length} labs are associated with it. Delete the labs first or reassign them.`
        };
      }
      
      // Try to delete from primary table first
      try {
        const { error } = await supabase
          .from(this.getPrimaryTableName())
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        return { success: true };
      } catch (primaryError) {
        // Try fallback table
        try {
          const { error: fallbackError } = await supabase
            .from(this.getFallbackTableName())
            .delete()
            .eq('id', id);
          
          if (fallbackError) {
            console.error(`Error deleting course with ID ${id} from fallback table:`, fallbackError);
            return {
              success: false,
              error: fallbackError.message
            };
          }
          
          return { success: true };
        } catch (fallbackError) {
          console.error(`Unexpected error deleting course with ID ${id}:`, fallbackError);
          return {
            success: false,
            error: 'Failed to delete course from either table'
          };
        }
      }
      
      // This code is unreachable because all cases are handled in the try-catch blocks above
      return {
        success: false,
        error: "Unknown error deleting course"
      };
    } catch (error: any) {
      console.error(`Unexpected error deleting course with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || "Failed to delete course"
      };
    }
  }
  
  /**
   * Get all labs for a course
   */
  static async getCourseLabsById(courseId: string): Promise<CourseResponse> {
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('*')
        .eq('subject_id', courseId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error(`Error fetching labs for course ID ${courseId}:`, error);
        return {
          success: false,
          error: error.message
        };
      }
      
      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error(`Unexpected error fetching labs for course ID ${courseId}:`, error);
      return {
        success: false,
        error: error.message || "Failed to fetch course labs"
      };
    }
  }
  
  /**
   * Initialize default courses if none exist
   */
  static async initializeDefaultCourses(): Promise<boolean> {
    try {
      // Check if any courses exist in primary table
      let coursesExist = false;
      try {
        const { data, error } = await supabase
          .from(this.getPrimaryTableName())
          .select('id')
          .limit(1);
        
        if (!error && data && data.length > 0) {
          // Courses exist in primary table, no need to initialize
          coursesExist = true;
        }
      } catch (primaryError) {
        console.warn("Error checking primary table, will try fallback", primaryError);
      }
      
      // If no courses in primary table, check fallback table
      if (!coursesExist) {
        try {
          const { data, error } = await supabase
            .from(this.getFallbackTableName())
            .select('id')
            .limit(1);
          
          if (!error && data && data.length > 0) {
            // Courses exist in fallback table, no need to initialize
            coursesExist = true;
          }
        } catch (fallbackError) {
          console.warn("Error checking fallback table", fallbackError);
        }
      }
      
      // If courses already exist, no need to initialize
      if (coursesExist) {
        return true;
      }
      
      // Create default courses
      const defaultCourses = [
        {
          name: 'Computer Science',
          code: 'CS101',
          description: 'Introduction to Computer Science'
        },
        {
          name: 'Engineering',
          code: 'ENG101',
          description: 'Basic Engineering Principles'
        },
        {
          name: 'Mathematics',
          code: 'MATH101',
          description: 'Calculus and Analysis'
        }
      ];
      
      // Try inserting into primary table first
      try {
        const { error: insertError } = await supabase
          .from(this.getPrimaryTableName())
          .insert(defaultCourses);
        
        if (insertError) {
          throw insertError;
        }
        
        console.log("Default courses initialized successfully in primary table");
        return true;
      } catch (primaryError) {
        console.warn("Failed to initialize courses in primary table, trying fallback", primaryError);
        
        // Try fallback table
        try {
          const { error: fallbackError } = await supabase
            .from(this.getFallbackTableName())
            .insert(defaultCourses);
          
          if (fallbackError) {
            console.error("Error initializing default courses in fallback table:", fallbackError);
            return false;
          }
          
          console.log("Default courses initialized successfully in fallback table");
          return true;
        } catch (fallbackError) {
          console.error("Failed to initialize courses in either table", fallbackError);
          return false;
        }
      }
      
      // This code will never be reached because we're handling all cases in the try-catch blocks above
      return false;
    } catch (error) {
      console.error("Unexpected error initializing default courses:", error);
      return false;
    }
  }
}
