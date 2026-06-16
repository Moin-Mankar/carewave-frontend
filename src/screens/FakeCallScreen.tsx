import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  BackHandler,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FakeCallScreenProps {
  callerName: string;
  onEndCall: () => void;
}

// Helper to extract initials from the caller name
const getInitials = (name: string): string => {
  if (!name) return '?';
  const cleanName = name.trim();
  const parts = cleanName.split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase();
  }
  const first = parts[0].substring(0, 1);
  const last = parts[parts.length - 1].substring(0, 1);
  return (first + last).toUpperCase();
};

export default function FakeCallScreen({ callerName, onEndCall }: FakeCallScreenProps) {
  const [seconds, setSeconds] = useState(0);

  // Block Android hardware back button
  useEffect(() => {
    const backAction = () => {
      // Return true to indicate we have handled the action (do nothing / block exit)
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Update timer every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Format seconds to MM:SS string
  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${formattedMins}:${formattedSecs}`;
  };

  const initials = getInitials(callerName);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0D" />
      
      {/* Top spacing / avatar section */}
      <View style={styles.topSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.callerName} numberOfLines={1}>
          {callerName}
        </Text>
        
        <Text style={styles.statusText}>Call in Progress</Text>
        
        <Text style={styles.timerText}>{formatTimer(seconds)}</Text>
      </View>

      {/* Action / End Call button section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={onEndCall}
          style={styles.endCallButton}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.buttonLabel}>End Call</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0D',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.12,
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#1E1E22',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // Soft shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  callerName: {
    fontSize: 34,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  timerText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
    fontVariant: ['tabular-nums'], // prevent numbers jumping during count up
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  endCallButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 10,
  },
  buttonLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
