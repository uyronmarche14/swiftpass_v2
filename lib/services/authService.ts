import { supabase } from "../supabase";
import { Alert } from "react-native";

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate input
      if (!email || !password) {
        return {
          success: false,
          error: "Please enter both email and password",
        };
      }

      // First try to authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error details:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        // Check if user exists in the database
        const { data: userExists, error: userCheckError } = await supabase
          .from("students")
          .select("id, email")
          .eq("email", email)
          .single();

        if (userCheckError || !userExists) {
          return {
            success: false,
            error: "User not found. Please register first.",
          };
        }

        if (error.message === "Invalid login credentials") {
          return {
            success: false,
            error: "Invalid password. Please try again.",
          };
        }

        return {
          success: false,
          error: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: "Login failed - no user data",
        };
      }

      // Verify the user exists in our database or create a profile if needed
      try {
        const { UserProfileService } = require("./userProfileService");

        // Extract user metadata or create defaults
        const metadata = data.user.user_metadata || {};

        const profileResult = await UserProfileService.getOrCreateUserProfile({
          id: data.user.id,
          email: data.user.email || "",
          user_metadata: metadata,
        });

        if (profileResult.success) {
          console.log("User profile verified/created during login");
        } else {
          console.warn(
            "Profile check during login had issues:",
            profileResult.error
          );
          // Continue with login anyway
        }
      } catch (profileError) {
        console.warn("Error checking profile during login:", profileError);
        // Continue with login anyway
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session,
        },
      };
    } catch (error: any) {
      console.error("Login process failed:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred",
      };
    }
  }

  static async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: error.message || "Failed to logout",
      };
    }
  }

  // Method to create or fix admin account
  static async createOrFixAdminAccount(): Promise<AuthResponse> {
    try {
      console.log("Attempting to create or fix admin account...");

      // First check if admin exists in auth
      const { data: userData, error: userError } =
        await supabase.auth.signInWithPassword({
          email: "admin@swiftpass.edu",
          password: "Admin123!",
        });

      if (!userError && userData && userData.user) {
        console.log("Admin account exists and credentials are valid");

        // Check if admin record exists in admins table
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", "admin@swiftpass.edu")
          .single();

        if (adminError || !adminData) {
          console.log(
            "Admin record doesn't exist in admins table - creating it"
          );

          // Create admin record
          const { error: insertError } = await supabase.from("admins").insert([
            {
              id: userData.user.id,
              email: "admin@swiftpass.edu",
              full_name: "System Administrator",
              role: "super_admin",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);

          if (insertError) {
            console.error("Failed to create admin record:", insertError);
            return {
              success: false,
              error: "Failed to create admin record in admins table",
            };
          }
        }

        return {
          success: true,
          data: userData,
        };
      }

      // Admin account doesn't exist or credentials are invalid
      console.log(
        "Admin account doesn't exist or credentials are invalid, creating new account"
      );

      // First sign up the admin account
      const { data: signupData, error: signupError } =
        await supabase.auth.signUp({
          email: "admin@swiftpass.edu",
          password: "Admin123!",
          options: {
            data: {
              full_name: "System Administrator",
              role: "super_admin",
            },
          },
        });

      if (signupError) {
        console.error("Failed to create admin account:", signupError);
        return {
          success: false,
          error: signupError.message,
        };
      }

      if (!signupData.user) {
        console.error("Admin account creation returned no user");
        return {
          success: false,
          error: "Admin account creation failed - no user returned",
        };
      }

      console.log("Admin account created in auth system, confirming email...");

      // In a production app, you would handle email confirmation properly
      // For this demo, we'll use admin functions to confirm the email directly
      // Note: This requires admin access to Supabase

      // Create admin record
      const { error: insertError } = await supabase.from("admins").insert([
        {
          id: signupData.user.id,
          email: "admin@swiftpass.edu",
          full_name: "System Administrator",
          role: "super_admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Failed to create admin record:", insertError);
        return {
          success: false,
          error: "Failed to create admin record in admins table",
        };
      }

      console.log("Admin account successfully created");
      return {
        success: true,
        data: signupData,
      };
    } catch (error: any) {
      console.error("Admin account creation error:", error);
      return {
        success: false,
        error: error.message || "Failed to create admin account",
      };
    }
  }

  static async register(userData: {
    email: string;
    password: string;
    fullName: string;
    studentId: string;
    course?: string;
    section?: string;
  }): Promise<AuthResponse> {
    try {
      console.log("Registering user with data:", {
        email: userData.email,
        fullName: userData.fullName,
        studentId: userData.studentId,
        course: userData.course,
        section: userData.section,
      });

      // First check if tables exist
      await this.ensureTablesExist();

      console.log("Starting Supabase auth signup...");
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            student_id: userData.studentId,
            course: userData.course || null,
            section: userData.section || null,
          },
        },
      });

      if (error) {
        console.error("Auth signup error:", error);
        throw error;
      }

      console.log("Supabase auth signup successful:", {
        userId: data.user?.id,
        email: data.user?.email,
      });

      if (!data.user) {
        throw new Error("Registration failed - no user data returned");
      }

      try {
        console.log("Creating student profile in database...");
        // Create student profile - but continue even if this fails
        await this.createStudentProfile(
          data.user.id,
          userData.email,
          userData.fullName,
          userData.studentId,
          userData.course,
          userData.section
        );
        console.log("Student profile creation completed");

        // Create permanent QR code for this user
        await this.createPermanentQRCode(
          data.user.id,
          userData.fullName,
          userData.studentId,
          userData.course,
          userData.section
        );
        console.log("Permanent QR code created");
      } catch (profileError) {
        console.warn(
          "Profile/QR creation error during registration:",
          profileError
        );
        // Continue with registration even if profile creation fails
      }

      console.log("Registration process complete - returning success");
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Failed to register",
      };
    }
  }

  static async ensureTablesExist(): Promise<void> {
    try {
      console.log("Checking if required tables exist...");

      // Check if students table exists
      const { data: studentData, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .limit(1);

      if (studentsError) {
        console.warn(
          "Students table doesn't exist or is not accessible:",
          JSON.stringify(studentsError)
        );
      } else {
        console.log("Students table exists and is accessible");
      }

      // Even if tables don't exist, we'll continue with registration
    } catch (error) {
      console.error("Error checking tables:", JSON.stringify(error));
      // Continue with registration process despite table check errors
    }
  }

  static async createStudentProfile(
    userId: string,
    email: string,
    fullName: string,
    studentId: string,
    course?: string,
    section?: string
  ): Promise<void> {
    try {
      console.log("Creating student profile with data:", {
        userId,
        email,
        fullName,
        studentId,
        course,
        section,
      });

      // Use the UserProfileService instead of direct Supabase calls
      const { UserProfileService } = require("./userProfileService");

      // This handles creation in both tables with better error handling
      const result = await UserProfileService.createUserProfile({
        id: userId,
        email: email,
        user_metadata: {
          full_name: fullName,
          student_id: studentId,
          course: course || null,
          section: section || null,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create profile");
      }

      console.log("Profile created successfully:", result.data);
    } catch (error) {
      console.error("Student profile creation error:", error);

      // Don't throw the error, just log it and continue
      // This allows registration to succeed even if profile creation fails
      // The profile can be created later when the user logs in
      console.warn("Registration will continue despite profile creation error");
    }
  }

  static async createPermanentQRCode(
    userId: string,
    fullName: string,
    studentId: string,
    course?: string,
    section?: string
  ): Promise<boolean> {
    try {
      console.log("Creating permanent QR code for user:", userId);

      // Check if QR code already exists
      const { data: existingQR, error: checkError } = await supabase
        .from("qr_codes")
        .select("id")
        .eq("student_id", userId)
        .single();

      if (!checkError && existingQR) {
        console.log("QR code already exists for this user");
        return true;
      }

      // Create the permanent QR code data
      const qrData = {
        userId: userId,
        studentId: studentId,
        name: fullName,
        course: course || "Not Specified",
        section: section || "Not Specified",
        created: new Date().toISOString(),
      };

      // Insert into qr_codes table
      const { error } = await supabase.from("qr_codes").insert([
        {
          student_id: userId,
          qr_data: qrData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error creating QR code:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to create permanent QR code:", error);
      return false;
    }
  }
}
