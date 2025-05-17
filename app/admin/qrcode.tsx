import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../constants/Colors';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminQRCodeScreen() {
  const { getAdminQRCode, adminProfile, isAdmin } = useAuth();
  const [qrData, setQrData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!isAdmin) {
      setError('Only administrators can access this page');
      setIsLoading(false);
      return;
    }
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAdminQRCode();
      setQrData(data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError('Failed to generate QR code: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshQRCode = () => {
    Alert.alert(
      'Refresh QR Code',
      'This will generate a new admin QR code. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh', onPress: generateQRCode }
      ]
    );
  };

  // Function to format time remaining
  const getTimeRemaining = () => {
    if (!qrData) return null;

    try {
      const parsedData = JSON.parse(qrData);
      if (!parsedData.expiry) return null;

      const expiryTime = new Date(parsedData.expiry).getTime();
      const now = new Date().getTime();
      const timeRemaining = expiryTime - now;

      if (timeRemaining <= 0) return 'Expired';

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m remaining`;
    } catch (err) {
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{
          headerTitle: 'Admin QR Code',
          headerTitleStyle: styles.headerTitle,
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Administrator QR Code</Text>
          <Text style={styles.subtitle}>Use this QR code to access any door without schedule restrictions</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={32} color={Colors.light.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={generateQRCode}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Generating your admin QR code...</Text>
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              {qrData ? (
                <QRCode
                  value={qrData}
                  size={250}
                  color={Colors.light.text}
                  backgroundColor="white"
                />
              ) : (
                <Text style={styles.noQrText}>No QR code available</Text>
              )}
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Admin:</Text>
                <Text style={styles.infoValue}>{adminProfile?.full_name || 'Administrator'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role:</Text>
                <Text style={styles.infoValue}>{adminProfile?.role || 'admin'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status:</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Refresh:</Text>
                <Text style={styles.infoValue}>
                  {`${lastRefresh.toLocaleDateString()} ${lastRefresh.toLocaleTimeString()}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Validity:</Text>
                <Text style={styles.validityText}>{getTimeRemaining() || '24 hours'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={refreshQRCode}>
              <Ionicons name="refresh" size={20} color="white" style={styles.refreshIcon} />
              <Text style={styles.refreshText}>Refresh QR Code</Text>
            </TouchableOpacity>

            <View style={styles.noteContainer}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.light.textSecondary} />
              <Text style={styles.noteText}>
                This QR code provides administrative access to all lab rooms regardless of schedule.
                For security reasons, this code expires after 24 hours.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  noQrText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    padding: 80,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  validityText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  refreshButton: {
    flexDirection: 'row',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
