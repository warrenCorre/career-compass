// src/screens/RealAssessment.js - Enhanced: polished animations, tactile button feedback, centered header
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, StatusBar, Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const TOTAL_TIME = 900; // 15 minutes

const PressableScale = ({ children, style, onPress, disabled, ...props }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, friction: 10, tension: 100 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 10, tension: 100 }).start();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function RealAssessment() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { category } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);

  const timerRef = useRef(null);
  const hasFetched = useRef(false);
  const isMounted = useRef(true);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const hasSubmitted = useRef(false);
  const timeLeftRef = useRef(TOTAL_TIME);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!category) { navigation.goBack(); return; }
    if (!hasFetched.current) { fetchQuestions(); hasFetched.current = true; }
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const animateQuestionChange = useCallback(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
  }, [slideAnim]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        timeLeftRef.current = next;
        if (next <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          if (!hasSubmitted.current) {
            hasSubmitted.current = true;
            submitAnswers(answersRef.current, true);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/assessment/real/questions');
      if (!isMounted.current) return;
      const questionsData = response.data.questions || [];
      questionsRef.current = questionsData;
      setQuestions(questionsData);
      const initial = {};
      questionsData.forEach(q => { initial[q.id] = null; });
      answersRef.current = initial;
      setAnswers(initial);
      startTimer();
    } catch (err) {
      if (isMounted.current) Alert.alert('Error', err.response?.data?.msg || 'Failed to load questions');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const submitAnswers = async (currentAnswers, isAutoSubmit = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const timeSpent = TOTAL_TIME - timeLeftRef.current;

    if (!isAutoSubmit) {
      const currentQuestions = questionsRef.current;
      const unanswered = currentQuestions.filter(q => currentAnswers[q.id] === null);
      if (unanswered.length > 0) {
        hasSubmitted.current = false;
        Alert.alert('Incomplete', `Please answer all questions (${unanswered.length} remaining)`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/assessment/real/submit', {
        answers: currentAnswers,
        time_spent: timeSpent,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Results', params: { results: response.data } }],
      });
    } catch (err) {
      hasSubmitted.current = false;
      Alert.alert('Error', err.response?.data?.msg || 'Failed to submit');
      if (!isAutoSubmit) startTimer();
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  const handleAnswer = useCallback((questionId, value) => {
    const newAnswers = { ...answersRef.current, [questionId]: value };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  }, []);

  const handleManualSubmit = () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    submitAnswers(answersRef.current, false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="brain" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>No questions available</Text>
        <PressableScale style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </PressableScale>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.values(answersRef.current).filter(v => v !== null).length;
  const isComplete = answeredCount === questions.length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswerValue = answersRef.current[currentQuestion?.id];
  const timerColor = timeLeft < 300 ? '#EF4444' : timeLeft < 600 ? '#F59E0B' : '#4A6A3B';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <AnimatedBackground />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {/* Left side – equal width container for centering */}
        <View style={styles.headerSide}>
          <PressableScale onPress={() => navigation.goBack()} style={styles.backIcon}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </PressableScale>
        </View>
        {/* Center content */}
        <View style={styles.headerCenter}>
          <Text style={styles.categoryBadge} numberOfLines={1}>{category?.name || 'Assessment'}</Text>
          <Text style={styles.headerTitle}>Real Assessment</Text>
        </View>
        {/* Right side – equal width container with compact timer */}
        <View style={styles.headerSide}>
          <View style={[styles.timerBadge, { backgroundColor: timerColor + '20' }]}>
            <Icon name="clock-outline" size={12} color={timerColor} />
            <Text style={[styles.timerText, { color: timerColor }]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Q{currentIndex + 1}/{questions.length} · {answeredCount} answered
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.questionArea}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{
              scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
            }],
          }}
        >
          <View style={styles.questionCard}>
            <View style={styles.questionIcon}>
              <Icon name="brain" size={32} color="#4A6A3B" />
            </View>
            <Text style={styles.questionText}>{currentQuestion?.text}</Text>
            <View style={styles.optionsContainer}>
              {currentQuestion?.options?.map((opt, idx) => {
                const isSelected = currentAnswerValue === opt.value;
                return (
                  <PressableScale
                    key={idx}
                    style={[styles.optionButton, isSelected && styles.optionSelected]}
                    onPress={() => handleAnswer(currentQuestion.id, opt.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.text}
                    </Text>
                    {isSelected && (
                      <Icon name="check-circle" size={22} color="#fff" style={styles.optionCheck} />
                    )}
                  </PressableScale>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.navigation, { paddingBottom: insets.bottom + 12 }]}>
        <PressableScale
          style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
          onPress={() => {
            animateQuestionChange();
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }}
          disabled={currentIndex === 0}
        >
          <Icon name="arrow-left" size={20} color={currentIndex === 0 ? '#D1D5DB' : '#4A6A3B'} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navTextDisabled]}>
            Previous
          </Text>
        </PressableScale>

        {currentIndex === questions.length - 1 ? (
          <PressableScale
            style={[styles.submitButton, (!isComplete || submitting) && styles.submitDisabled]}
            onPress={handleManualSubmit}
            disabled={!isComplete || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit</Text>
                <Icon name="check" size={20} color="#fff" />
              </>
            )}
          </PressableScale>
        ) : (
          <PressableScale
            style={[styles.navButton, !currentAnswerValue && styles.navDisabled]}
            onPress={() => {
              animateQuestionChange();
              setCurrentIndex(prev => prev + 1);
            }}
            disabled={!currentAnswerValue}
          >
            <Text style={[styles.navButtonText, !currentAnswerValue && styles.navTextDisabled]}>
              Next
            </Text>
            <Icon
              name="arrow-right"
              size={20}
              color={!currentAnswerValue ? '#D1D5DB' : '#4A6A3B'}
            />
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { fontSize: 16, color: '#6B7280', marginBottom: 20, marginTop: 16 },
  backBtn: {
    backgroundColor: '#4A6A3B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25,
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  // Equal-width side containers for perfect centering
  headerSide: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { padding: 8 },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  categoryBadge: {
    backgroundColor: '#F4F7F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 11,
    color: '#4A6A3B',
    marginBottom: 4,
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  // Compact timer badge
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#4A6A3B', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  questionArea: { padding: 20 },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  questionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: { marginTop: 4 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  optionSelected: { backgroundColor: '#4A6A3B', borderColor: '#4A6A3B' },
  optionText: { fontSize: 16, color: '#1F2937', flex: 1 },
  optionTextSelected: { color: '#fff' },
  optionCheck: { marginLeft: 8 },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#4A6A3B',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6A3B',
    marginHorizontal: 6,
  },
  navDisabled: { borderColor: '#E5E7EB' },
  navTextDisabled: { color: '#D1D5DB' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A6A3B',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  submitDisabled: { backgroundColor: '#D1D5DB' },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', marginRight: 8 },
});