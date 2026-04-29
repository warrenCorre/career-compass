// src/screens/PersonalAssessment.js - Fixed: fast-click submit bug, UI/UX issues
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  ActivityIndicator, StatusBar, Animated, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function PersonalAssessment() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { category } = route.params || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Refs
  const hasFetched = useRef(false);
  const isMounted = useRef(true);
  const answersRef = useRef({}); // Always in sync with answers state
  const questionsRef = useRef([]); // Always in sync with questions state
  const slideAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!category) { navigation.goBack(); return; }
    if (!hasFetched.current) { fetchQuestions(); hasFetched.current = true; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateQuestionChange = useCallback(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start();
  }, [slideAnim]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/assessment/personal/questions/${category.id}`);
      if (!isMounted.current) return;
      const questionsData = response.data.questions || [];
      questionsRef.current = questionsData;
      setQuestions(questionsData);
      const initial = {};
      questionsData.forEach(q => { initial[q.id] = null; });
      answersRef.current = initial;
      setAnswers(initial);
    } catch (err) {
      if (isMounted.current) Alert.alert('Error', 'Failed to load questions');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // CHANGED: No auto-advance after answering. Just set the answer.
  const handleAnswer = useCallback((questionId, value) => {
    const newAnswers = { ...answersRef.current, [questionId]: value };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    // No auto-advance – user must press Next manually.
  }, []);

  const handleSubmit = async () => {
    // Use ref for answers to avoid stale state
    const currentAnswers = answersRef.current;
    const currentQuestions = questionsRef.current;
    const unanswered = currentQuestions.filter(q => currentAnswers[q.id] === null);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', `Please answer all questions (${unanswered.length} remaining)`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/api/assessment/personal/submit', {
        category_id: category.id,
        answers: currentAnswers,
      });
      navigation.navigate('RealAssessment', { category });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to submit');
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  };

  if (loading) {
  return <LoadingSpinner />;
}

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="help-circle-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>No questions available</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  // Derive counts from ref so they're always accurate even during rapid taps
  const answeredCount = Object.values(answersRef.current).filter(v => v !== null).length;
  const isComplete = answeredCount === questions.length;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const currentAnswerValue = answersRef.current[currentQuestion?.id];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <AnimatedBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.categoryBadge} numberOfLines={1}>{category?.name}</Text>
          <Text style={styles.headerTitle}>Personal Assessment</Text>
        </View>
        <Text style={styles.questionCounter}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{answeredCount}/{questions.length} answered</Text>
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
              <Icon name="help-circle" size={32} color="#4A6A3B" />
            </View>
            <Text style={styles.questionText}>{currentQuestion?.text}</Text>
            <View style={styles.optionsContainer}>
              {currentQuestion?.options?.map((opt, idx) => {
                const isSelected = currentAnswerValue === opt.value;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.optionButton, isSelected && styles.optionSelected]}
                    onPress={() => handleAnswer(currentQuestion.id, opt.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.text}
                    </Text>
                    {isSelected && (
                      <Icon name="check-circle" size={22} color="#fff" style={styles.optionCheck} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navDisabled]}
          onPress={() => {
            animateQuestionChange();
            setCurrentIndex(prev => Math.max(0, prev - 1));
          }}
          disabled={currentIndex === 0}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={20} color={currentIndex === 0 ? '#D1D5DB' : '#4A6A3B'} />
          <Text style={[styles.navButtonText, currentIndex === 0 && styles.navTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.submitButton, (!isComplete || submitting) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isComplete || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit</Text>
                <Icon name="check" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, !currentAnswerValue && styles.navDisabled]}
            onPress={() => {
              animateQuestionChange();
              setCurrentIndex(prev => prev + 1);
            }}
            disabled={!currentAnswerValue}
            activeOpacity={0.7}
          >
            <Text style={[styles.navButtonText, !currentAnswerValue && styles.navTextDisabled]}>
              Next
            </Text>
            <Icon
              name="arrow-right"
              size={20}
              color={!currentAnswerValue ? '#D1D5DB' : '#4A6A3B'}
            />
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backIcon: { padding: 8 },
  headerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  categoryBadge: {
    backgroundColor: '#F4F7F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 11,
    color: '#4A6A3B',
    marginBottom: 4,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  questionCounter: { fontSize: 14, color: '#9CA3AF', minWidth: 36, textAlign: 'right' },
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
  // CHANGED: removed shadow/elevation from submitButton
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