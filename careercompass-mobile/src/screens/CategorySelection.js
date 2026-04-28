// src/screens/CategorySelection.js
// Fixed: no flash for returning users – dashboard and categories load in parallel
// Also fixed: nested TouchableOpacity conflict that prevented navigation to PersonalAssessment

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert,
  ActivityIndicator, Dimensions, StatusBar, Animated, Platform, Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;
const CARD_WIDTH = (width - 48) / 2;

const CATEGORY_ICONS = {
  'Technology': 'laptop',
  'Health & Medical Science': 'heart',
  'Education': 'school',
  'Engineering': 'engine',
  'Arts, Media, & Communication': 'palette',
  'Social Sciences': 'account-group',
  'Hospitality & Tourism': 'briefcase',
  'Business & Management': 'chart-line',
};

const fallbackImages = {
  'Technology': require('../assets/technology.png'),
  'Health & Medical Science': require('../assets/healthmedicalscience.png'),
  'Education': require('../assets/education.png'),
  'Engineering': require('../assets/engineering.png'),
  'Arts, Media, & Communication': require('../assets/artsmediacommunication.png'),
  'Social Sciences': require('../assets/socialscience.png'),
  'Hospitality & Tourism': require('../assets/hospitalitytourism.png'),
  'Business & Management': require('../assets/businessmanagement.png'),
};

