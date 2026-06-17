import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FireActiveModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function FireActiveModal({ visible, onClose }: FireActiveModalProps) {
  const insets = useSafeAreaInsets();
  const handleCallFireBrigade = () => {
    Linking.openURL('tel:101').catch((err) => console.error('Error opening dialer:', err));
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Main Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="fire" size={80} color="#FF3B30" />
          </View>

          <Text style={styles.title}>🔥 FIRE ALERT ACTIVE</Text>
          <Text style={styles.subtitle}>
            Emergency has been registered successfully.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCallFireBrigade}
            style={styles.callBtn}
          >
            <MaterialCommunityIcons name="phone" size={24} color="#FFFFFF" />
            <Text style={styles.callBtnText}>CALL FIRE BRIGADE (101)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.dismissBtn}
          >
            <Text style={styles.dismissBtnText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 10,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 20,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    gap: 12,
  },
  callBtn: {
    backgroundColor: '#D32F2F',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: {
    color: '#E5E5EA',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
