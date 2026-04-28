// src/components/LoadingSpinner.js
// Enhanced: double-ring spinner, breathing logo, subtle gradient pulse

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

export default function LoadingSpinner() {
  const rotateOuter = useRef(new Animated.Value(0)).current;
  const rotateInner = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation for outer ring (clockwise)
    const outerLoop = Animated.loop(
      Animated.timing(rotateOuter, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    outerLoop.start();

    // Continuous rotation for inner ring (counter‑clockwise, faster)
    const innerLoop = Animated.loop(
      Animated.timing(rotateInner, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    innerLoop.start();

    // Logo entrance: fade in + gentle scale
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 0.95,
            duration: 1200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    return () => {
      outerLoop.stop();
      innerLoop.stop();
    };
  }, []);

  const spinOuter = rotateOuter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinInner = rotateInner.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <View style={styles.container}>
      {/* Gradient pulse background – soft halo */}
      <Animated.View
        style={[
          styles.gradientPulse,
          {
            transform: [{ scale: logoScale }],
            opacity: logoOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          },
        ]}
      />

      {/* Outer spinner ring */}
      <Animated.View
        style={[
          styles.ring,
          styles.ringOuter,
          { transform: [{ rotate: spinOuter }] },
        ]}
      />

      {/* Inner spinner ring (rotates opposite direction) */}
      <Animated.View
        style={[
          styles.ring,
          styles.ringInner,
          { transform: [{ rotate: spinInner }] },
        ]}
      />

      {/* Logo – fades in and breathes */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const RING_SIZE = 90;
const LOGO_SIZE = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  gradientPulse: {
    position: 'absolute',
    width: RING_SIZE + 40,
    height: RING_SIZE + 40,
    borderRadius: (RING_SIZE + 40) / 2,
    opacity: 0.2,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#4A6A3B',
    borderStyle: 'solid',
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderTopColor: '#4A6A3B',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.7,
  },
  ringInner: {
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderTopColor: 'transparent',
    borderRightColor: '#A3C9A8',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    opacity: 0.6,
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});