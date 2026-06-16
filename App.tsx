import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import './src/services/firebase';
import PhoneEntryScreen from './src/screens/PhoneEntryScreen';
import OTPVerificationScreen from './src/screens/OTPVerificationScreen';
import NewUserOnboardingScreen from './src/screens/NewUserOnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import LiveTrackingMapScreen from './src/screens/LiveTrackingMapScreen';
import FakeCallSetupScreen from './src/screens/FakeCallSetupScreen';
import FakeCallScreen from './src/screens/FakeCallScreen';
import { getAuthData } from './src/services/storageService';

type Screen = 'LOADING' | 'PHONE_ENTRY' | 'OTP_VERIFICATION' | 'NEW_USER_ONBOARDING' | 'HOME' | 'LIVE_TRACKING_MAP' | 'FAKE_CALL_SETUP' | 'FAKE_CALL';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOADING');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | undefined>(undefined);
  const [fakeCallerName, setFakeCallerName] = useState('');

  // App session restore check on startup
  useEffect(() => {
    async function restoreSession() {
      try {
        console.log('[Auth] Restoring session from persistent storage...');
        const session = await getAuthData();
        if (session) {
          console.log('[Auth] Session restored successfully for user:', session.user.firstName);
          setPhoneNumber(session.user.contactNumber);
          setFirstName(session.user.firstName);
          setCurrentScreen('HOME');
        } else {
          console.log('[Auth] No active session found. Redirecting to login onboarding.');
          setCurrentScreen('PHONE_ENTRY');
        }
      } catch (error) {
        console.error('[Auth] Failed to restore session on startup:', error);
        setCurrentScreen('PHONE_ENTRY');
      }
    }
    restoreSession();
  }, []);

  const navigateToOtp = (phone: string) => {
    setPhoneNumber(phone);
    setCurrentScreen('OTP_VERIFICATION');
  };

  const navigateToOnboarding = () => {
    setCurrentScreen('NEW_USER_ONBOARDING');
  };

  const navigateToHome = (userName: string) => {
    setFirstName(userName);
    setCurrentScreen('HOME');
  };

  const navigateToPhoneEntry = () => {
    setPhoneNumber('');
    setFirstName('');
    setCurrentScreen('PHONE_ENTRY');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      {currentScreen === 'LOADING' ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
        </View>
      ) : (
        <>
          {currentScreen === 'PHONE_ENTRY' && (
            <PhoneEntryScreen onNavigateToOtp={navigateToOtp} />
          )}
          {currentScreen === 'OTP_VERIFICATION' && (
            <OTPVerificationScreen
              phoneNumber={phoneNumber}
              onNavigateBack={navigateToPhoneEntry}
              onNavigateToOnboarding={navigateToOnboarding}
              onNavigateToHome={navigateToHome}
            />
          )}
          {currentScreen === 'NEW_USER_ONBOARDING' && (
            <NewUserOnboardingScreen
              phoneNumber={phoneNumber}
              onNavigateBack={() => setCurrentScreen('OTP_VERIFICATION')}
              onNavigateToHome={navigateToHome}
            />
          )}
          {currentScreen === 'HOME' && (
            <HomeScreen
              firstName={firstName}
              phoneNumber={phoneNumber}
              onSignOut={navigateToPhoneEntry}
              onNavigateToMap={(emergencyId) => {
                setSelectedEmergencyId(emergencyId);
                setCurrentScreen('LIVE_TRACKING_MAP');
              }}
              onNavigateToFakeCallSetup={() => {
                setCurrentScreen('FAKE_CALL_SETUP');
              }}
            />
          )}
          {currentScreen === 'LIVE_TRACKING_MAP' && (
            <LiveTrackingMapScreen
              emergencyId={selectedEmergencyId}
              onNavigateBack={() => {
                setSelectedEmergencyId(undefined);
                setCurrentScreen('HOME');
              }}
            />
          )}
          {currentScreen === 'FAKE_CALL_SETUP' && (
            <FakeCallSetupScreen
              onNavigateBack={() => {
                setCurrentScreen('HOME');
              }}
              onStartCall={(callerName) => {
                setFakeCallerName(callerName);
                setCurrentScreen('FAKE_CALL');
              }}
            />
          )}
          {currentScreen === 'FAKE_CALL' && (
            <FakeCallScreen
              callerName={fakeCallerName}
              onEndCall={() => {
                setFakeCallerName('');
                setCurrentScreen('HOME');
              }}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F0F11',
    alignItems: 'center',
    justifyContent: 'center',
  },
});