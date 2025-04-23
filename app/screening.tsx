import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { router } from "expo-router";
import { useState } from "react";

interface StudentData {
  id: string;
  name: string;
  studentId: string;
  course: string;
  year: string;
  status: "Authorized" | "Unauthorized";
}

export default function ScreeningScreen() {
  const [studentData, setStudentData] = useState<StudentData>({
    id: "1",
    name: "John Doe",
    studentId: "STU123456",
    course: "Computer Science",
    year: "2024",
    status: "Authorized",
  });

  const handleApprove = () => {
    // Handle approval logic here
    console.log("Student approved");
    router.back();
  };

  const handleReject = () => {
    // Handle rejection logic here
    console.log("Student rejected");
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Student Screening</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="person-circle"
              size={24}
              color={Colors.light.tint}
            />
            <Text style={styles.cardTitle}>Student Information</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.infoContainer}>
            <InfoRow label="Name" value={studentData.name} />
            <InfoRow label="Student ID" value={studentData.studentId} />
            <InfoRow label="Course" value={studentData.course} />
            <InfoRow label="Year" value={studentData.year} />
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      studentData.status === "Authorized"
                        ? "#4CAF50"
                        : "#F44336",
                  },
                ]}
              >
                <Text style={styles.statusText}>{studentData.status}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color={Colors.light.tint} />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.activityContainer}>
            <ActivityRow time="09:00 AM" action="Entered Computer Lab" />
            <ActivityRow time="11:30 AM" action="Exited Computer Lab" />
            <ActivityRow time="02:00 PM" action="Entered Physics Lab" />
            <ActivityRow time="04:30 PM" action="Exited Physics Lab" />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ActivityRow = ({ time, action }: { time: string; action: string }) => (
  <View style={styles.activityRow}>
    <Text style={styles.activityTime}>{time}</Text>
    <Text style={styles.activityAction}>{action}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.tint,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#eee",
  },
  infoContainer: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  activityContainer: {
    padding: 16,
  },
  activityRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  activityTime: {
    width: 80,
    fontSize: 14,
    color: "#666",
  },
  activityAction: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
