import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

interface AccessHistoryItem {
  id: string;
  location: string;
  action: "Entry" | "Exit";
  timestamp: string;
  success: boolean;
}

interface ClassItem {
  id: string;
  time: string;
  name: string;
  location: string;
  duration: string;
}

// Mock access history data
const mockAccessHistory: AccessHistoryItem[] = [
  {
    id: "1",
    location: "Computer Lab",
    action: "Entry",
    timestamp: "2024-05-02T09:15:00Z",
    success: true,
  },
  {
    id: "2",
    location: "Computer Lab",
    action: "Exit",
    timestamp: "2024-05-02T11:30:00Z",
    success: true,
  },
  {
    id: "3",
    location: "Physics Lab",
    action: "Entry",
    timestamp: "2024-05-01T14:00:00Z",
    success: true,
  },
  {
    id: "4",
    location: "Physics Lab",
    action: "Exit",
    timestamp: "2024-05-01T16:15:00Z",
    success: true,
  },
  {
    id: "5",
    location: "Chemistry Lab",
    action: "Entry",
    timestamp: "2024-04-30T10:00:00Z",
    success: false,
  },
];

export default function AccessScreen() {
  const { userProfile } = useAuth();
  const [accessHistory, setAccessHistory] =
    useState<AccessHistoryItem[]>(mockAccessHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("access"); // 'access' or 'history'
  const [unlockAnimation] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  // Simulate a door unlock
  const simulateUnlock = () => {
    setIsLoading(true);

    // Simulate API call to unlock door
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);

      // Run unlock animation
      Animated.sequence([
        Animated.timing(unlockAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(unlockAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccess(false);
      });

      // Add this access to history
      const newAccessEvent: AccessHistoryItem = {
        id: String(Date.now()),
        location: "Main Entrance",
        action: "Entry",
        timestamp: new Date().toISOString(),
        success: true,
      };

      setAccessHistory([newAccessEvent, ...accessHistory]);
    }, 2000);
  };

  // Format the timestamp into a readable date and time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderAccessHistoryItem = ({ item }: { item: AccessHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyIconContainer}>
        <Ionicons
          name={item.action === "Entry" ? "log-in" : "log-out"}
          size={20}
          color={item.success ? Colors.light.primary : Colors.light.warning}
        />
      </View>
      <View style={styles.historyDetails}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyLocation}>{item.location}</Text>
          <Text style={styles.historyTimestamp}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <View style={styles.historyActionRow}>
          <Text style={styles.historyAction}>
            {item.action} • {item.success ? "Successful" : "Failed"}
          </Text>
          {!item.success && (
            <View style={styles.warningBadge}>
              <Text style={styles.warningText}>Unauthorized</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // Animation styles
  const lockScale = unlockAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  const unlockOpacity = unlockAnimation.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Access Control</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "access" && styles.activeTab]}
          onPress={() => setActiveTab("access")}
        >
          <Ionicons
            name="key"
            size={20}
            color={activeTab === "access" ? Colors.light.primary : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "access" && styles.activeTabText,
            ]}
          >
            Door Access
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === "history" ? Colors.light.primary : "#999"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Access History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "access" ? (
        <ScrollView style={styles.content}>
          <View style={styles.lockContainer}>
            {showSuccess ? (
              <Animated.View
                style={[
                  styles.unlockSuccess,
                  {
                    opacity: unlockOpacity,
                    transform: [{ scale: lockScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                <Text style={styles.unlockText}>Access Granted</Text>
              </Animated.View>
            ) : (
              <TouchableOpacity
                style={styles.lockButton}
                onPress={simulateUnlock}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="key" size={60} color="#fff" />
                    <Text style={styles.lockText}>Tap to Unlock</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.doorList}>
            <Text style={styles.sectionTitle}>Available Doors</Text>

            <TouchableOpacity style={styles.doorItem} onPress={simulateUnlock}>
              <View style={styles.doorItemLeft}>
                <View style={[styles.doorStatus, styles.doorStatusAvailable]} />
                <Text style={styles.doorName}>Main Entrance</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.doorItem} onPress={simulateUnlock}>
              <View style={styles.doorItemLeft}>
                <View style={[styles.doorStatus, styles.doorStatusAvailable]} />
                <Text style={styles.doorName}>Computer Lab</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.doorItem}>
              <View style={styles.doorItemLeft}>
                <View
                  style={[styles.doorStatus, styles.doorStatusUnavailable]}
                />
                <Text style={styles.doorName}>Physics Lab</Text>
                <View style={styles.restrictedBadge}>
                  <Text style={styles.restrictedText}>Restricted</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.doorItem}>
              <View style={styles.doorItemLeft}>
                <View
                  style={[styles.doorStatus, styles.doorStatusUnavailable]}
                />
                <Text style={styles.doorName}>Chemistry Lab</Text>
                <View style={styles.restrictedBadge}>
                  <Text style={styles.restrictedText}>Restricted</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>

          <View style={styles.quickAccessCard}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <Text style={styles.quickAccessDescription}>
              Recent locations you've accessed
            </Text>

            <View style={styles.quickAccessButtons}>
              <TouchableOpacity
                style={styles.quickAccessButton}
                onPress={simulateUnlock}
              >
                <Ionicons
                  name="desktop"
                  size={24}
                  color={Colors.light.primary}
                />
                <Text style={styles.quickAccessButtonText}>Computer Lab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessButton}
                onPress={simulateUnlock}
              >
                <Ionicons name="flask" size={24} color={Colors.light.primary} />
                <Text style={styles.quickAccessButtonText}>Physics Lab</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={accessHistory}
          renderItem={renderAccessHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          ListHeaderComponent={() => (
            <Text style={styles.historyHeader}>Recent Activity</Text>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyHistory}>
              <Ionicons name="document" size={50} color="#ccc" />
              <Text style={styles.emptyHistoryText}>
                No access history found
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  tabText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#999",
  },
  activeTabText: {
    color: Colors.light.primary,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lockContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 250,
    marginBottom: 20,
  },
  lockButton: {
    backgroundColor: Colors.light.primary,
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  lockText: {
    color: "#fff",
    marginTop: 10,
    fontWeight: "600",
  },
  unlockSuccess: {
    justifyContent: "center",
    alignItems: "center",
  },
  unlockText: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  doorList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  doorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  doorItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  doorStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  doorStatusAvailable: {
    backgroundColor: "#4CAF50",
  },
  doorStatusUnavailable: {
    backgroundColor: "#F44336",
  },
  doorName: {
    fontSize: 16,
    color: Colors.light.text,
  },
  restrictedBadge: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  restrictedText: {
    color: "#F44336",
    fontSize: 12,
    fontWeight: "500",
  },
  quickAccessCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessDescription: {
    color: "#666",
    marginBottom: 16,
  },
  quickAccessButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickAccessButton: {
    backgroundColor: "#F0F6FF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginRight: 12,
    marginBottom: 12,
    width: (width - 64) / 2.2,
  },
  quickAccessButtonText: {
    color: Colors.light.primary,
    marginTop: 8,
    fontWeight: "500",
  },
  historyList: {
    padding: 16,
  },
  historyHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  historyLocation: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  historyTimestamp: {
    fontSize: 12,
    color: "#666",
  },
  historyActionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyAction: {
    fontSize: 14,
    color: "#555",
  },
  warningBadge: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  warningText: {
    color: "#F44336",
    fontSize: 12,
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
});
