import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { mobileRegister } from '../services/authService';
import { saveAuthData } from '../services/storageService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BLOOD_GROUPS = [
  'A_POSITIVE',
  'A_NEGATIVE',
  'B_POSITIVE',
  'B_NEGATIVE',
  'AB_POSITIVE',
  'AB_NEGATIVE',
  'O_POSITIVE',
  'O_NEGATIVE'
];

const GENDERS = ['MALE', 'FEMALE'];

const formatBloodGroupLabel = (group: string) => {
  if (!group) return '';
  return group.replace('_NEGATIVE', '-').replace('_POSITIVE', '+');
};

const formatGenderLabel = (g: string) => {
  if (!g) return '';
  return g.charAt(0) + g.slice(1).toLowerCase();
};

interface NewUserOnboardingScreenProps {
  phoneNumber: string;
  onNavigateBack: () => void;
  onNavigateToHome: (firstName: string) => void;
}

export default function NewUserOnboardingScreen({
  phoneNumber,
  onNavigateBack,
  onNavigateToHome,
}: NewUserOnboardingScreenProps) {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!fullName.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name to proceed.');
      return;
    }

    if (!gender) {
      Alert.alert('Missing Field', 'Please select your gender.');
      return;
    }

    if (!bloodGroup) {
      Alert.alert('Missing Field', 'Please select your blood group.');
      return;
    }

    setLoading(true);
    try {
      console.log('[Onboarding] Triggering mobile-register API.');
      // Create user on backend
      const authResponse = await mobileRegister(fullName, phoneNumber, bloodGroup, gender);

      // Persist auth state locally
      await saveAuthData(authResponse.token, {
        userId: authResponse.userId,
        firstName: authResponse.firstName,
        contactNumber: authResponse.contactNumber,
      });

      Keyboard.dismiss();
      onNavigateToHome(authResponse.firstName);
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        'Registration Failed',
        error.message || 'Could not complete onboarding registration. Check your network connectivity and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Banner Gradient */}
          <LinearGradient
            colors={['#D32F2F', '#8E1C1C']}
            style={styles.headerSection}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={onNavigateBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to OTP verification"
            >
              <Feather name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.sirenBox}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#FF5252" />
            </View>
            <Text style={styles.appTitle}>Profile Setup</Text>
            <Text style={styles.appSubtitle}>Emergency Info Registry</Text>
          </LinearGradient>

          {/* Form area sheet */}
          <View style={styles.sheetSection}>
            <View style={styles.sheetHeader}>
              <Text style={styles.loginTitle}>Welcome to CareWave</Text>
              <Text style={styles.loginSubtext}>
                Please configure your profile. This emergency configuration helps responders act rapidly.
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Full Name */}
              <CustomInput
                label="Full Name"
                placeholder="John Doe"
                icon="user"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                accessibilityLabel="Full Name input"
              />

              {/* Gender Picker Trigger */}
              <Text style={styles.pickerLabel}>Gender</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                activeOpacity={0.8}
                onPress={() => setShowGenderPicker(true)}
                accessibilityRole="combobox"
                accessibilityLabel="Gender selection picker"
              >
                <Text style={[styles.pickerValue, !gender && styles.pickerPlaceholder]}>
                  {formatGenderLabel(gender) || 'Select your gender'}
                </Text>
                <Feather name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>

              <View style={{ height: 16 }} />

              {/* Blood Group Picker Trigger */}
              <Text style={styles.pickerLabel}>Blood Group</Text>
              <TouchableOpacity
                style={styles.pickerTrigger}
                activeOpacity={0.8}
                onPress={() => setShowPicker(true)}
                accessibilityRole="combobox"
                accessibilityLabel="Blood group selection picker"
              >
                <Text style={[styles.pickerValue, !bloodGroup && styles.pickerPlaceholder]}>
                  {formatBloodGroupLabel(bloodGroup) || 'Select your blood group'}
                </Text>
                <Feather name="chevron-down" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <CustomButton
              title="Complete Registry"
              onPress={handleSubmit}
              loading={loading}
              icon="check-circle"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Blood Group Picker Modal Sheet */}
      <Modal
        visible={showPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setShowPicker(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Blood Group</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Feather name="x" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={BLOOD_GROUPS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, bloodGroup === item && styles.modalItemActive]}
                  onPress={() => {
                    setBloodGroup(item);
                    setShowPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, bloodGroup === item && styles.modalItemTextActive]}>
                    {formatBloodGroupLabel(item)}
                  </Text>
                  {bloodGroup === item && <Feather name="check" size={18} color="#D32F2F" />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Gender Picker Modal Sheet */}
      <Modal
        visible={showGenderPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setShowGenderPicker(false)} 
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Feather name="x" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={GENDERS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, gender === item && styles.modalItemActive]}
                  onPress={() => {
                    setGender(item);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={[styles.modalItemText, gender === item && styles.modalItemTextActive]}>
                    {formatGenderLabel(item)}
                  </Text>
                  {gender === item && <Feather name="check" size={18} color="#D32F2F" />}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#0F0F11',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: SCREEN_HEIGHT < 700 ? 40 : 60,
    paddingBottom: SCREEN_HEIGHT < 700 ? 30 : 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: SCREEN_HEIGHT < 700 ? 32 : 52,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 22,
  },
  sirenBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  sheetSection: {
    flex: 1,
    backgroundColor: '#0F0F11',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  sheetHeader: {
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loginSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 28,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  pickerValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  pickerPlaceholder: {
    color: '#636366',
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.5,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#2C2C2E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalItemActive: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: '#E5E5EA',
  },
  modalItemTextActive: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#2C2C2E',
  },
});
