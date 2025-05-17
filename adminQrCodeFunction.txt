  // Generate a special admin QR code that bypasses schedule checks
  const getAdminQRCode = async (): Promise<string | null> => {
    try {
      if (!user || !isAdmin) {
        console.error("Error: Only admins can generate admin QR codes");
        return null;
      }

      // Create admin information
      const now = new Date();
      
      // For faculty accounts with non-UUID IDs, we need to generate a valid UUID
      // Check if the user ID is a valid UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isValidUuid = typeof user.id === 'string' && uuidPattern.test(user.id);
      
      // Generate a valid UUID for database operations if needed
      // Faculty IDs like "faculty-d.abesamis" are not valid UUIDs
      const dbSafeId = isValidUuid ? user.id : crypto.randomUUID();
      
      console.log(`Admin ID: ${user.id}, Using database ID: ${dbSafeId}`);
      
      // Create the QR code data
      const adminData = {
        userId: user.id,          // Original ID (for verification)
        dbId: dbSafeId,          // UUID for database (if different)
        name: adminProfile?.full_name || "Administrator",
        role: adminProfile?.role || "admin",
        email: user.email,
        timestamp: now.toISOString(),
        is_admin: true,
        admin_override: true,     // Special flag to bypass schedule checks
        privilege_level: 100,     // High privilege level for admins
        expiry: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour validity
        generated_at: now.toISOString(),
      };
      
      // First try to find existing QR code by student_id if it's a valid UUID
      let existingQrCode = null;
      let qrError = null;
      
      if (isValidUuid) {
        // If the ID is a valid UUID, we can query directly
        const { data, error } = await supabase
          .from("qr_codes")
          .select("*")
          .eq("student_id", user.id)
          .maybeSingle();
          
        existingQrCode = data;
        qrError = error;
      } else {
        // For non-UUID IDs (faculty), we need to search all QR codes and compare
        const { data: allQrCodes, error } = await supabase
          .from("qr_codes")
          .select("*");
          
        qrError = error;
        
        if (!error && allQrCodes) {
          // Find any QR code with matching admin email
          for (const qrCode of allQrCodes) {
            try {
              // Parse the QR data
              const qrData = typeof qrCode.qr_data === 'string' 
                ? JSON.parse(qrCode.qr_data)
                : qrCode.qr_data;
                
              // If this QR code has the same email, it's for this admin
              if (qrData && qrData.email === user.email) {
                existingQrCode = qrCode;
                break;
              }
            } catch (e) {
              console.error("Error parsing QR data:", e);
            }
          }
        }
      }
      
      // Handle any query errors
      if (qrError && qrError.code !== "PGRST116") {
        console.error("Error checking for existing QR code:", qrError);
        // Continue anyway - we'll try to create a new one
      }
      
      // Update or create the QR code
      if (existingQrCode) {
        console.log("Updating existing admin QR code");
        
        const { error: updateError } = await supabase
          .from("qr_codes")
          .update({
            qr_data: adminData,
            updated_at: now.toISOString(),
          })
          .eq("id", existingQrCode.id);
          
        if (updateError) {
          console.error("Error updating QR code:", updateError);
          throw new Error("Error updating QR code: " + updateError.message);
        }
      } else {
        console.log("Creating new admin QR code");
        
        // Create a new QR code using the valid UUID for the student_id field
        const { error: insertError } = await supabase.from("qr_codes").insert([
          {
            student_id: dbSafeId,  // Always use a valid UUID here
            qr_data: adminData,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          },
        ]);
        
        if (insertError) {
          console.error("Error creating QR code:", insertError);
          throw new Error("Error creating QR code: " + insertError.message);
        }
      }
      
      // Return the serialized QR code data
      return JSON.stringify(adminData);
    } catch (error) {
      console.error("Admin QR code generation error:", error);
      return null;
    }
  };
