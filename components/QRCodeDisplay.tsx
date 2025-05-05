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
import QRCode from "react-native-qrcode-svg";
import { Colors } from "../constants/Colors";

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
        <ActivityIndicator size="large" color={Colors.light.primary} />
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
          title="Your Lab Access QR Code"
          titleStyle={styles.cardTitle}
        />
        <Card.Content style={styles.cardContent}>
          {qrCode ? (
            <View style={styles.qrContainer}>
              <QRCode
                value={qrCode}
                size={200}
                backgroundColor="#fff"
                color="#000"
              />
              <Text style={styles.infoText}>
                Scan this code for lab access and attendance
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No QR code available</Text>
              <Button
                mode="contained"
                onPress={loadQRCode}
                style={styles.retryButton}
              >
                Generate QR Code
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  card: {
    padding: 8,
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  cardContent: {
    alignItems: "center",
    padding: 16,
  },
  qrContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  infoText: {
    marginTop: 16,
    textAlign: "center",
    color: Colors.light.text,
  },
  emptyState: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
  },
});

export default QRCodeDisplay;
