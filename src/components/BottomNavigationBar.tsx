import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, Animated } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface BottomNavigationBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export default function BottomNavigationBar({ activeTab, onTabPress }: BottomNavigationBarProps) {
  const tabs = [
    { name: 'Home', icon: 'home', type: 'Feather' },
    { name: 'Alerts', icon: 'bell', type: 'Feather' },
    { name: 'LOCATION', icon: 'map-marker-radius', type: 'MaterialCommunityIcons', isCenter: true },
    { name: 'Contacts', icon: 'users', type: 'Feather' },
    { name: 'Profile', icon: 'user', type: 'Feather' },
  ];

  const scaleAnims = {
    Home: useRef(new Animated.Value(1)).current,
    Alerts: useRef(new Animated.Value(1)).current,
    LOCATION: useRef(new Animated.Value(1)).current,
    Contacts: useRef(new Animated.Value(1)).current,
    Profile: useRef(new Animated.Value(1)).current,
  };

  const handlePressIn = (tabName: string) => {
    Animated.spring(scaleAnims[tabName as keyof typeof scaleAnims], {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (tabName: string) => {
    Animated.spring(scaleAnims[tabName as keyof typeof scaleAnims], {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
    onTabPress(tabName);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.barContainer}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.name;
          const currentScale = scaleAnims[tab.name as keyof typeof scaleAnims];

          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                activeOpacity={0.9}
                onPressIn={() => handlePressIn(tab.name)}
                onPressOut={() => handlePressOut(tab.name)}
                style={styles.centerTabWrapper}
              >
                <Animated.View style={[
                  styles.centerTab, 
                  isSelected && styles.centerTabSelected,
                  { transform: [{ scale: currentScale }] }
                ]}>
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={28}
                    color="#FFFFFF"
                  />
                  <Text style={styles.centerTabText}>LOCATION</Text>
                </Animated.View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.8}
              onPressIn={() => handlePressIn(tab.name)}
              onPressOut={() => handlePressOut(tab.name)}
              style={styles.tab}
            >
              <Animated.View style={[styles.tabContent, { transform: [{ scale: currentScale }] }]}>
                {tab.type === 'Feather' ? (
                  <Feather
                    name={tab.icon as any}
                    size={20}
                    color={isSelected ? '#FF5252' : '#8E8E93'}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={tab.icon as any}
                    size={20}
                    color={isSelected ? '#FF5252' : '#8E8E93'}
                  />
                )}
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                  {tab.name}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  barContainer: {
    flexDirection: 'row',
    width: width - 32,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 24,
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: 4,
  },
  tabText: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '600',
    marginTop: 4,
  },
  tabTextSelected: {
    color: '#FF5252',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF5252',
    position: 'absolute',
    bottom: -6,
  },
  centerTabWrapper: {
    width: 76,
    height: 76,
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerTab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F0F11',
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  centerTabSelected: {
    backgroundColor: '#FF5252',
    borderColor: '#FFFFFF',
  },
  centerTabText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
});
