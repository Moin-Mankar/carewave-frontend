import messaging from '@react-native-firebase/messaging';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { clearAuthData, getAuthData } from '../services/storageService';
import { createMedicalEmergency, createEmergency, getFireConfiguration } from '../services/emergencyService';
import { cancelAlert, resolveAlert, getActiveEmergency, ActiveEmergencyResponse, sendCurrentEmergencyLocation } from '../services/trackingService';
import EmergencySuccessModal from '../components/EmergencySuccessModal';
import EmergencyFailureModal from '../components/EmergencyFailureModal';
import EmergencyActiveModal from '../components/EmergencyActiveModal';
import EmergencyCancelModal from '../components/EmergencyCancelModal';
import EmergencyResolveModal from '../components/EmergencyResolveModal';
import ActiveEmergencyExistsModal from '../components/ActiveEmergencyExistsModal';
import PoliceActiveModal from '../components/PoliceActiveModal';
import FireSeverityModal from '../components/FireSeverityModal';
import FireActiveModal from '../components/FireActiveModal';
import PersonalSafetySelectionModal from '../components/PersonalSafetySelectionModal';
import PersonalSafetyActiveModal from '../components/PersonalSafetyActiveModal';
import GeneralEmergencyActiveModal from '../components/GeneralEmergencyActiveModal';

// Import Reusable Components
import SOSButton from '../components/SOSButton';
import QuickActionCard from '../components/QuickActionCard';
import SystemStatusCard from '../components/SystemStatusCard';
import BottomNavigationBar from '../components/BottomNavigationBar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type EmergencyType = 'MEDICAL' | 'POLICE' | 'FIRE' | 'PERSONAL_SAFETY' | 'GENERAL';

interface HomeScreenProps {
  firstName: string;
  phoneNumber: string;
  onSignOut: () => void;
  onNavigateToMap: (emergencyId?: string) => void;
}

