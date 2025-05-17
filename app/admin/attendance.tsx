import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { supabase } from "../../lib/supabase";
import DropDownPicker from "react-native-dropdown-picker";

export default function AttendanceScreen() {
  const { isAdmin, isLoading } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [labs, setLabs] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);
  
  // Filter states
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");
  const [openLabPicker, setOpenLabPicker] = useState(false);
  const [openStudentPicker, setOpenStudentPicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [attendance, selectedLab, selectedStudent, dateFilter]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // Load attendance records with related data
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id,
          time_in,
          time_out,
          students:student_id (id, full_name, student_id, section, course),
          labs:lab_id (id, name, subject_id, subjects:subject_id(name, code))
        `)
        .order("time_in", { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
      setFilteredAttendance(data || []);

      // Load labs for filtering
      const { data: labsData, error: labsError } = await supabase
        .from("labs")
        .select(`
          id,
          name,
          subjects:subject_id(name, code)
        `)
        .order("name", { ascending: true });

      if (labsError) throw labsError;
      setLabs(labsData || []);

      // Load students for filtering
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, full_name, student_id")
        .order("full_name", { ascending: true });

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error loading attendance data:", error);
      Alert.alert("Error", "Failed to load attendance data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...attendance];

    // Apply lab filter
    if (selectedLab) {
      filtered = filtered.filter(record => record.lab_id === selectedLab);
    }

    // Apply student filter
    if (selectedStudent) {
      filtered = filtered.filter(record => record.student_id === selectedStudent);
    }

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.time_in).toLocaleDateString();
        return recordDate.includes(dateFilter);
      });
    }

    setFilteredAttendance(filtered);
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

  const handleUpdateTimeOut = async (id: string) => {
    try {
      setIsLoadingData(true);
      
      // Update time_out to current timestamp
      const { error } = await supabase
        .from("attendance")
        .update({ time_out: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      
      Alert.alert("Success", "Time-out recorded successfully");
      await loadData(); // Refresh data
    } catch (error) {
      console.error("Error updating time-out:", error);
      Alert.alert("Error", "Failed to record time-out");
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetFilters = () => {
    setSelectedLab(null);
    setSelectedStudent(null);
    setDateFilter("");
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadData}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filters</Text>
        
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Lab:</Text>
            <DropDownPicker
              open={openLabPicker}
              value={selectedLab}
              items={labs.map(lab => ({
                label: `${lab.name} ${lab.subjects?.code ? `(${lab.subjects.code})` : ''}`,
                value: lab.id
              }))}
              setOpen={setOpenLabPicker}
              setValue={setSelectedLab}
              placeholder="Select Lab"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>
          
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Student:</Text>
            <DropDownPicker
              open={openStudentPicker}
              value={selectedStudent}
              items={students.map(student => ({
                label: `${student.full_name} (${student.student_id})`,
                value: student.id
              }))}
              setOpen={setOpenStudentPicker}
              setValue={setSelectedStudent}
              placeholder="Select Student"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              listMode="SCROLLVIEW"
              zIndex={2000}
              zIndexInverse={2000}
            />
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Date:</Text>
            <TextInput
              style={styles.input}
              value={dateFilter}
              onChangeText={setDateFilter}
              placeholder="Enter date (MM/DD/YYYY)"
            />
          </View>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetFilters}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statText}>
          Showing {filteredAttendance.length} of {attendance.length} records
        </Text>
      </View>

      {filteredAttendance.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={64}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.emptyText}>No attendance records found</Text>
          <Text style={styles.emptySubText}>
            Try adjusting your filters or add new records using the QR scanner
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAttendance}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.attendanceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.studentIcon}>
                  <Ionicons name="person" size={20} color="#fff" />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {item.students?.full_name || "Unknown Student"}
                  </Text>
                  <Text style={styles.studentId}>
                    {item.students?.student_id || "No ID"}
                  </Text>
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
                    <Ionicons name="exit-outline" size={18} color={item.time_out ? Colors.light.success : Colors.light.error} />
                    <Text style={styles.timeLabel}>Time-out:</Text>
                    <Text style={styles.timeValue}>
                      {item.time_out ? formatDateTime(item.time_out) : "Not Recorded"}
                    </Text>
                  </View>
                </View>
                
                {!item.time_out && (
                  <TouchableOpacity
                    style={styles.timeOutButton}
                    onPress={() => handleUpdateTimeOut(item.id)}
                  >
                    <Text style={styles.timeOutButtonText}>Record Time-out</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  filtersContainer: {
    padding: 16,
    backgroundColor: Colors.light.background,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: Colors.light.text,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
    zIndex: 1000,
  },
  filterItem: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: Colors.light.text,
  },
  dropdown: {
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownContainer: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  input: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButton: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.error,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 18,
  },
  resetButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  statRow: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundAlt,
  },
  statText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  studentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  studentInfo: {
    marginLeft: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
  },
  studentId: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  cardContent: {
    padding: 16,
  },
  labSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  labName: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  timeSection: {
    marginBottom: 16,
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
  timeOutButton: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  timeOutButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
