// src/navigation/BottomTabNavigator.js
// Instant clicks + Android navigation bar matches the tab bar colour

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Animated, Pressable, Platform, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RetakeConfirmationModal from '../components/RetakeConfirmationModal';

import Dashboard from '../screens/Dashboard';
import Results from '../screens/Results';

const Tab = createBottomTabNavigator();

// Animation presets – instant press feel, smooth release
const SPRING_QUICK   = { friction: 5,   tension: 200, useNativeDriver: true };
const SPRING_BOUNCY  = { friction: 3.5, tension: 220, useNativeDriver: true };
const TIMING_INSTANT = { duration: 0,   useNativeDriver: true }; // zero-delay for instant response
const TIMING_PRESS   = { duration: 60,  useNativeDriver: true };

// Helper – apply nav-bar colour reliably on Android
const applyAndroidNavBar = () => {
  if (Platform.OS === 'android') {
    NavigationBar.setBackgroundColorAsync('#ffffff').catch(() => {});
    NavigationBar.setButtonStyleAsync('dark').catch(() => {});
  }
};

// ----------------------------- Tab Button -----------------------------
const TabButton = React.memo(
  ({ label, iconFilled, iconOutline, isFocused, color, inactiveColor, onPress }) => {
    const scaleAnim     = useRef(new Animated.Value(1)).current;
    const translateYAnim = useRef(new Animated.Value(0)).current;

    const onPressIn = useCallback(() => {
      Animated.parallel([
        Animated.timing(scaleAnim,      { toValue: 0.88, ...TIMING_INSTANT }),
        Animated.timing(translateYAnim, { toValue: 3,    ...TIMING_INSTANT }),
      ]).start();
    }, []);

    const onPressOut = useCallback(() => {
      Animated.parallel([
        Animated.spring(scaleAnim,      { toValue: 1, ...SPRING_QUICK }),
        Animated.spring(translateYAnim, { toValue: 0, ...SPRING_QUICK }),
      ]).start();
    }, []);

    return (
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.tabButton}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={`${label} tab`}
        android_ripple={null}         // disable default ripple so our animation is the only feedback
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View
          style={[
            styles.tabIconContainer,
            { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] },
          ]}
        >
          <Icon
            name={isFocused ? iconFilled : iconOutline}
            size={24}
            color={isFocused ? color : inactiveColor}
          />
          {isFocused && <View style={styles.activeDot} />}
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? color : inactiveColor, fontWeight: isFocused ? '700' : '500' },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    );
  }
);

// ----------------------------- Center Floating Button -----------------------------
const CenterButton = React.memo(({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,  duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const onPressIn = useCallback(() => {
    Animated.timing(scaleAnim, { toValue: 0.82, ...TIMING_INSTANT }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, ...SPRING_BOUNCY }).start();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.centerButtonWrapper}
      accessibilityRole="button"
      accessibilityLabel="Retake assessment"
      android_ripple={null}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          styles.centerButton,
          { transform: [{ scale: scaleAnim }, { translateY: floatAnim }] },
        ]}
      >
        <Icon name="plus" size={30} color="#fff" />
      </Animated.View>
      <Text style={styles.centerLabel}>Retake</Text>
    </Pressable>
  );
});

// ----------------------------- Custom Tab Bar -----------------------------
function CustomTabBar({ state, navigation, onRetakePress }) {
  const insets       = useSafeAreaInsets();
  const activeColor  = '#4A6A3B';
  const inactiveColor = '#9CA3AF';

  // Apply on mount and every time the app comes back to foreground (handles nav-bar resets)
  useEffect(() => {
    applyAndroidNavBar();

    if (Platform.OS === 'android') {
      const sub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') applyAndroidNavBar();
      });
      return () => sub.remove();
    }
  }, []);

  return (
    <View style={[styles.outerContainer, { paddingBottom: insets.bottom, backgroundColor: '#ffffff' }]}>
      <View style={styles.tabBarBackground}>
        <View style={styles.tabBarRow}>
          <View style={styles.tabSlot}>
            <TabButton
              label="Dashboard"
              iconFilled="view-dashboard"
              iconOutline="view-dashboard-outline"
              isFocused={state.index === state.routes.findIndex(r => r.name === 'Dashboard')}
              color={activeColor}
              inactiveColor={inactiveColor}
              onPress={() => navigation.navigate('Dashboard')}
            />
          </View>
          <View style={styles.centerSlot} />
          <View style={styles.tabSlot}>
            <TabButton
              label="Results"
              iconFilled="chart-box"
              iconOutline="chart-box-outline"
              isFocused={state.index === state.routes.findIndex(r => r.name === 'Results')}
              color={activeColor}
              inactiveColor={inactiveColor}
              onPress={() => navigation.navigate('Results')}
            />
          </View>
        </View>
      </View>
      <View style={styles.centerButtonContainer} pointerEvents="box-none">
        <CenterButton onPress={onRetakePress} />
      </View>
    </View>
  );
}

function RetakeScreen() { return null; }

export default function BottomTabNavigator({ navigation }) {
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  return (
    <>
      <Tab.Navigator
        tabBar={(props) => (
          <CustomTabBar {...props} onRetakePress={() => setShowRetakeModal(true)} />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Retake"    component={RetakeScreen} />
        <Tab.Screen name="Results"   component={Results} />
      </Tab.Navigator>
      <RetakeConfirmationModal
        visible={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        onConfirm={() => {
          setShowRetakeModal(false);
          navigation.navigate('CategorySelection');
        }}
      />
    </>
  );
}

// ----------------------------- Styles -----------------------------
const BAR_HEIGHT         = 56;
const CENTER_BUTTON_SIZE = 58;

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#ffffff',
  },
  tabBarBackground: {
    backgroundColor: '#ffffff',
    borderTopWidth: 2.5,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06 + 0.04, // subtle shadow for depth
    shadowRadius: 8,
  },
  tabBarRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    alignItems: 'center',
    paddingTop: 6
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    width: CENTER_BUTTON_SIZE + 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 48,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    width: 40,
    marginBottom: 1,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4A6A3B',
    opacity: 0.9,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 0,
  },
  centerButtonContainer: {
    position: 'absolute',
    top: -(CENTER_BUTTON_SIZE / 2) + 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  centerButtonWrapper: {
    alignItems: 'center',
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: '#4A6A3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A6A3B',
    marginTop: 4,
    textAlign: 'center',
  },
});