import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { getLiveLocation } from '../services/trackingService';

interface LiveTrackingMapScreenProps {
  emergencyId: string | undefined;
  onNavigateBack: () => void;
}

export default function LiveTrackingMapScreen({ emergencyId, onNavigateBack }: LiveTrackingMapScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const loadLocation = async () => {
    if (!emergencyId) {
      setError('Error: Emergency ID is missing.');
      setLoading(false);
      return;
    }

    try {
      if (!coordinates) {
        setLoading(true);
      }
      setError(null);
      console.log('[LiveTracking Fetch] Fetching coordinates');
      const location = await getLiveLocation(emergencyId);

      if (location.latitude === null || location.longitude === null || location.latitude === undefined || location.longitude === undefined) {
        setError('No coordinates available for the emergency event.');
      } else {
        console.log(`[LiveTracking Fetch] Latitude: ${location.latitude}`);
        console.log(`[LiveTracking Fetch] Longitude: ${location.longitude}`);
        setCoordinates({ latitude: location.latitude, longitude: location.longitude });
      }
    } catch (err: any) {
      console.error('[LiveTracking] Failed to load live location:', err);
      setError(err.message || 'Failed to load live tracking location.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (emergencyId) {
      console.log('[LiveTracking Fetch] Interval Started');
      loadLocation();

      intervalId = setInterval(() => {
        loadLocation();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('[LiveTracking Fetch] Interval Stopped');
      }
    };
  }, [emergencyId]);

  const htmlContent = coordinates ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          background-color: #0F0F11;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false,
          attributionControl: false
        }).setView([${coordinates.latitude}, ${coordinates.longitude}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        var marker = L.marker([${coordinates.latitude}, ${coordinates.longitude}]).addTo(map);
        marker.bindPopup("<b>Tracked User</b>").openPopup();
      </script>
    </body>
    </html>
  ` : '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>LIVE LOCATION</Text>
        </View>
        {!loading && (
          <TouchableOpacity onPress={loadLocation} style={styles.refreshBtn} activeOpacity={0.8}>
            <Ionicons name="refresh" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Map View / Loading / Error State */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Fetching live location...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF453A" style={{ marginBottom: 16 }} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onNavigateBack} style={styles.errorBtn} activeOpacity={0.8}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{ html: htmlContent }}
            originWhitelist={['*']}
            domStorageEnabled={true}
            javaScriptEnabled={true}
          />
        </View>
      )}
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    backgroundColor: '#1C1C1E',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginLeft: 12,
    color: '#FFFFFF',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F11',
    padding: 30,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#FF453A',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  errorBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
