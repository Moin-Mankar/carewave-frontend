import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getAlertsHistory, Alert } from '../services/alertsService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AlertsScreenProps {
  onNavigateBack: () => void;
  onNavigateToMap: (emergencyId: string) => void;
}

export default function AlertsScreen({ onNavigateBack, onNavigateToMap }: AlertsScreenProps) {
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getAlertsHistory();
      setAlerts(data);
    } catch (err: any) {
      console.error('[AlertsScreen] Error loading alert history:', err);
      setError(err.message || 'Failed to fetch alert history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'MEDICAL_SOS':
        return { name: 'heart-half', color: '#FF5252' };
      case 'POLICE_SOS':
        return { name: 'shield-checkmark', color: '#0A84FF' };
      case 'FIRE_SOS':
        return { name: 'flame', color: '#FF9F0A' };
      case 'GEOFENCE_BREACH':
        return { name: 'navigate', color: '#FF2D55' };
      case 'OFFLINE':
        return { name: 'cloud-offline', color: '#8E8E93' };
      case 'GPS_DISABLED':
        return { name: 'pin-outline', color: '#FF9F0A' };
      case 'SAFETY_CHECK_IN':
        return { name: 'shield-outline', color: '#FFCC00' };
      case 'GENERAL_ALERT':
      default:
        return { name: 'warning', color: '#8E8E93' };
    }
  };

  const getAlertTypeName = (type: string) => {
    switch (type) {
      case 'MEDICAL_SOS':
        return 'MEDICAL SOS';
      case 'POLICE_SOS':
        return 'POLICE SOS';
      case 'FIRE_SOS':
        return 'FIRE SOS';
      case 'GEOFENCE_BREACH':
        return 'GEOFENCE BREACH';
      case 'OFFLINE':
        return 'OFFLINE ALERT';
      case 'GPS_DISABLED':
        return 'GPS DISABLED';
      case 'SAFETY_CHECK_IN':
        return 'SAFETY CHECK-IN';
      case 'GENERAL_ALERT':
      default:
        return 'GENERAL EMERGENCY';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#FF5252';
      case 'RESOLVED':
        return '#4CD964';
      case 'CANCELLED':
      default:
        return '#8E8E93';
    }
  };

  const formatAlertDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const time = `${hours}:${minutes} ${ampm}`;
      
      return `${date} • ${time}`;
    } catch (err) {
      return dateStr;
    }
  };

  const handleOpenGoogleMaps = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    Linking.openURL(url).catch((err) => console.error('Error opening Google Maps:', err));
  };

  // Filter alerts by relationship
  const myAlerts = alerts.filter((a) => a.relationship === 'CREATED_BY_ME');
  const monitoringAlerts = alerts.filter((a) => a.relationship === 'MONITORING');

  const renderAlertCard = (alert: Alert) => {
    const iconInfo = getAlertIcon(alert.alertType);
    const typeName = getAlertTypeName(alert.alertType);
    const isCreatedByMe = alert.relationship === 'CREATED_BY_ME';
    const statusColor = getStatusColor(alert.status);
    const hasCoordinates = alert.latitude !== null && alert.longitude !== null;
    const canOpenTracking = alert.status === 'ACTIVE' && alert.trackingSessionId !== null;

    return (
      <View key={alert.alertId} style={[styles.card, isCreatedByMe ? styles.myCardBorder : styles.monitoringCardBorder]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Ionicons name={iconInfo.name as any} size={22} color={iconInfo.color} />
          </View>
          <View style={styles.cardTitleCol}>
            <Text style={styles.cardTypeName}>{typeName}</Text>
            <Text style={styles.cardOwnerName}>{alert.ownerName}</Text>
            <Text style={styles.cardTimestamp}>{formatAlertDateTime(alert.createdAt)}</Text>
          </View>
          <View style={styles.cardStatusCol}>
            <View style={[styles.statusBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '10' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{alert.status}</Text>
            </View>
            <View style={[styles.relationshipBadge, isCreatedByMe ? styles.badgeMyAlert : styles.badgeMonitoring]}>
              <Text style={[styles.relationshipBadgeText, { color: isCreatedByMe ? '#FF5252' : '#0A84FF' }]}>
                {isCreatedByMe ? 'YOU CREATED' : 'MONITORING'}
              </Text>
            </View>
          </View>
        </View>

        {/* Buttons Action Row */}
        <View style={styles.cardActions}>
          {hasCoordinates && (
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => setSelectedAlert(alert)}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={16} color="#8E8E93" style={{ marginRight: 4 }} />
              <Text style={styles.detailsBtnText}>View Details</Text>
            </TouchableOpacity>
          )}

          {canOpenTracking && (
            <TouchableOpacity
              style={styles.trackingBtn}
              onPress={() => onNavigateToMap(alert.trackingSessionId!)}
              activeOpacity={0.8}
            >
              <Ionicons name="map" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.trackingBtnText}>Open Tracking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ALERTS CENTER</Text>
        <TouchableOpacity onPress={() => fetchAlerts(true)} style={styles.reloadBtn} activeOpacity={0.8}>
          <Ionicons name="refresh" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main List content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5252" />
          <Text style={styles.statusText}>Loading alerts history...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color="#FF5252" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAlerts()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchAlerts(true)} tintColor="#FF5252" />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1 - My Alerts */}
          <Text style={styles.sectionHeader}>MY ALERTS ({myAlerts.length})</Text>
          {myAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No alerts created yet.</Text>
            </View>
          ) : (
            myAlerts.map(renderAlertCard)
          )}

          {/* Section 2 - Alerts I'm Monitoring */}
          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>
            ALERTS I'M MONITORING ({monitoringAlerts.length})
          </Text>
          {monitoringAlerts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No alerts received from linked contacts.</Text>
            </View>
          ) : (
            monitoringAlerts.map(renderAlertCard)
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={selectedAlert !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alert Details</Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)} style={styles.closeModalBtn}>
                <Feather name="x" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {selectedAlert && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Alert Type:</Text>
                  <Text style={styles.detailValue}>{getAlertTypeName(selectedAlert.alertType)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Triggered By:</Text>
                  <Text style={styles.detailValue}>
                    {selectedAlert.alertSourceUserName} ({selectedAlert.relationship === 'CREATED_BY_ME' ? 'You' : 'Contact'})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedAlert.status), fontWeight: '800' }]}>
                    {selectedAlert.status}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occurred At:</Text>
                  <Text style={styles.detailValue}>{formatAlertDateTime(selectedAlert.createdAt)}</Text>
                </View>

                {selectedAlert.latitude !== null && selectedAlert.longitude !== null && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>GPS Position:</Text>
                      <Text style={styles.detailValue}>
                        {selectedAlert.latitude.toFixed(5)}, {selectedAlert.longitude.toFixed(5)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.mapLinkBtn}
                      onPress={() => handleOpenGoogleMaps(selectedAlert.latitude!, selectedAlert.longitude!)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-google" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.mapLinkBtnText}>View on Google Maps</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
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
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    backgroundColor: '#1C1C1E',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF5252',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#FF5252',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  myCardBorder: {
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  monitoringCardBorder: {
    borderColor: 'rgba(10, 132, 255, 0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  cardTypeName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardOwnerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  cardTimestamp: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
  cardStatusCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 48,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  relationshipBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeMyAlert: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  badgeMonitoring: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  relationshipBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
    gap: 8,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailsBtnText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
  },
  trackingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#2C2C2E',
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  mapLinkBtn: {
    backgroundColor: '#D32F2F',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  mapLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
