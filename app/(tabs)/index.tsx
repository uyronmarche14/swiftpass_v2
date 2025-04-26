import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { LinearGradient } from "expo-linear-gradient";

export default function HomeScreen() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.light.tint, Colors.light.background]}
        style={styles.header}
      >
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>John Doe</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="qr-code" size={24} color={Colors.light.tint} />
              </View>
              <Text style={styles.actionTitle}>Generate QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="time" size={24} color={Colors.light.tint} />
              </View>
              <Text style={styles.actionTitle}>View Hours</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={24} color={Colors.light.tint} />
              </View>
              <Text style={styles.actionTitle}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Ionicons
                  name="stats-chart"
                  size={24}
                  color={Colors.light.tint}
                />
              </View>
              <Text style={styles.actionTitle}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.upcomingContainer}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>09:00 AM</Text>
                <View style={styles.timeLine} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Computer Lab</Text>
                <Text style={styles.scheduleSubtitle}>
                  Programming Practice
                </Text>
              </View>
            </View>

            <View style={styles.scheduleItem}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>02:00 PM</Text>
                <View style={styles.timeLine} />
              </View>
              <View style={styles.scheduleContent}>
                <Text style={styles.scheduleTitle}>Physics Lab</Text>
                <Text style={styles.scheduleSubtitle}>Experiment Session</Text>
              </View>
            </View>
          </View>
        </View>
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
  },
  welcomeText: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  dateContainer: {
    marginTop: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: (Dimensions.get("window").width - 52) / 2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.light.tint}10`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  upcomingContainer: {
    marginBottom: 24,
  },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeContainer: {
    width: 80,
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "500",
  },
  timeLine: {
    width: 2,
    height: "100%",
    backgroundColor: `${Colors.light.tint}20`,
    marginTop: 8,
  },
  scheduleContent: {
    flex: 1,
    paddingLeft: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 4,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: "#666",
  },
});
