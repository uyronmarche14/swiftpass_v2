import { supabase } from "../supabase";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id: string;
  course?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileResponse {
  success: boolean;
  error?: string;
  data?: UserProfile;
}

export class UserProfileService {
  static async getUserProfile(userId: string): Promise<ProfileResponse> {
    try {
      console.log(`Attempting to get user profile for user ID: ${userId}`);

      // Try to get from students table (our new structure)
      console.log("Querying students table...");
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", userId)
        .single();

      if (studentError) {
        console.log(
          `Error fetching from students table: ${JSON.stringify(studentError)}`
        );

        // Check if it's a "no rows" error, which could mean the profile doesn't exist yet
        if (studentError.code === "PGRST116") {
          console.log("No profile found for this user ID");
          // Return a not found response
          return {
            success: false,
            error: "User profile not found. It may need to be created.",
          };
        }

        // For other types of errors, return the error message
        return {
          success: false,
          error: studentError.message || "Failed to fetch user profile",
        };
      }

      if (studentData) {
        console.log("Profile found in students table:", {
          id: studentData.id,
          email: studentData.email,
        });

        return {
          success: true,
          data: {
            id: studentData.id,
            email: studentData.email,
            full_name: studentData.full_name,
            student_id: studentData.student_id,
            course: studentData.course,
            created_at: studentData.created_at,
            updated_at: studentData.updated_at || studentData.created_at,
          } as UserProfile,
        };
      }

      // If we get here, no profile was found but there was no error
      return {
        success: false,
        error: "User profile not found",
      };
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch user profile",
      };
    }
  }

  static async createUserProfile(userInfo: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      student_id?: string;
      course?: string;
    };
  }): Promise<ProfileResponse> {
    try {
      console.log("Creating user profile with data:", {
        id: userInfo.id,
        email: userInfo.email,
        metadata: userInfo.user_metadata,
      });

      // Create in students table
      console.log("Creating profile in students table...");
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            id: userInfo.id,
            email: userInfo.email,
            full_name: userInfo.user_metadata?.full_name || "",
            student_id: userInfo.user_metadata?.student_id || "",
            course: userInfo.user_metadata?.course || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (studentError) {
        console.error(
          "Student table insert error details:",
          JSON.stringify(studentError)
        );
        return {
          success: false,
          error: studentError.message || "Failed to create user profile",
        };
      }

      console.log("Created profile in students table successfully");

      return {
        success: true,
        data: studentData as UserProfile,
      };
    } catch (error: any) {
      console.error("Profile creation error:", error?.message || error);
      return {
        success: false,
        error: error?.message || "Failed to create user profile",
      };
    }
  }

  static async getOrCreateUserProfile(userData: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      student_id?: string;
      course?: string;
    };
  }): Promise<ProfileResponse> {
    try {
      // Try to get existing profile
      const profileResponse = await this.getUserProfile(userData.id);

      if (profileResponse.success) {
        return profileResponse;
      }

      // If profile doesn't exist or has an error, create it
      return await this.createUserProfile(userData);
    } catch (error: any) {
      console.error("Profile get/create error:", error);
      return {
        success: false,
        error: error.message || "Failed to get/create user profile",
      };
    }
  }
}
