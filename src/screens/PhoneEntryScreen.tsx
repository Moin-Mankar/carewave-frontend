import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhoneEntryScreenProps {
  onNavigateToOtp: (phoneNumber: string) => void;
}

export default function PhoneEntryScreen({ onNavigateToOtp }: PhoneEntryScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleContinue = () => {
    // Basic verification: strip any whitespace/non-digits and check length
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid 10-digit mobile number to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    Keyboard.dismiss();
    onNavigateToOtp(cleanNumber);
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
          {/* Top Banner section with Red Gradient - Responsive sizing */}
          <LinearGradient
            colors={['#D32F2F', '#8E1C1C']}
            style={styles.headerSection}
          >
            {/* Siren Icon Box */}
            <View style={styles.sirenBox}>
              <MaterialCommunityIcons name="alarm-light" size={32} color="#FF5252" />
            </View>
            <Text style={styles.appTitle}>CareWave</Text>
            <Text style={styles.appSubtitle}>Intelligent Emergency Response</Text>
          </LinearGradient>

          {/* Lower dark sheet containing form fields */}
          <View style={styles.sheetSection}>
            <View style={styles.sheetHeader}>
              <Text style={styles.loginTitle}>Login</Text>
              <Text style={styles.loginSubtext}>Enter your mobile number to continue</Text>
            </View>

            {/* Input fields box */}
            <View style={styles.inputContainer}>
              {/* Country selector */}
              <View style={styles.countrySelector}>
                <Text style={styles.countryText}>IN +91</Text>
                <Feather name="chevron-down" size={16} color="#8E8E93" />
              </View>

              {/* Vertical divider line */}
              <View style={styles.divider} />

              {/* Text Input area */}
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter mobile number"
                placeholderTextColor="#636366"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                accessibilityLabel="Mobile Number Input"
              />

              {/* Phone Icon indicator */}
              <Feather name="phone" size={18} color="#8E8E93" style={styles.phoneIcon} />
            </View>

            {/* Reusable Submit button */}
            <CustomButton
              title="Continue"
              onPress={handleContinue}
              icon="arrow-right"
            />

            {/* Privacy footer */}
            <View style={styles.privacyFooter}>
              <MaterialCommunityIcons name="shield-check-outline" size={16} color="#8E8E93" />
              <Text style={styles.privacyText}>
                We respect your privacy. Your number is safe with us.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 14,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  phoneIcon: {
    marginLeft: 8,
  },
  privacyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingVertical: 12,
  },
  privacyText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
