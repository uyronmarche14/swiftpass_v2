import React, { useRef } from "react";
import { View, StyleSheet, Modal, Text } from "react-native";
import { Colors } from "../../constants/Colors";
import { CustomButton } from "./CustomButton";
import * as BarCodeScanner from "expo-barcode-scanner";
import Svg, { Rect } from "react-native-svg";
// import { captureRef } from "react-native-view-shot";
import { useState, useEffect } from "react";
import { Image } from "react-native";

interface QRCodeGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
  studentData: {
    id: string;
    name: string;
    validUntil: string;
  };
}

export function QRCodeGenerator({
  isVisible,
  onClose,
  studentData,
}: QRCodeGeneratorProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const qrData = JSON.stringify({
    ...studentData,
    timestamp: new Date().toISOString(),
  });

  useEffect(() => {
    if (isVisible) {
      // Generate QR code when modal becomes visible
      generateQRCode();
    }
  }, [isVisible]);

  const generateQRCode = async () => {
    try {
      // For Expo, we'll use the expo-barcode-scanner's API to generate a QR code
      // Since direct generation isn't available, we'll use a third-party service
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        qrData
      )}`;
      setQrCodeImage(qrApiUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Your Access QR Code</Text>
          <Text style={styles.subtitle}>
            Valid until {studentData.validUntil}
          </Text>

          <View style={styles.qrContainer}>
            {qrCodeImage ? (
              <Image
                source={{ uri: qrCodeImage }}
                style={{ width: 200, height: 200 }}
              />
            ) : (
              <View style={styles.loadingQr}>
                <Text>Loading QR Code...</Text>
              </View>
            )}
          </View>

          <Text style={styles.info}>Scan this code at the lab entrance</Text>
          <Text style={styles.warning}>Do not share this code with anyone</Text>

          <View style={styles.buttonContainer}>
            <CustomButton title="Close" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
    width: 232, // 200 + 16*2 padding
    height: 232, // 200 + 16*2 padding
    justifyContent: "center",
    alignItems: "center",
  },
  loadingQr: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  info: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
  },
  warning: {
    fontSize: 12,
    color: "#ff6b6b",
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
  },
});