export default function HomeScreen({ firstName, phoneNumber, onSignOut, onNavigateToMap }: HomeScreenProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [liveTrackingActive, setLiveTrackingActive] = useState(false);

  // Modals & Countdown state machine
  const [showActionModal, setShowActionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showPoliceActiveModal, setShowPoliceActiveModal] = useState(false);
  const [showFireSeverityModal, setShowFireSeverityModal] = useState(false);
  const [showFireActiveModal, setShowFireActiveModal] = useState(false);
  const [selectedFireSeverity, setSelectedFireSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [showPersonalSafetySelectionModal, setShowPersonalSafetySelectionModal] = useState(false);
  const [showPersonalSafetyActiveModal, setShowPersonalSafetyActiveModal] = useState(false);
  const [selectedSafetyType, setSelectedSafetyType] = useState<'WOMEN' | 'CHILD' | null>(null);
  const [showGeneralEmergencyActiveModal, setShowGeneralEmergencyActiveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showActiveEmergencyExistsModal, setShowActiveEmergencyExistsModal] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState<ActiveEmergencyResponse | null>(null);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<EmergencyType | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCountdownOverlay, setShowCountdownOverlay] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('');

  // System status state variables
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [networkConnected, setNetworkConnected] = useState<boolean | null>(null);

  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Mount effect - Fetch system status and slide in screen fade
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    async function fetchSystemStatus() {
      try {
        // Battery level
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100));

        // GPS Location Permission status
        const { status } = await Location.getForegroundPermissionsAsync();
        setGpsEnabled(status === 'granted');

        // Network connection state
        const netState = await Network.getNetworkStateAsync();
        setNetworkConnected(netState.isConnected ?? false);
      } catch (err) {
        console.warn('[SystemStatus] Error fetching status info:', err);
      }
    }

    async function checkActiveEmergency() {
      try {
        const active = await getActiveEmergency();
        if (active) {
          setActiveEmergency(active);
          setLiveTrackingActive(true);
        }
      } catch (err) {
        console.warn('Error fetching active emergency:', err);
      }
    }

    fetchSystemStatus();
    checkActiveEmergency();

    const getFcmToken = async () => {
    try {
      await messaging().requestPermission();

      const token = await messaging().getToken();

      console.log('FCM TOKEN:', token);
    } catch (error) {
      console.error('FCM ERROR:', error);
    }
  };

  getFcmToken();
  }, []);

  // Pulse effect on countdown circle on each tick
  useEffect(() => {
    if (countdown !== null && showCountdownOverlay && !showSuccessScreen) {
      pulseScale.setValue(1);
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1.0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdown, showCountdownOverlay, showSuccessScreen]);

  // Victim active emergency location auto update loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (activeEmergency && activeEmergency.emergencyId && activeEmergency.emergencyStatus === 'ACTIVE') {
      console.log('[LiveTracking Update] Interval Started');
      // Trigger first update immediately
      sendCurrentEmergencyLocation(activeEmergency.emergencyId);

      intervalId = setInterval(() => {
        sendCurrentEmergencyLocation(activeEmergency.emergencyId);
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('[LiveTracking Update] Interval Stopped');
      }
    };
  }, [activeEmergency?.emergencyId, activeEmergency?.emergencyStatus]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      console.log('[Auth] Sign out requested, clearing auth storage.');
      await clearAuthData();
      setLoading(false);
      onSignOut();
    } catch (error) {
      setLoading(false);
      console.error('[Auth] Sign out clear storage failed:', error);
      onSignOut(); // Fallback signout
    }
  };

  // Manage the countdown tick and completion
  useEffect(() => {
    if (countdown === null || !selectedEmergencyType) return;

    if (countdown === 0) {
      console.log(`[Countdown] Reached 0. Triggering completion for type: ${selectedEmergencyType}`);
      handleCountdownCompletion(selectedEmergencyType);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        console.log(`[Countdown Tick] countdown value transitioning from ${prev} to ${prev - 1}`);
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, selectedEmergencyType]);

  const formatElapsedTime = (createdAtStr: string): string => {
    if (!createdAtStr) return '00:00 ago';
    try {
      const created = new Date(createdAtStr).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - created);
      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;

      if (hours > 0) {
        return `${hours}h ${mins}m ago`;
      } else {
        const mm = mins.toString().padStart(2, '0');
        const ss = secs.toString().padStart(2, '0');
        return `${mm}:${ss} ago`;
      }
    } catch (err) {
      return '00:00 ago';
    }
  };

  // Live elapsed timer for active emergency
  useEffect(() => {
    if (!activeEmergency || !activeEmergency.createdAt) {
      setElapsedTime('');
      return;
    }

    // Initialize immediately
    setElapsedTime(formatElapsedTime(activeEmergency.createdAt));

    const intervalId = setInterval(() => {
      setElapsedTime(formatElapsedTime(activeEmergency.createdAt));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeEmergency]);

  // SOS button handler - Opens bottom sheet modal
  const handleSOSPress = () => {
    console.log('[SOS] Button pressed.');
    if (activeEmergency) {
      setShowActiveEmergencyExistsModal(true);
    } else {
      setShowActionModal(true);
    }
  };

  // Triggers emergency countdown flow
  const startEmergencyCountdown = (type: EmergencyType) => {
    if (type === 'MEDICAL') {
      console.log("[STEP 1] Medical button pressed");
    } else if (type === 'POLICE') {
      console.log("[Police Countdown Started]");
      console.log("[STEP 1] Police button pressed");
    } else if (type === 'FIRE') {
      console.log("[STEP 1] Fire button pressed");
      setShowActionModal(false);
      setShowFireSeverityModal(true);
      return;
    } else if (type === 'PERSONAL_SAFETY') {
      console.log("[STEP 1] Personal Safety button pressed");
      setShowActionModal(false);
      setShowPersonalSafetySelectionModal(true);
      return;
    }
    console.log(`[startEmergencyCountdown] entered with type: ${type}`);
    setShowActionModal(false);
    setSelectedEmergencyType(type);
    setCountdown(5);
    setShowCountdownOverlay(true);
  };

  const handleSelectFireSeverity = (severity: 'LOW' | 'MEDIUM' | 'HIGH') => {
    console.log(`[Fire Severity Selected] ${severity}`);
    setShowFireSeverityModal(false);
    setSelectedFireSeverity(severity);
    setSelectedEmergencyType('FIRE');
    setCountdown(5);
    setShowCountdownOverlay(true);
  };

  const handleCancelFireSeverity = () => {
    console.log('[Fire Severity Selection Cancelled]');
    setShowFireSeverityModal(false);
    setSelectedEmergencyType(null);
  };

  const handleSelectSafetyType = (type: 'WOMEN' | 'CHILD') => {
    console.log(`[Safety Type Selected] ${type}`);
    setShowPersonalSafetySelectionModal(false);
    setSelectedSafetyType(type);
    setSelectedEmergencyType('PERSONAL_SAFETY');
    setCountdown(5);
    setShowCountdownOverlay(true);
  };

  const handleCancelSafetySelection = () => {
    console.log('[Safety Selection Cancelled]');
    setShowPersonalSafetySelectionModal(false);
    setSelectedEmergencyType(null);
  };

  // Cancellation handler - Stops countdown immediately
  const handleCancelCountdown = () => {
    console.log(`[Emergency] Countdown cancelled for type: ${selectedEmergencyType}`);
    setShowCountdownOverlay(false);
    setSelectedEmergencyType(null);
    setSelectedFireSeverity(null);
    setSelectedSafetyType(null);
    setCountdown(null);
  };

  // Countdown completion handler - executes dedicated handler
  const handleCountdownCompletion = (type: EmergencyType) => {
    console.log('Emergency event ready to send');
    handleEmergency(type);
  };

  const handleSuccessAutoTransition = () => {
    setShowSuccessModal(false);
    if (activeEmergency?.emergencyType === 'POLICE') {
      setShowPoliceActiveModal(true);
    } else if (activeEmergency?.emergencyType === 'FIRE') {
      setShowFireActiveModal(true);
    } else if (activeEmergency?.emergencyType === 'PERSONAL_SAFETY') {
      setShowPersonalSafetyActiveModal(true);
    } else if (activeEmergency?.emergencyType === 'OTHER') {
      setShowGeneralEmergencyActiveModal(true);
    } else {
      setShowActiveModal(true);
    }
    setSelectedEmergencyType(null);
  };

  const handleTryAgain = () => {
    setShowFailureModal(false);
    if (selectedEmergencyType) {
      handleEmergency(selectedEmergencyType);
    }
  };

  const handleCloseFailure = () => {
    setShowFailureModal(false);
    setSelectedEmergencyType(null);
  };

  const handleCloseActiveHospitals = () => {
    setShowActiveModal(false);
  };

  const formatStartedTime = (createdAtStr: string) => {
    if (!createdAtStr) return 'Just now';
    try {
      const created = new Date(createdAtStr);
      const now = new Date();
      const diffMs = now.getTime() - created.getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      if (diffMins === 0) return 'Just now';
      if (diffMins === 1) return '1 minute ago';
      return `${diffMins} minutes ago`;
    } catch {
      return 'Just now';
    }
  };

  const handleCancelAlertCall = async () => {
    if (!activeEmergency) return;
    try {
      await cancelAlert(activeEmergency.emergencyId);
      setShowCancelModal(true);
      setActiveEmergency(null);
      setLiveTrackingActive(false);
    } catch (error) {
      setShowFailureModal(true);
    }
  };

  const handleResolveAlertCall = async () => {
    if (!activeEmergency) return;
    try {
      await resolveAlert(activeEmergency.emergencyId);
      setShowResolveModal(true);
      setActiveEmergency(null);
      setLiveTrackingActive(false);
    } catch (error) {
      setShowFailureModal(true);
    }
  };

  // Reusable unified emergency handling pipeline
  const handleEmergency = async (emergencyType: EmergencyType) => {
    if (emergencyType === 'POLICE') {
      console.log("[Police Emergency]");
    }
    console.log(`[STEP 2] handleEmergency entered with type: ${emergencyType}`);
    
    // Check validation and auth state
    let session;
    try {
      session = await getAuthData();
    } catch (error) {
      console.error("[STEP 2] Auth data retrieval failed:", error);
    }

    if (!session || !session.token || !session.user || !session.user.userId) {
      console.log("[STEP 2] Validation failed: missing userId or active auth session.");
      Alert.alert('Authentication Error', 'Active login session not found. Please sign out and sign in again.');
      setShowCountdownOverlay(false);
      setSelectedEmergencyType(null);
      setCountdown(null);
      return;
    }

    console.log("[STEP 3] Validation passed");

    // Request location permissions
    console.log("[STEP 4] Preparing emergency request: Requesting location permissions");
    let permissionStatus;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      permissionStatus = status;
    } catch (error) {
      console.error("[STEP 4] Location permission request crashed:", error);
    }

    if (permissionStatus !== 'granted') {
      console.log("[STEP 4] GPS permission denied.");
      Alert.alert('Location Permission Required', 'CareWave requires location services to dispatch emergency responders.');
      setShowCountdownOverlay(false);
      setSelectedEmergencyType(null);
      setCountdown(null);
      return;
    }

    // Collect GPS coordinates
    console.log("[STEP 4] Fetching current GPS location coordinates...");
    let locationData;
    try {
      locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log("[STEP 4] GPS Location acquired successfully:", locationData.coords);
    } catch (error) {
      console.error("[STEP 4] GPS acquisition failed:", error);
      setShowFailureModal(true);
      setShowCountdownOverlay(false);
      setSelectedEmergencyType(null);
      setCountdown(null);
      return;
    }

    const { latitude, longitude } = locationData.coords;

    if (emergencyType === 'POLICE') {
      console.log("[Police Emergency Request]");
    }
    console.log("[STEP 5] Sending POST /emergency");
    try {
      let res;
      if (emergencyType === 'FIRE') {
        const config = getFireConfiguration(selectedFireSeverity || 'LOW');
        res = await createEmergency(
          latitude,
          longitude,
          emergencyType,
          config.fireSeverity,
          config.evacuationMessage,
          config.emergencyRadiusKm
        );
      } else if (emergencyType === 'GENERAL') {
        res = await createEmergency(latitude, longitude, 'OTHER');
      } else {
        res = await createEmergency(latitude, longitude, emergencyType);
      }
      if (emergencyType === 'POLICE') {
        console.log("[Police Emergency Success]");
      }
      console.log("[STEP 5] POST /emergency succeeded. Response data:", res);

      // Mark Live Tracking status as ACTIVE
      setLiveTrackingActive(true);

      // Set active emergency state
      setActiveEmergency({
        emergencyId: res.emergencyId,
        emergencyStatus: res.emergencyStatus,
        emergencyType: res.emergencyType,
        createdAt: res.createdAt || new Date().toISOString()
      });

      // Dismiss countdown overlay
      setShowCountdownOverlay(false);
      setCountdown(null);

      // Show custom success modal
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error("[STEP 5] Emergency service creation request failed:", error);
      setShowFailureModal(true);
      setShowCountdownOverlay(false);
      setSelectedEmergencyType(null);
      setCountdown(null);
    }
  };

  // Quick Action click handlers
  const handleLiveTrackingPress = () => {
    console.log('[Quick Action] Live Tracking pressed.');
    onNavigateToMap(activeEmergency?.emergencyId);
  };

  const handleEmergencyHistoryPress = () => {
    console.log('[Quick Action] Emergency History pressed.');
    Alert.alert('Emergency History', 'No logs recorded in history.');
  };

  const handleEmergencyContactsPress = () => {
    console.log('[Quick Action] Emergency Contacts pressed.');
    Alert.alert('Emergency Contacts', 'Contacts registry will open here.');
  };

  const handleSafeZonesPress = () => {
    console.log('[Quick Action] Safe Zones pressed.');
    Alert.alert('Safe Zones', 'Geo-monitoring parameters will open here.');
  };

  const handleNearbyHospitalsPress = () => {
    console.log('[Quick Action] Nearby Hospitals pressed.');
    Alert.alert('Nearby Responders', 'Hospital dispatch network search initiated.');
  };

  const handleAIAssistantPress = () => {
    console.log('[Quick Action] AI Assistant pressed.');
    Alert.alert('AI Assistant', 'AI emergency assistance console will open here.');
  };

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Profile') {
      Alert.alert(
        'Profile Sign Out',
        'Would you like to sign out of the demo session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: handleSignOut }
        ]
      );
    } else if (tabName === 'LOCATION') {
      setActiveTab(tabName);
      handleLiveTrackingPress();
    } else {
      setActiveTab(tabName);
      console.log(`[Navigation] Tab ${tabName} pressed.`);
    }
  };

  const formatEmergencyTitle = (type: EmergencyType | null) => {
    if (!type) return '';
    return type.toLowerCase().replace('_', ' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.mainWrapper, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Curved red gradient header card */}
          <LinearGradient
            colors={['#E31B1B', '#8E1C1C']}
            style={styles.headerSection}
          >
            <View style={styles.headerRow}>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>Hello, {firstName}</Text>
                <Text style={styles.userNameText}>Stay Alert • Stay Safe</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.actionIconBtn}
                  onPress={() => Alert.alert('Notifications', 'Monitoring dispatch notifications.')}
                >
                  <Feather name="bell" size={20} color="#FFFFFF" />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.actionIconBtn}
                  onPress={() => handleTabPress('Profile')}
                >
                  <Feather name="user" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.contentBody}>
            {/* Active Emergency Card */}
            {activeEmergency && (
              <View style={styles.activeEmergencyCard}>
                <View style={styles.activeEmergencyHeader}>
                  <MaterialCommunityIcons name="alert-decagram" size={24} color="#FF3B30" />
                  <Text style={styles.activeEmergencyTitle}>🚨 ACTIVE EMERGENCY</Text>
                </View>
                
                <Text style={styles.activeEmergencyType}>
                  {activeEmergency.emergencyType === 'MEDICAL' ? 'Medical Emergency' : 
                   activeEmergency.emergencyType === 'POLICE' ? 'Police Emergency' : 
                   activeEmergency.emergencyType === 'FIRE' ? 'Fire Emergency' : 
                   activeEmergency.emergencyType === 'PERSONAL_SAFETY' ? 'PERSONAL SAFETY EMERGENCY' : 
                   activeEmergency.emergencyType === 'OTHER' ? 'GENERAL EMERGENCY' : 'Emergency Alert'}
                </Text>
                
                <View style={styles.activeEmergencyStatusRow}>
                  <Text style={styles.activeEmergencyLabel}>Status:</Text>
                  <View style={styles.activeEmergencyBadge}>
                    <Text style={styles.activeEmergencyBadgeText}>ACTIVE</Text>
                  </View>
                </View>
                
                <Text style={styles.activeEmergencyTime}>
                  Started: {elapsedTime}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.activeCardCancelBtn}
                  onPress={handleCancelAlertCall}
                >
                  <Text style={styles.activeCardCancelText}>CANCEL ALERT</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.activeCardResolveBtn}
                  onPress={handleResolveAlertCall}
                >
                  <Text style={styles.activeCardResolveText}>MARK RESOLVED</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SOS Emergency dispatch card */}
            <View style={styles.sosCard}>
              <View style={styles.sosTextContainer}>
                <Text style={styles.sosTitle}>Emergency SOS</Text>
                <Text style={styles.sosSubtitle}>
                  Instantly request emergency assistance
                </Text>
              </View>
              <SOSButton onPress={handleSOSPress} />
            </View>

            {/* AI Threat Detection Card */}
            <Pressable
              style={styles.aiCard}
              onPress={() => Alert.alert('AI Threat Detection', 'CareWave safety algorithm is scanning device telemetry.')}
            >
              <View style={styles.aiLeftRow}>
                <View style={styles.aiIconBox}>
                  <MaterialCommunityIcons name="brain" size={24} color="#FF5252" />
                </View>
                <View>
                  <Text style={styles.aiTitle}>AI Threat Detection</Text>
                  <Text style={styles.aiSubtitle}>Monitoring for unusual activity</Text>
                </View>
              </View>
              <View style={styles.aiRightRow}>
                <View style={styles.aiStatusBadge}>
                  <View style={styles.aiDot} />
                  <Text style={styles.aiStatusText}>Active</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#8E8E93" />
              </View>
            </Pressable>

            {/* Quick Actions 2-column Grid */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.gridContainer}>
              <View style={styles.gridRow}>
                <QuickActionCard
                  title="Live Tracking"
                  subtitle="Share live location"
                  icon="map-pin"
                  onPress={handleLiveTrackingPress}
                />
                <QuickActionCard
                  title="Emergency History"
                  subtitle="Previous alerts"
                  icon="clock"
                  onPress={handleEmergencyHistoryPress}
                />
              </View>
              <View style={styles.gridRow}>
                <QuickActionCard
                  title="Emergency Contacts"
                  subtitle="Trusted contacts"
                  icon="users"
                  onPress={handleEmergencyContactsPress}
                />
                <QuickActionCard
                  title="Safe Zones"
                  subtitle="Protected areas"
                  icon="shield"
                  onPress={handleSafeZonesPress}
                />
              </View>
              <View style={styles.gridRow}>
                <QuickActionCard
                  title="Nearby Hospitals"
                  subtitle="Emergency medical help"
                  icon="activity"
                  onPress={handleNearbyHospitalsPress}
                />
                <QuickActionCard
                  title="AI Assistant"
                  subtitle="Safety guidance"
                  icon="message-square"
                  onPress={handleAIAssistantPress}
                />
              </View>
            </View>

            {/* Detailed System Status Card */}
            <SystemStatusCard
              batteryLevel={batteryLevel}
              gpsEnabled={gpsEnabled}
              networkConnected={networkConnected}
              liveTrackingActive={liveTrackingActive}
            />

            {/* Extra padding at bottom to clear floating navigation bar */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Floating Bottom Navigation */}
        <BottomNavigationBar activeTab={activeTab} onTabPress={handleTabPress} />
      </Animated.View>

      {/* Emergency Actions Bottom-Sheet Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setShowActionModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Emergency Actions</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowActionModal(false)}
              >
                <Feather name="x" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalScroll}>
              {/* 2x2 Emergency Grid */}
              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.gridCard}
                  activeOpacity={0.75}
                  onPress={() => startEmergencyCountdown('MEDICAL')}
                >
                  <MaterialCommunityIcons name="ambulance" size={40} color="#FF5252" />
                  <Text style={styles.gridCardTitle}>Medical</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridCard}
                  activeOpacity={0.75}
                  onPress={() => startEmergencyCountdown('POLICE')}
                >
                  <MaterialCommunityIcons name="shield-car" size={40} color="#FF5252" />
                  <Text style={styles.gridCardTitle}>Police</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.gridRow}>
                <TouchableOpacity
                  style={styles.gridCard}
                  activeOpacity={0.75}
                  onPress={() => startEmergencyCountdown('FIRE')}
                >
                  <MaterialCommunityIcons name="fire" size={40} color="#FF5252" />
                  <Text style={styles.gridCardTitle}>Fire</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.gridCard}
                  activeOpacity={0.75}
                  onPress={() => startEmergencyCountdown('PERSONAL_SAFETY')}
                >
                  <MaterialCommunityIcons name="shield-alert" size={40} color="#FF5252" />
                  <Text style={styles.gridCardTitle}>Safety</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 16 }} />

              {/* Full Width General Emergency Button */}
              <TouchableOpacity
                style={styles.generalEmergencyBtn}
                activeOpacity={0.85}
                onPress={() => startEmergencyCountdown('GENERAL')}
              >
                <View style={styles.generalBtnContent}>
                  <MaterialCommunityIcons name="alarm-light" size={28} color="#FFFFFF" />
                  <Text style={styles.generalEmergencyText}>🚨 GENERAL EMERGENCY</Text>
                </View>
                <Text style={styles.generalEmergencySubtitle}>
                  Tap if unsure which emergency type to choose
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Emergency Countdown Overlay */}
      <Modal
        visible={showCountdownOverlay}
        transparent={false}
        animationType="fade"
      >
        <SafeAreaView style={styles.countdownContainer}>
          {showSuccessScreen ? (
            <View style={styles.successContent}>
              <View style={styles.successIconBox}>
                <Feather name="check" size={54} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Alert Broadcasted</Text>
              <Text style={styles.successSubtitle}>
                Simulated {formatEmergencyTitle(selectedEmergencyType)} emergency dispatched.
              </Text>
            </View>
          ) : (
            <View style={styles.countdownContent}>
              <View style={styles.warningIconBox}>
                <Feather name="alert-triangle" size={40} color="#FFFFFF" />
              </View>

              <Text style={styles.countdownTitle}>
                Sending {formatEmergencyTitle(selectedEmergencyType)} alert
              </Text>

              {/* Looping pulse animated timer circle */}
              <Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseScale }] }]}>
                <Text style={styles.timerNumber}>{countdown}</Text>
              </Animated.View>

              <Text style={styles.countdownWarning}>
                Responders are being dispatched. Tap below to abort this alert.
              </Text>

              {/* Cancel emergency alert button */}
              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.8}
                onPress={handleCancelCountdown}
              >
                <Text style={styles.cancelBtnText}>Cancel Alert</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Emergency Custom Flow Modals */}
      <EmergencySuccessModal
        visible={showSuccessModal}
        onAutoTransition={handleSuccessAutoTransition}
        emergencyType={selectedEmergencyType || (activeEmergency ? activeEmergency.emergencyType : null)}
        fireSeverity={selectedFireSeverity}
        selectedSafetyType={selectedSafetyType}
      />

      <EmergencyFailureModal
        visible={showFailureModal}
        onTryAgain={handleTryAgain}
        onClose={handleCloseFailure}
      />

      <EmergencyActiveModal
        visible={showActiveModal}
        onClose={handleCloseActiveHospitals}
      />

      <EmergencyCancelModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
      />

      <EmergencyResolveModal
        visible={showResolveModal}
        onClose={() => setShowResolveModal(false)}
      />

      <ActiveEmergencyExistsModal
        visible={showActiveEmergencyExistsModal}
        onViewActive={() => {
          setShowActiveEmergencyExistsModal(false);
          if (activeEmergency?.emergencyType === 'POLICE') {
            setShowPoliceActiveModal(true);
          } else if (activeEmergency?.emergencyType === 'FIRE') {
            setShowFireActiveModal(true);
          } else if (activeEmergency?.emergencyType === 'PERSONAL_SAFETY') {
            setShowPersonalSafetyActiveModal(true);
          } else if (activeEmergency?.emergencyType === 'OTHER') {
            setShowGeneralEmergencyActiveModal(true);
          } else {
            setShowActiveModal(true);
          }
        }}
        onClose={() => setShowActiveEmergencyExistsModal(false)}
      />

      <PoliceActiveModal
        visible={showPoliceActiveModal}
        onClose={() => setShowPoliceActiveModal(false)}
      />

      <FireSeverityModal
        visible={showFireSeverityModal}
        onSelectSeverity={handleSelectFireSeverity}
        onCancel={handleCancelFireSeverity}
      />

      <FireActiveModal
        visible={showFireActiveModal}
        onClose={() => setShowFireActiveModal(false)}
      />

      <PersonalSafetySelectionModal
        visible={showPersonalSafetySelectionModal}
        onSelectType={handleSelectSafetyType}
        onCancel={handleCancelSafetySelection}
      />

      <PersonalSafetyActiveModal
        visible={showPersonalSafetyActiveModal}
        selectedSafetyType={selectedSafetyType}
        onClose={() => setShowPersonalSafetyActiveModal(false)}
      />

      <GeneralEmergencyActiveModal
        visible={showGeneralEmergencyActiveModal}
        onClose={() => setShowGeneralEmergencyActiveModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  mainWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: SCREEN_HEIGHT < 700 ? 32 : 54,
    paddingBottom: SCREEN_HEIGHT < 700 ? 28 : 46,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    position: 'absolute',
    top: 10,
    right: 10,
    borderWidth: 1.5,
    borderColor: '#8E1C1C',
  },
  contentBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sosCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  sosTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sosSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '400',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 22,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  aiLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  aiSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  aiRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  aiStatusText: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: '700',
  },
  gridContainer: {
    width: '100%',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  // Modal layout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
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
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 16,
  },
  gridCard: {
    flex: 1,
    height: 110,
    backgroundColor: '#2C2C2E',
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    borderRadius: 20,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  gridCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  generalEmergencyBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 20,
    paddingVertical: 18,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FF5252',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  generalBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  generalEmergencyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  generalEmergencySubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  // Fullscreen Countdown
  countdownContainer: {
    flex: 1,
    backgroundColor: '#8E1C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  warningIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  countdownTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 36,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  timerNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countdownWarning: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  cancelBtn: {
    width: '85%',
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
  },
  activeEmergencyCard: {
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  activeEmergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeEmergencyTitle: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeEmergencyType: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  activeEmergencyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  activeEmergencyLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  activeEmergencyBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  activeEmergencyBadgeText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '800',
  },
  activeEmergencyTime: {
    color: '#E5E5EA',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 18,
  },
  activeCardBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  activeCardViewBtn: {
    flex: 1,
    backgroundColor: '#FF5252',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCardViewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  activeCardCancelBtn: {
    width: '100%',
    backgroundColor: '#2C2C2E',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeCardCancelText: {
    color: '#E5E5EA',
    fontSize: 14,
    fontWeight: '700',
  },
  activeCardResolveBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 199, 89, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCardResolveText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '700',
  },
});
