// src/components/AppLoadingScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');
const LOGO_SIZE = 100;
const TRACK_WIDTH = width * 0.55;
const SHIMMER_WIDTH = 64;

export default function AppLoadingScreen() {
  // Logo pulse
  const logoScale = useRef(new Animated.Value(0.95)).current;

  // Shimmer position
  const shimmerPos = useRef(new Animated.Value(-SHIMMER_WIDTH)).current;

  // Fade in for the whole screen
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Screen fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Logo breathing loop
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.95,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    // Shimmer sliding loop
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerPos, {
          toValue: TRACK_WIDTH + SHIMMER_WIDTH,
          duration: 2200,
          useNativeDriver: true,
        }),
        // Instant reset to start
        Animated.timing(shimmerPos, {
          toValue: -SHIMMER_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    logoLoop.start();
    shimmerLoop.start();

    return () => {
      logoLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image
            source={require('../assets/logo.png')} // adjust path if needed
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>CareerCompass</Text>
        <Text style={styles.tagline}>Navigate Your Future</Text>

        {/* Progress indicator – thin track with shimmer */}
        <View style={styles.track}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerPos }] },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: 28,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#4A6A3B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 48,
  },
  track: {
    width: TRACK_WIDTH,
    height: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 1.5,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  shimmer: {
    width: SHIMMER_WIDTH,
    height: '100%',
    backgroundColor: '#4A6A3B',
    borderRadius: 1.5,
    opacity: 0.6,
  },
});