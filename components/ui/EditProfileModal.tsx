import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import DropDownPicker from 'react-native-dropdown-picker';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialData: {
    full_name: string;
    student_id: string;
    course?: string;
    section?: string;
    phone_number?: string;
    address?: string;
    emergency_contact?: string;
    bio?: string;
  };
  onSave: (profileData: any) => Promise<boolean>;
  courseOptions?: Array<{ label: string; value: string }>;
  sectionOptions?: Array<{ label: string; value: string }>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  courseOptions = [],
  sectionOptions = [],
}) => {
  const [fullName, setFullName] = useState(initialData.full_name || '');
  const [studentId, setStudentId] = useState(initialData.student_id || '');
  const [course, setCourse] = useState(initialData.course || '');
  const [section, setSection] = useState(initialData.section || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData.phone_number || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [emergencyContact, setEmergencyContact] = useState(initialData.emergency_contact || '');
  const [bio, setBio] = useState(initialData.bio || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Dropdown state
  const [openCourseDropdown, setOpenCourseDropdown] = useState(false);
  const [openSectionDropdown, setOpenSectionDropdown] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFullName(initialData.full_name || '');
      setStudentId(initialData.student_id || '');
      setCourse(initialData.course || '');
      setSection(initialData.section || '');
      setPhoneNumber(initialData.phone_number || '');
      setAddress(initialData.address || '');
      setEmergencyContact(initialData.emergency_contact || '');
      setBio(initialData.bio || '');
      setErrorMessage('');
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Full name is required');
      return;
    }

    if (!studentId.trim()) {
      setErrorMessage('Student ID is required');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      const profileData = {
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        course: course || undefined,
        section: section || undefined,
        phone_number: phoneNumber.trim() || undefined,
        address: address.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
        bio: bio.trim() || undefined,
      };

      const success = await onSave(profileData);
      
      if (success) {
        onClose();
      } else {
        setErrorMessage('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
            />

            <Text style={styles.inputLabel}>Student ID (Cannot be changed)</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={studentId}
              editable={false}
              selectTextOnFocus={false}
            />

            <Text style={styles.inputLabel}>Course</Text>
            <View style={{ zIndex: 3000 }}>
              {courseOptions.length > 0 ? (
                <DropDownPicker
                  open={openCourseDropdown}
                  value={course}
                  items={courseOptions}
                  setOpen={setOpenCourseDropdown}
                  setValue={setCourse}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  placeholder="Select your course"
                  listMode="SCROLLVIEW"
                  zIndex={3000}
                  zIndexInverse={1000}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={course}
                  onChangeText={setCourse}
                  placeholder="Enter your course"
                />
              )}
            </View>

            <Text style={styles.inputLabel}>Section</Text>
            <View style={{ zIndex: 2000, marginTop: openCourseDropdown ? 100 : 0 }}>
              {sectionOptions.length > 0 ? (
                <DropDownPicker
                  open={openSectionDropdown}
                  value={section}
                  items={sectionOptions}
                  setOpen={setOpenSectionDropdown}
                  setValue={setSection}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                  placeholder="Select your section"
                  listMode="SCROLLVIEW"
                  zIndex={2000}
                  zIndexInverse={2000}
                />
              ) : (
                <TextInput
                  style={styles.input}
                  value={section}
                  onChangeText={setSection}
                  placeholder="Enter your section"
                />
              )}
            </View>

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              multiline
              numberOfLines={2}
            />

            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Name and phone number of emergency contact"
            />

            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              multiline
              numberOfLines={4}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.light.backgroundAlt,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: `${Colors.light.backgroundAlt}80`,
    color: Colors.light.textSecondary,
    opacity: 0.8,
  },
  dropdown: {
    backgroundColor: Colors.light.backgroundAlt,
    borderWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownContainer: {
    borderWidth: 0,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  errorText: {
    color: Colors.light.error,
    marginTop: 16,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default EditProfileModal;
