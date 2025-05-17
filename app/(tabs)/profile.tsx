import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { CustomModal } from "../../components/ui/Modal";
import EditProfileModal from "../../components/ui/EditProfileModal";
import { SectionService } from "../../lib/services/sectionService";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const { user, logout, isLoading, userProfile, updateProfile } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "info" as "error" | "success" | "warning" | "info",
  });
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [sections, setSections] = useState<Array<{label: string, value: string}>>([]);
  const [courses, setCourses] = useState<Array<{label: string, value: string}>>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  useEffect(() => {
    // Load sections and courses when component mounts
    loadFormOptions();
    
    // Debug log the lab schedule info
    if (userProfile?.lab_schedule) {
      const scheduleKeys = Object.keys(userProfile.lab_schedule);
      console.log("Lab schedule days:", scheduleKeys);

      scheduleKeys.forEach((day) => {
        const labs = userProfile.lab_schedule?.[day];
        console.log(`Labs for ${day}:`, labs);
      });
    } else {
      console.log("No lab schedule available in userProfile");
    }
  }, [userProfile]);
  
  // Load section options from database
  const loadFormOptions = async () => {
    setIsLoadingOptions(true);
    try {
      // Load sections from SectionService
      const sectionsResponse = await SectionService.getAllSections();
      if (sectionsResponse.success && sectionsResponse.data) {
        // Ensure we have an array by handling both single item and array cases
        const sectionsArray = Array.isArray(sectionsResponse.data) 
          ? sectionsResponse.data 
          : [sectionsResponse.data];
          
        const sectionOptions = sectionsArray.map((section: any) => ({
          label: section.name,
          value: section.code
        }));
        setSections(sectionOptions);
        console.log("Loaded sections for profile edit:", sectionOptions.length);
      }
      
      // Load courses from subjects table
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
        
      if (!subjectsError && subjectsData) {
        const courseOptions = subjectsData.map(subject => ({
          label: subject.name,
          value: subject.name
        }));
        setCourses(courseOptions);
        console.log("Loaded courses for profile edit:", courseOptions.length);
      }
    } catch (error) {
      console.error("Error loading form options:", error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      setModalConfig({
        title: "Error",
        message: "Failed to logout. Please try again.",
        type: "error",
      });
      setModalVisible(true);
    }
  };

  const handleEditProfile = () => {
    // Make sure options are loaded before showing the modal
    if (sections.length === 0 || courses.length === 0) {
      loadFormOptions();
    }
    setIsEditProfileModalVisible(true);
  };

  const handleSaveProfile = async (profileData: any) => {
    try {
      const success = await updateProfile(profileData);
      
      if (success) {
        setModalConfig({
          title: "Success",
          message: "Your profile has been updated successfully.",
          type: "success",
        });
        setModalVisible(true);
        return true;
      } else {
        setModalConfig({
          title: "Error",
          message: "Failed to update profile. Please try again.",
          type: "error",
        });
        setModalVisible(true);
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setModalConfig({
        title: "Error",
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
      setModalVisible(true);
      return false;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: "https://res.cloudinary.com/ddnxfpziq/image/upload/v1746457773/security-shield--crime-security-security-shield_kgo0w9.png",
            }}
            style={styles.profileImage}
          />
        </View>
        <Text style={styles.name}>{user?.full_name || "Student"}</Text>
        <Text style={styles.course}>{user?.course || "Course"}</Text>
        
        <TouchableOpacity 
          style={styles.editButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color={Colors.light.primary} />
            <Text style={styles.infoText}>{user?.email || "Email"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="school" size={20} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              {user?.student_id || "Student ID"}
            </Text>
          </View>
          {user?.phone_number && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{user.phone_number}</Text>
            </View>
          )}
          {user?.address && (
            <View style={styles.infoRow}>
              <Ionicons name="home" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{user.address}</Text>
            </View>
          )}
          {user?.emergency_contact && (
            <View style={styles.infoRow}>
              <Ionicons name="medkit" size={20} color={Colors.light.primary} />
              <Text style={styles.infoText}>{user.emergency_contact}</Text>
            </View>
          )}
        </View>
      </View>
      
      {user?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.card}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lab Schedule</Text>
        <View style={styles.card}>
          {userProfile?.lab_schedule &&
          Object.keys(userProfile.lab_schedule).length > 0 ? (
            Object.entries(userProfile.lab_schedule).map(([day, schedules]) => (
              <View key={day} style={styles.scheduleRow}>
                <Text style={styles.dayText}>{day}</Text>
                <View style={styles.scheduleDetailsContainer}>
                  {Array.isArray(schedules) && schedules.length > 0 ? (
                    schedules.map((schedule, index) => (
                      <View key={index} style={styles.scheduleDetails}>
                        <Text style={styles.scheduleText}>
                          {schedule.name}{" "}
                          {schedule.section && `(Section ${schedule.section})`}
                        </Text>
                        <Text style={styles.scheduleTimeText}>
                          {schedule.start_time} - {schedule.end_time}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.scheduleText}>No labs on this day</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noScheduleText}>No lab schedule available</Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={Colors.light.background} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
      
      <EditProfileModal
        visible={isEditProfileModalVisible}
        onClose={() => setIsEditProfileModalVisible(false)}
        initialData={{
          full_name: userProfile?.full_name || '',
          student_id: userProfile?.student_id || '',
          course: userProfile?.course || '',
          section: userProfile?.section || '',
          phone_number: userProfile?.phone_number || '',
          address: userProfile?.address || '',
          emergency_contact: userProfile?.emergency_contact || '',
          bio: userProfile?.bio || ''
        }}
        onSave={handleSaveProfile}
        courseOptions={courses}
        sectionOptions={sections}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 60,
    height: 60,
    tintColor: Colors.light.background,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  course: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  infoText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  bioText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  dayText: {
    width: 80,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  scheduleDetailsContainer: {
    flex: 1,
  },
  scheduleDetails: {
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  scheduleTimeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  noScheduleText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    padding: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    margin: 24,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.light.primaryDark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
