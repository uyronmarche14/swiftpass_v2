import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Card, Button } from "react-native-paper";

export const QRCodeDisplay = () => {
  const { getQRCode, userProfile, isLoading } = useAuth();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQRCode();
  }, [userProfile]);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      const qrCodeData = await getQRCode();
      setQrCode(qrCodeData);
    } catch (error) {
      console.error("Error loading QR code:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQRCode();
    setRefreshing(false);
  };

  if (isLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your QR code...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Card style={styles.card}>
        <Card.Title
          title="Your Attendance QR Code"
          subtitle="Scan this code to record your attendance"
        />
        <Card.Content>
          {qrCode ? (
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: qrCode }}
                style={styles.qrCode}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>
                Student ID: {userProfile?.student_id}
              </Text>
              <Text style={styles.infoText}>
                Name: {userProfile?.full_name}
              </Text>
            </View>
          ) : (
            <View style={styles.noQrContainer}>
              <Text style={styles.noQrText}>
                No QR code available. Please check your profile information.
              </Text>
              <Button
                mode="contained"
                onPress={loadQRCode}
                style={styles.refreshButton}
              >
                Generate QR Code
              </Button>
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={loadQRCode}>Refresh</Button>
        </Card.Actions>
      </Card>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How to use your QR code</Text>
        <Text style={styles.infoDescription}>
          1. Ensure your QR code is clearly visible on your screen.
        </Text>
        <Text style={styles.infoDescription}>
          2. Present your QR code to the scanner at the entrance of your lab.
        </Text>
        <Text style={styles.infoDescription}>
          3. Wait for the confirmation beep to ensure your attendance is
          recorded.
        </Text>
        <Text style={styles.infoDescription}>
          4. You can refresh your QR code if needed.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  qrCode: {
    width: 250,
    height: 250,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  noQrContainer: {
    alignItems: "center",
    padding: 20,
  },
  noQrText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  refreshButton: {
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: "#444",
  },
});

export default QRCodeDisplay;
