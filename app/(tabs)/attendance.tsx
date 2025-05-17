import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { supabase } from "../../lib/supabase";

export default function StudentAttendanceScreen() {
  const { user, isLoading } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadAttendanceData();
    }
  }, [user]);

  const loadAttendanceData = async () => {
    if (!user?.id) return;
    
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          time_in,
          time_out,
          labs:lab_id (
            id, 
            name, 
            day_of_week,
            start_time,
            end_time,
            subjects:subject_id(id, name, code)
          )
        `)
        .eq("student_id", user.id)
        .order("time_in", { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      Alert.alert("Error", "Failed to load your attendance records");
    } finally {
      setIsLoadingData(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `${formattedDate} at ${formattedTime}`;
  };

  const getAttendanceStatus = (item: any) => {
    // If no time_out, show as "In Progress"
    if (!item.time_out) {
      return {
        status: "In Progress",
        color: Colors.light.warning,
        icon: "time-outline" as const
      };
    }
    
    // Calculate duration
    const timeIn = new Date(item.time_in);
    const timeOut = new Date(item.time_out);
    const durationMs = timeOut.getTime() - timeIn.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    
    // If duration is less than 30 minutes, consider it incomplete
    if (durationMinutes < 30) {
      return {
        status: "Incomplete",
        color: Colors.light.error,
        icon: "alert-circle-outline" as const
      };
    }
    
    // Complete attendance
    return {
      status: "Complete",
      color: Colors.light.success,
      icon: "checkmark-circle-outline" as const
    };
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading your attendance records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Attendance</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadAttendanceData}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{attendance.length}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {attendance.filter(item => getAttendanceStatus(item).status === "Complete").length}
          </Text>
          <Text style={styles.statLabel}>Complete</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {attendance.filter(item => !item.time_out).length}
          </Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
      </View>

      {attendance.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No attendance records found</Text>
          <Text style={styles.emptySubText}>
            You haven't checked in to any labs yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={attendance}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const attendanceStatus = getAttendanceStatus(item);
            
            return (
              <View style={styles.attendanceCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: attendanceStatus.color }]}>
                    <Ionicons name={attendanceStatus.icon} size={16} color="#fff" />
                    <Text style={styles.statusText}>{attendanceStatus.status}</Text>
                  </View>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.labSection}>
                    <Ionicons name="flask-outline" size={18} color={Colors.light.primary} />
                    <Text style={styles.labName}>
                      {item.labs?.name || "Unknown Lab"} 
                      {item.labs?.subjects?.code ? ` (${item.labs.subjects.code})` : ""}
                    </Text>
                  </View>
                  
                  <View style={styles.timeSection}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={18} color={Colors.light.success} />
                      <Text style={styles.timeLabel}>Time-in:</Text>
                      <Text style={styles.timeValue}>
                        {formatDateTime(item.time_in)}
                      </Text>
                    </View>
                    
                    <View style={styles.timeRow}>
                      <Ionicons 
                        name="exit-outline" 
                        size={18} 
                        color={item.time_out ? Colors.light.success : Colors.light.error} 
                      />
                      <Text style={styles.timeLabel}>Time-out:</Text>
                      <Text style={styles.timeValue}>
                        {item.time_out ? formatDateTime(item.time_out) : "Not Recorded"}
                      </Text>
                    </View>
                  </View>

                  {item.labs && (
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.light.textSecondary} />
                        <Text style={styles.detailLabel}>Day:</Text>
                        <Text style={styles.detailValue}>{item.labs.day_of_week}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
                        <Text style={styles.detailLabel}>Schedule:</Text>
                        <Text style={styles.detailValue}>
                          {item.labs.start_time} - {item.labs.end_time}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.attendanceList}
        />
      )}
    </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.text,
  },
  refreshButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  attendanceList: {
    padding: 16,
    paddingBottom: 100,
  },
  attendanceCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
  },
  cardContent: {
    padding: 16,
    paddingTop: 4,
  },
  labSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  labName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginLeft: 8,
  },
  timeSection: {
    marginBottom: 12,
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginLeft: 8,
    width: 70,
  },
  timeValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
  detailSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 6,
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
