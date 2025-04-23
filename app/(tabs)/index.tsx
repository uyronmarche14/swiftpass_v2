import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Welcome to SwiftPass</Text>
        <Text style={styles.heroSubtitle}>
          Secure Password Management Made Simple
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <MaterialIcons name="security" size={40} color="#2e78b7" />
          <Text style={styles.featureTitle}>Secure Storage</Text>
          <Text style={styles.featureText}>
            Your passwords are encrypted and safely stored
          </Text>
        </View>

        <View style={styles.featureCard}>
          <MaterialIcons name="bolt" size={40} color="#2e78b7" />
          <Text style={styles.featureTitle}>Quick Access</Text>
          <Text style={styles.featureText}>
            Access your passwords with just one tap
          </Text>
        </View>

        <View style={styles.featureCard}>
          <MaterialIcons name="lock" size={40} color="#2e78b7" />
          <Text style={styles.featureTitle}>Password Generator</Text>
          <Text style={styles.featureText}>
            Create strong, unique passwords instantly
          </Text>
        </View>

        <View style={styles.featureCard}>
          <FontAwesome5 name="user-shield" size={40} color="#2e78b7" />
          <Text style={styles.featureTitle}>User Protection</Text>
          <Text style={styles.featureText}>
            Your security is our top priority
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  hero: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 60,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2e78b7",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  featuresContainer: {
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#1a1a1a",
    textAlign: "center",
  },
  featureText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
