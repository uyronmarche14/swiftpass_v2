import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { useState } from "react";

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string;
  timeOut: string;
  lab: string;
  status: "Present" | "Late" | "Absent";
}

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState<string>("2024-04-18");

  // Mock data - replace with actual API call
  const mockAttendanceData: AttendanceRecord[] = [
    {
      id: "1",
      date: "2024-04-18",
      timeIn: "09:00 AM",
      timeOut: "11:30 AM",
      lab: "Computer Lab",
      status: "Present",
    },
    {
      id: "2",
      date: "2024-04-17",
      timeIn: "10:15 AM",
      timeOut: "12:45 PM",
      lab: "Physics Lab",
      status: "Late",
    },
    {
      id: "3",
      date: "2024-04-16",
      timeIn: "08:45 AM",
      timeOut: "11:15 AM",
      lab: "Computer Lab",
      status: "Present",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "#4CAF50";
      case "Late":
        return "#FFC107";
      case "Absent":
        return "#F44336";
      default:
        return Colors.light.text;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={24} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Attendance Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerText}>Date</Text>
            <Text style={styles.headerText}>Time In</Text>
            <Text style={styles.headerText}>Time Out</Text>
            <Text style={styles.headerText}>Lab</Text>
            <Text style={styles.headerText}>Status</Text>
          </View>

          {mockAttendanceData.map((record) => (
            <View key={record.id} style={styles.tableRow}>
              <Text style={styles.cellText}>{record.date}</Text>
              <Text style={styles.cellText}>{record.timeIn}</Text>
              <Text style={styles.cellText}>{record.timeOut}</Text>
              <Text style={styles.cellText}>{record.lab}</Text>
              <View
                style={[
                  styles.statusCell,
                  { backgroundColor: getStatusColor(record.status) },
                ]}
              >
                <Text style={styles.statusText}>{record.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.tint,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.light.tint,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    flex: 1,
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cellText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  statusCell: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
