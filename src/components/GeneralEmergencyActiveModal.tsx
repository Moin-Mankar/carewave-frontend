import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface GeneralEmergencyActiveModalProps {
  visible: boolean;
  contacts?: Contact[];
  onClose: () => void;
}

export default function GeneralEmergencyActiveModal({
  visible,
  contacts = [], // Default to empty list for placeholder state
  onClose,
}: GeneralEmergencyActiveModalProps) {
  
  const handleCallContact = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => console.error('Error opening dialer:', err));
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <TouchableOpacity
        style={styles.callContactBtn}
        activeOpacity={0.8}
        onPress={() => handleCallContact(item.phoneNumber)}
      >
        <MaterialCommunityIcons name="phone" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Main Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌐 GENERAL EMERGENCY ACTIVE</Text>
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

          {contacts.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons name="account-multiple-remove-outline" size={64} color="#8E8E93" />
              </View>
              <Text style={styles.emptyTextTitle}>No emergency contacts available</Text>
              <Text style={styles.emptyTextSubtitle}>
                Add emergency contacts to enable quick calling during emergencies.
              </Text>
            </View>
          ) : (
            /* Future Contacts List */
            <FlatList
              data={contacts}
              keyExtractor={(item) => item.id}
              renderItem={renderContactItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomBar}>
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
  header: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  emptyState: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(142, 142, 147, 0.25)',
  },
  emptyTextTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyTextSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderWidth: 1.5,
    borderColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  callContactBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 20,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
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