// ─── Pulsing Loading Screen ─────────────────────────────────────────────────
function LoadingScreen() {
  const pulse1 = useRef(new Animated.Value(0.6)).current;
  const pulse2 = useRef(new Animated.Value(0.4)).current;
  const pulse3 = useRef(new Animated.Value(0.2)).current;
  const iconScale = useRef(new Animated.Value(0.85)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    const makePulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, {
            toValue: anim === pulse1 ? 0.6 : anim === pulse2 ? 0.4 : 0.2,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );

    const iconPulse = Animated.loop(
      Animated.sequence([
        Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.spring(iconScale, { toValue: 0.85, friction: 4, tension: 60, useNativeDriver: true }),
      ])
    );

    const p1 = makePulse(pulse1, 0);
    const p2 = makePulse(pulse2, 260);
    const p3 = makePulse(pulse3, 520);

    p1.start(); p2.start(); p3.start(); iconPulse.start();
    return () => { p1.stop(); p2.stop(); p3.stop(); iconPulse.stop(); };
  }, []);

  return (
    <Animated.View style={[loadingStyles.container, { opacity: fadeIn }]}>
      <View style={loadingStyles.ringWrapper}>
        <Animated.View
          style={[
            loadingStyles.ring,
            loadingStyles.ring3,
            {
              opacity: pulse3,
              transform: [
                {
                  scale: pulse3.interpolate({
                    inputRange: [0.2, 1],
                    outputRange: [0.9, 1.15],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            loadingStyles.ring,
            loadingStyles.ring2,
            {
              opacity: pulse2,
              transform: [
                {
                  scale: pulse2.interpolate({
                    inputRange: [0.4, 1],
                    outputRange: [0.92, 1.08],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View style={[loadingStyles.ring, loadingStyles.ring1, { opacity: pulse1 }]} />
        <Animated.View style={[loadingStyles.iconCircle, { transform: [{ scale: iconScale }] }]}>
          <Icon name="compass-outline" size={36} color="#fff" />
        </Animated.View>
      </View>
      <Text style={loadingStyles.title}>Finding Your Path</Text>
      <Text style={loadingStyles.subtitle}>Loading career categories…</Text>
      <View style={loadingStyles.dotsRow}>
        {[0, 1, 2].map((i) => {
          const dotAnim = [pulse1, pulse2, pulse3][i];
          return <Animated.View key={i} style={[loadingStyles.dot, { opacity: dotAnim }]} />;
        })}
      </View>
    </Animated.View>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  ringWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ring1: {
    width: 90,
    height: 90,
    borderColor: 'rgba(74,106,59,0.55)',
    backgroundColor: 'rgba(74,106,59,0.06)',
  },
  ring2: {
    width: 120,
    height: 120,
    borderColor: 'rgba(74,106,59,0.3)',
  },
  ring3: {
    width: 155,
    height: 155,
    borderColor: 'rgba(74,106,59,0.15)',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4A6A3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A6A3B',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4A6A3B',
  },
});
// ─── End Loading Screen ────────────────────────────────────────────────────

// ─── Category Detail Modal ─────────────────────────────────────────────────
function CategoryDetailModal({ visible, category, onClose, onStart, isGuest }) {
  const iconName = CATEGORY_ICONS[category?.name] || 'folder';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  if (!category) return null;

  const getImageSource = () => {
    if (category.image_url) {
      if (category.image_url.startsWith('/'))
        return { uri: `${api.defaults.baseURL}${category.image_url}` };
      return { uri: category.image_url };
    }
    return fallbackImages[category.name] || fallbackImages['Technology'];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={modalStyles.overlay}>
        <Animated.View style={[modalStyles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Image source={getImageSource()} style={modalStyles.image} resizeMode="cover" />
          <View style={modalStyles.imageOverlay} />
          <View style={modalStyles.content}>
            <View style={modalStyles.iconContainer}>
              <Icon name={iconName} size={36} color="#4A6A3B" />
            </View>
            <Text style={modalStyles.title}>{category.name}</Text>
            <Text style={modalStyles.description}>{category.description}</Text>
            {category.courses_count !== undefined && (
              <View style={modalStyles.statRow}>
                <Icon name="school" size={18} color="#4A6A3B" />
                <Text style={modalStyles.statText}>{category.courses_count} programs available</Text>
              </View>
            )}
            {isGuest ? (
              <View style={modalStyles.authButtonGroup}>
                <View style={modalStyles.authHintRow}>
                  <Icon name="lock-outline" size={16} color="#9CA3AF" />
                  <Text style={modalStyles.authHintText}>
                    An account is required to take the assessment
                  </Text>
                </View>
                <TouchableOpacity
                  style={modalStyles.startButton}
                  onPress={() => onStart('login')}
                  activeOpacity={0.85}
                >
                  <Icon name="login" size={20} color="#fff" />
                  <Text style={modalStyles.startButtonText}>Log In & Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.registerButton}
                  onPress={() => onStart('signup')}
                  activeOpacity={0.85}
                >
                  <Icon name="account-plus-outline" size={20} color="#4A6A3B" />
                  <Text style={modalStyles.registerButtonText}>Create Account & Start</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={modalStyles.startButton}
                onPress={() => onStart('assessment')}
                activeOpacity={0.85}
              >
                <Text style={modalStyles.startButtonText}>Start Assessment</Text>
                <Icon name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={modalStyles.closeButtonText}>Choose Another</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  image: { width: '100%', height: 160 },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: { padding: 24, alignItems: 'center', marginTop: -36 },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F7F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
  },
  statText: { fontSize: 14, color: '#4A6A3B', fontWeight: '500' },
  authButtonGroup: { width: '100%', gap: 10 },
  authHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 6,
  },
  authHintText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', flex: 1 },
  startButton: {
    width: '100%',
    backgroundColor: '#4A6A3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerButton: {
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#4A6A3B',
  },
  registerButtonText: { color: '#4A6A3B', fontSize: 16, fontWeight: '600' },
  closeButton: { marginTop: 14, paddingVertical: 10 },
  closeButtonText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
// ─── End Modal ─────────────────────────────────────────────────────────────

// ─── Category Card – FIXED: removed nested TouchableOpacity ────────────────
const CategoryCard = React.memo(
  ({ category, isSelected, onSelect, onContinue, index }) => {
    const iconName = CATEGORY_ICONS[category.name] || 'folder';

    // Entrance
    const entranceY = useRef(new Animated.Value(40)).current;
    const entranceScale = useRef(new Animated.Value(0.88)).current;
    const entranceOpacity = useRef(new Animated.Value(0)).current;

    // Press feedback
    const cardScale = useRef(new Animated.Value(1)).current;

    // Selection state
    const selectedProgress = useRef(new Animated.Value(0)).current; // 0→1
    const checkmarkScale = useRef(new Animated.Value(0)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(1)).current;

    // Shine sweep (translateX) – runs once on select
    const shineX = useRef(new Animated.Value(-CARD_WIDTH)).current;

    // ── Entrance animation (staggered by index)
    useEffect(() => {
      const delay = index * 55;
      Animated.parallel([
        Animated.timing(entranceOpacity, {
          toValue: 1,
          duration: 380,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(entranceY, {
          toValue: 0,
          delay,
          friction: 9,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.spring(entranceScale, {
          toValue: 1,
          delay,
          friction: 9,
          tension: 55,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // ── Selection animation
    useEffect(() => {
      if (isSelected) {
        shineX.setValue(-CARD_WIDTH);
        Animated.parallel([
          Animated.spring(selectedProgress, {
            toValue: 1,
            friction: 7,
            tension: 80,
            useNativeDriver: false,
          }),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            friction: 6,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1.15,
            friction: 5,
            tension: 70,
            useNativeDriver: true,
          }),
          Animated.timing(shineX, {
            toValue: CARD_WIDTH * 2,
            duration: 520,
            delay: 80,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.spring(selectedProgress, {
            toValue: 0,
            friction: 7,
            tension: 80,
            useNativeDriver: false,
          }),
          Animated.timing(checkmarkScale, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 0,
            duration: 140,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            friction: 5,
            tension: 70,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [isSelected]);

    const handlePressIn = () =>
      Animated.spring(cardScale, {
        toValue: 0.965,
        friction: 10,
        tension: 140,
        useNativeDriver: true,
      }).start();
    const handlePressOut = () =>
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 10,
        tension: 140,
        useNativeDriver: true,
      }).start();

    // FIXED: When selected, tapping the card calls onContinue, otherwise onSelect
    const handleCardPress = () => {
      if (isSelected) {
        onContinue(category);
      } else {
        onSelect(category);
      }
    };

    const getImageSource = () => {
      if (category.image_url) {
        if (category.image_url.startsWith('/'))
          return { uri: `${api.defaults.baseURL}${category.image_url}` };
        return { uri: category.image_url };
      }
      return fallbackImages[category.name] || fallbackImages['Technology'];
    };

    const overlayBg = selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(15,23,42,0.65)', 'rgba(45,75,30,0.58)'],
    });

    const borderColor = selectedProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0)', '#4A6A3B'],
    });

    return (
      <Animated.View
        style={{
          width: CARD_WIDTH,
          marginBottom: 14,
          opacity: entranceOpacity,
          transform: [
            { translateY: entranceY },
            { scale: Animated.multiply(entranceScale, cardScale) },
          ],
        }}
      >
        {/* FIXED: Single TouchableOpacity with handleCardPress */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCardPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              {
                borderColor,
                elevation: 0,
                shadowOpacity: 0,
              },
            ]}
          >
            <Image
              source={getImageSource()}
              style={styles.cardImage}
              resizeMode="cover"
              fadeDuration={200}
            />
            <Animated.View style={[styles.overlay, { backgroundColor: overlayBg }]} />
            <Animated.View
              style={[styles.shine, { transform: [{ translateX: shineX }] }]}
              pointerEvents="none"
            />
            <View style={styles.cardContent}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  isSelected && styles.iconContainerSelected,
                  { transform: [{ scale: iconScale }] },
                ]}
              >
                <Icon name={iconName} size={22} color={isSelected ? '#4A6A3B' : '#fff'} />
              </Animated.View>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {category.name}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {category.description}
              </Text>
              <View style={styles.actionContainer}>
                {/* "Continue" indicator when selected – now purely visual, press handled by parent */}
                <Animated.View
                  style={{
                    opacity: buttonOpacity,
                    width: '100%',
                    position: 'absolute',
                    zIndex: isSelected ? 1 : -1,
                  }}
                  pointerEvents="none"
                >
                  <View style={styles.continueButtonInside}>
                    <Text style={styles.continueButtonInsideText}>Continue</Text>
                    <Icon name="arrow-right" size={18} color="#4A6A3B" />
                  </View>
                </Animated.View>
                {/* "Explore category" indicator when unselected */}
                <Animated.View
                  style={{
                    opacity: buttonOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                    position: 'absolute',
                    zIndex: isSelected ? -1 : 1,
                  }}
                  pointerEvents="none"
                >
                  <View style={styles.exploreTextContainer}>
                    <Text style={styles.exploreText}>Explore category</Text>
                    <Icon name="arrow-right" size={14} color="rgba(255,255,255,0.6)" />
                  </View>
                </Animated.View>
              </View>
            </View>
            <Animated.View
              style={[
                styles.checkmark,
                { transform: [{ scale: checkmarkScale }], opacity: checkmarkScale },
              ]}
            >
              <Icon name="check-circle" size={24} color="#4A6A3B" />
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.category.id === next.category.id &&
    prev.index === next.index
);

// ─── Header with staggered animation ──────────────────────────────────────
function AnimatedHeader({ title, subtitle }) {
  const titleSlide = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(16)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title spring + fade in first
    Animated.parallel([
      Animated.spring(titleSlide, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtitle follows with a small delay
    const subtitleTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(subtitleSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]).start();
    }, 150);

    return () => clearTimeout(subtitleTimer);
  }, []);

  return (
    <View style={styles.header}>
      <Animated.Text
        style={[
          styles.headerTitle,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        {title}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.headerSubtitle,
          {
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleSlide }],
          },
        ]}
      >
        {subtitle}
      </Animated.Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function CategorySelection() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasExistingResults, setHasExistingResults] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);
  const navigation = useNavigation();
  const { user } = useAuth();

  // Store the category to navigate with in a ref to avoid stale closure issues
  const pendingCategoryRef = useRef(null);

  // Fetch both categories AND dashboard in parallel to avoid flash
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchAll = async () => {
        setLoading(true);
        try {
          const requests = [api.get('/api/categories/')];
          if (user) {
            requests.push(api.get('/api/student/dashboard'));
          }

          const results = await Promise.all(requests);
          if (!isActive) return;

          setCategories(results[0].data);

          if (results.length > 1) {
            const dashData = results[1].data;
            setHasExistingResults(dashData.has_results === true);
          } else {
            setHasExistingResults(false);
          }
        } catch {
          if (isActive) Alert.alert('Error', 'Failed to load categories');
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchAll();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const handleSelect = useCallback((category) => {
    setSelectedCategoryId((prev) => {
      if (prev === category.id) {
        setSelectedCategory(null);
        return null;
      }
      setSelectedCategory(category);
      return category.id;
    });
  }, []);

  const handleContinue = useCallback(
    (category = null) => {
      const cat = category || selectedCategory;
      if (!cat) return;
      // Store in ref for reliable access during navigation
      pendingCategoryRef.current = cat;
      setModalCategory(cat);
      setModalVisible(true);
    },
    [selectedCategory]
  );

  // FIXED: Properly wrapped in useCallback with reliable ref access
  const handleModalStart = useCallback((action) => {
    const categoryToUse = modalCategory || pendingCategoryRef.current;
    // Close modal first
    setModalVisible(false);

    // Use requestAnimationFrame to ensure modal state is settled before navigating
    requestAnimationFrame(() => {
      if (action === 'assessment' && categoryToUse) {
        navigation.navigate('PersonalAssessment', { category: categoryToUse });
      } else if (categoryToUse) {
        navigation.navigate(action === 'signup' ? 'Signup' : 'Login', {
          pendingCategory: categoryToUse,
        });
      }
    });
  }, [modalCategory, navigation]);

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <LoadingScreen />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {hasExistingResults && user && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#6B7280" />
            <Text style={styles.backText}>Back to Dashboard</Text>
          </TouchableOpacity>
        )}

        <AnimatedHeader
          title={hasExistingResults && user ? 'Explore New Paths' : 'Find Your True North'}
          subtitle={
            hasExistingResults && user
              ? 'Select a new career category to discover more opportunities.'
              : 'Select the career category that aligns with your passions and goals.'
          }
        />

        <View style={styles.grid}>
          {categories.map((category, idx) => (
            <CategoryCard
              key={String(category.id)}
              category={category}
              isSelected={selectedCategoryId === category.id}
              onSelect={handleSelect}
              onContinue={handleContinue}
              index={idx}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButtonBottom, !selectedCategory && styles.continueButtonDisabled]}
          onPress={() => handleContinue()}
          disabled={!selectedCategory}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonBottomText}>Continue</Text>
          <Icon name="arrow-right" size={22} color="#fff" />
        </TouchableOpacity>
        {!selectedCategory && <Text style={styles.hintText}>Select a category to continue</Text>}
      </ScrollView>

      <CategoryDetailModal
        visible={modalVisible}
        category={modalCategory}
        onClose={() => {
          setModalVisible(false);
        }}
        onStart={handleModalStart}
        isGuest={!user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
  },
  backText: { marginLeft: 6, fontSize: 13, color: '#6B7280', fontWeight: '500' },
  header: { alignItems: 'center', marginBottom: 28 },
  headerTitle: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '800',
    color: '#4A6A3B',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: isSmallDevice ? 13 : 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cardTouchable: { width: '100%' },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    height: 210,
    borderWidth: 2.5,
    borderColor: 'transparent',
    // No shadow – flat, modern look
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardImage: { position: 'absolute', width: '100%', height: '100%' },
  overlay: { position: 'absolute', width: '100%', height: '100%' },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH * 0.45,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ skewX: '-18deg' }],
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconContainerSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 14,
    marginBottom: 10,
  },
  actionContainer: { height: 40, marginTop: 6, justifyContent: 'center' },
  exploreTextContainer: { flexDirection: 'row', alignItems: 'center' },
  exploreText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginRight: 6 },
  // Now a purely visual indicator (not a TouchableOpacity)
  continueButtonInside: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 30,
    gap: 6,
  },
  continueButtonInsideText: { fontSize: 14, fontWeight: '600', color: '#4A6A3B' },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    // No shadow
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  continueButtonBottom: {
    backgroundColor: '#4A6A3B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 35,
    marginTop: 24,
    marginBottom: 12,
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  continueButtonBottomText: { color: '#fff', fontSize: 17, fontWeight: '700', marginRight: 8 },
  hintText: { textAlign: 'center', fontSize: 13, color: '#9CA3AF' },
});