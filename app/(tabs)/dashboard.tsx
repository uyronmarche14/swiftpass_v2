import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import { CustomButton } from "../../components/ui/CustomButton";
import { QRCodeGenerator } from "../../components/ui/QRCodeGenerator";
import { Colors } from "../../constants/Colors";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen() {
  const [isQRVisible, setIsQRVisible] = useState(false);

  const handleLogout = () => {
    router.replace("/login");
  };

  const mockStudentData = {
    id: "STU123456",
    name: "John Doe",
    validUntil: "2:30 PM",
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SwiftPass</Text>
        <Ionicons
          name="log-out-outline"
          size={24}
          color="#fff"
          onPress={handleLogout}
          style={styles.logoutIcon}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Code Status Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="qr-code" size={22} color={Colors.light.tint} />
            <Text style={styles.cardTitle}>QR Code Status</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardContent}>
            <Text style={styles.highlight}>
              Valid until: {mockStudentData.validUntil}
            </Text>
            <Text style={styles.subText}>Auto-refresh in 15 minutes</Text>
            <View style={styles.generateButton}>
              <CustomButton
                title="Generate QR Code"
                onPress={() => setIsQRVisible(true)}
              />
            </View>
          </View>
        </View>

        {/* Today's Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="time-outline" size={22} color={Colors.light.tint} />
            <Text style={styles.cardTitle}>Today's Activity</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Lab Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Lab Exits</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4h</Text>
              <Text style={styles.statLabel}>Lab Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Labs Visited</Text>
            </View>
          </View>
        </View>

        {/* Access Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={Colors.light.tint}
            />
            <Text style={styles.cardTitle}>Access Status</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.cardContent}>
            <Text style={styles.accessStatus}>✓ Authorized for Lab Access</Text>
            <View style={styles.labContainer}>
              <View style={styles.labChip}>
                <Text style={styles.labChipText}>Computer Lab</Text>
              </View>
              <View style={styles.labChip}>
                <Text style={styles.labChipText}>Physics Lab</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button (For smaller screens) */}
        <View style={styles.mobileLogoutContainer}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>

        {/* QR Code Modal */}
        <QRCodeGenerator
          isVisible={isQRVisible}
          onClose={() => setIsQRVisible(false)}
          studentData={mockStudentData}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.light.tint,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  logoutIcon: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginBottom: 15,
  },
  cardContent: {
    paddingVertical: 5,
  },
  highlight: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.tint,
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: "#888",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    backgroundColor: "#f8f9fa",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.light.tint,
  },
  statLabel: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  accessStatus: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.tint,
    marginBottom: 12,
  },
  labContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  labChip: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 8,
  },
  labChipText: {
    color: Colors.light.tint,
    fontSize: 14,
  },
  mobileLogoutContainer: {
    marginBottom: 30,
    display: "none",
  },
  generateButton: {
    marginTop: 16,
  },
});
