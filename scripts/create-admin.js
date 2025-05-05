/**
 * This script creates or fixes the admin account credentials.
 * Run with: node scripts/create-admin.js
 */

// Import required modules
const { createClient } = require("@supabase/supabase-js");

// Read environment variables or use defaults
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://gvmrqjyyeruszhlddprq.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bXJxanl5ZXJ1c3pobGRkcHJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MDczMzUsImV4cCI6MjA2MTM4MzMzNX0.WM2wftomZif174G4CrfSu6gd-GoGuU55LTiLEf9jwdw";

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminAccount() {
  console.log("Creating/fixing admin account...");

  try {
    // Try to create a new admin account using signUp
    const { data, error } = await supabase.auth.signUp({
      email: "admin@swiftpass.edu",
      password: "Admin123!",
      options: {
        data: {
          full_name: "System Administrator",
          role: "super_admin",
        },
      },
    });

    if (error) {
      console.error("Error creating admin account:", error.message);

      // If already exists, try signing in
      if (error.message.includes("already exists")) {
        console.log("Admin account already exists, trying to sign in...");

        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: "admin@swiftpass.edu",
            password: "Admin123!",
          });

        if (signInError) {
          console.error(
            "Failed to sign in with existing admin account:",
            signInError.message
          );
          process.exit(1);
        } else {
          console.log("Successfully signed in with admin account!");
          console.log("Admin user ID:", signInData.user.id);

          // Create admin record in the admins table if it doesn't exist
          await createAdminRecord(signInData.user.id);

          console.log("Admin account is now working properly.");
          process.exit(0);
        }
      } else {
        process.exit(1);
      }
    } else {
      console.log("Successfully created new admin account!");
      console.log("Admin user ID:", data.user.id);

      // Create admin record in the admins table
      await createAdminRecord(data.user.id);

      console.log("New admin account created successfully.");
      process.exit(0);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

async function createAdminRecord(userId) {
  console.log("Creating admin record in admins table...");

  try {
    // First check if the record already exists
    const { data: existingData, error: existingError } = await supabase
      .from("admins")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existingError && existingData) {
      console.log("Admin record already exists in the admins table.");
      return;
    }

    // Create the admin record
    const { error } = await supabase.from("admins").insert([
      {
        id: userId,
        email: "admin@swiftpass.edu",
        full_name: "System Administrator",
        role: "super_admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Failed to create admin record:", error.message);
    } else {
      console.log("Admin record created successfully in admins table.");
    }
  } catch (err) {
    console.error("Error creating admin record:", err);
  }
}

// Execute the script
createAdminAccount();
