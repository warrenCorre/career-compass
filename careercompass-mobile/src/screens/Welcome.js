import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, Easing,
  SafeAreaView, StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AnimatedBackground from '../components/AnimatedBackground';

const { width } = Dimensions.get('window');

export default function Welcome() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Background + logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true }),
    ]).start();

    // Logo gentle float loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Staggered text entrance
    const delays = [400, 600, 800, 1000];
    [
      { anim: titleSlide, opacity: titleOpacity, to: 0, delay: delays[0] },
      { anim: subtitleSlide, opacity: subtitleOpacity, to: 0, delay: delays[1] },
      { anim: buttonSlide, opacity: buttonOpacity, to: 0, delay: delays[2] },
    ].forEach(({ anim, opacity, to, delay }) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(anim, { toValue: to, friction: 8, tension: 45, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
      }, delay);
    });

    // Button subtle pulse loop
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulse, { toValue: 1.04, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(buttonPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, 1400);
  }, []);

  const logoTranslateY = logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AnimatedBackground />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }, { translateY: logoTranslateY }] }}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleSlide }] }]}>
          CareerCompass
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity, transform: [{ translateY: subtitleSlide }] }]}>
          Discover your perfect career path with our Smart Guidance
        </Animated.Text>

        <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonSlide }, { scale: buttonPulse }] }}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('CategorySelection')}
            activeOpacity={0.85}
          >
            <Text style={styles.startButtonText}>Tap to Start</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  logo: { width: 110, height: 110, marginBottom: 24 },
  title: {
    fontSize: 38, fontWeight: '800', color: '#4A6A3B', marginBottom: 16, letterSpacing: 1,
  },
  subtitle: {
    fontSize: 17, color: '#666', textAlign: 'center', marginBottom: 50, lineHeight: 24, paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: '#4A6A3B', paddingVertical: 18, paddingHorizontal: 50, borderRadius: 35,
    shadowColor: '#4A6A3B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  startButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});