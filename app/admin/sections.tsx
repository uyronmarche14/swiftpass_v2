import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { SectionService, Section } from "../../lib/services/sectionService";

// Using the Section interface from sectionService

export default function SectionsScreen() {
  const { isAdmin, isLoading } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  
  // Form state
  const [sectionName, setSectionName] = useState("");
  const [sectionCode, setSectionCode] = useState("");
  const [sectionYear, setSectionYear] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setIsLoadingData(true);
    try {
      // Load sections using the SectionService
      const result = await SectionService.getAllSections();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSections(result.data as Section[] || []);
    } catch (error) {
      console.error("Error loading sections:", error);
      Alert.alert("Error", "Failed to load sections");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateSection = async () => {
    if (!sectionName || !sectionCode) {
      Alert.alert("Error", "Section name and code are required.");
      return;
    }

    try {
      setIsLoadingData(true);

      const newSection = {
        name: sectionName,
        code: sectionCode,
        year: sectionYear || new Date().getFullYear().toString(),
      };

      const result = await SectionService.createSection(newSection);

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to create section.");
        setIsLoadingData(false);
        return;
      }

      Alert.alert("Success", "Section created successfully.");
      resetForm();
      setIsCreateModalVisible(false);
      await loadSections();
    } catch (error) {
      console.error("Error creating section:", error);
      Alert.alert("Error", "Failed to create section.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleUpdateSection = async () => {
    if (!selectedSection) return;
    
    if (!sectionName || !sectionCode) {
      Alert.alert("Error", "Section name and code are required.");
      return;
    }

    try {
      setIsLoadingData(true);

      const updates = {
        name: sectionName,
        code: sectionCode,
        year: sectionYear || (selectedSection.year as string),
      };

      const result = await SectionService.updateSection(selectedSection.id, updates);

      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to update section.");
        setIsLoadingData(false);
        return;
      }

      Alert.alert("Success", "Section updated successfully.");
      resetForm();
      setIsEditModalVisible(false);
      await loadSections();
    } catch (error) {
      console.error("Error updating section:", error);
      Alert.alert("Error", "Failed to update section.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    Alert.alert(
      "Delete Section",
      "Are you sure you want to delete this section? This may affect students and labs associated with this section.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoadingData(true);
              
              const result = await SectionService.deleteSection(id);
              
              if (!result.success) {
                Alert.alert("Error", result.error || "Failed to delete section.");
                setIsLoadingData(false);
                return;
              }

              Alert.alert("Success", "Section deleted successfully.");
              await loadSections();
            } catch (error) {
              console.error("Error deleting section:", error);
              Alert.alert("Error", "Failed to delete section.");
            } finally {
              setIsLoadingData(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (section: Section) => {
    setSelectedSection(section);
    setSectionName(section.name);
    setSectionCode(section.code);
    setSectionYear(section.year || "");
    setIsEditModalVisible(true);
  };

  const resetForm = () => {
    setSectionName("");
    setSectionCode("");
    setSectionYear("");
    setSelectedSection(null);
  };

  if (isLoading || isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading sections...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sections</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Section</Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={60} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>No Sections Found</Text>
          <Text style={styles.emptySubText}>
            You haven't created any sections yet. Create your first section to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.sectionCard}>
              <View style={styles.sectionInfo}>
                <Text style={styles.sectionName}>{item.name}</Text>
                <Text style={styles.sectionCode}>Code: {item.code}</Text>
                <Text style={styles.sectionYear}>Year: {item.year}</Text>
              </View>
              <View style={styles.sectionActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteSection(item.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.sectionsList}
        />
      )}

      {/* Create Section Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Section</Text>
              <TouchableOpacity onPress={() => {
                setIsCreateModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Section Name</Text>
              <TextInput
                style={styles.input}
                value={sectionName}
                onChangeText={setSectionName}
                placeholder="e.g., Section A2023"
              />

              <Text style={styles.inputLabel}>Section Code</Text>
              <TextInput
                style={styles.input}
                value={sectionCode}
                onChangeText={setSectionCode}
                placeholder="e.g., A2023"
              />

              <Text style={styles.inputLabel}>Year (Optional)</Text>
              <TextInput
                style={styles.input}
                value={sectionYear}
                onChangeText={setSectionYear}
                placeholder="e.g., 2023"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!sectionName || !sectionCode) && styles.disabledButton,
                ]}
                onPress={handleCreateSection}
                disabled={!sectionName || !sectionCode}
              >
                <Text style={styles.createButtonText}>Create Section</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Section Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Section</Text>
              <TouchableOpacity onPress={() => {
                setIsEditModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Section Name</Text>
              <TextInput
                style={styles.input}
                value={sectionName}
                onChangeText={setSectionName}
                placeholder="e.g., Section A2023"
              />

              <Text style={styles.inputLabel}>Section Code</Text>
              <TextInput
                style={styles.input}
                value={sectionCode}
                onChangeText={setSectionCode}
                placeholder="e.g., A2023"
              />

              <Text style={styles.inputLabel}>Year (Optional)</Text>
              <TextInput
                style={styles.input}
                value={sectionYear}
                onChangeText={setSectionYear}
                placeholder="e.g., 2023"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!sectionName || !sectionCode) && styles.disabledButton,
                ]}
                onPress={handleUpdateSection}
                disabled={!sectionName || !sectionCode}
              >
                <Text style={styles.createButtonText}>Update Section</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundAlt,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.light.text,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  sectionsList: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionName: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionCode: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  sectionYear: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: Colors.light.primaryLight,
    opacity: 0.7,
  },
});
