// src/screens/Results.js – Polished layout, reduced tab text, spinner refresh, pushed down, staggered entrance animations

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Animated,
  BackHandler,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AnimatedBackground from '../components/AnimatedBackground';
import StatsModal from '../components/StatsModal';
import RetakeConfirmationModal from '../components/RetakeConfirmationModal';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const SKILL_NAME_MAP = {
  'technical': 'Technical Knowledge', 'problem_solving': 'Problem Solving',
  'communication': 'Communication', 'analytical': 'Analytical Thinking',
  'practical': 'Hands-on Skills', 'leadership': 'Leadership',
  'creativity': 'Creative Thinking', 'critical_thinking': 'Critical Thinking',
  'teamwork': 'Team Collaboration', 'adaptability': 'Adaptability',
  'teaching': 'Teaching Ability', 'patient_care': 'Patient Care',
  'clinical': 'Clinical Skills', 'design': 'Design Sense',
  'writing': 'Written Communication', 'research': 'Research Skills',
  'planning': 'Planning & Organization', 'programming': 'Programming',
  'customer_service': 'Customer Service', 'empathy': 'Empathy',
  'patience': 'Patience', 'public_speaking': 'Public Speaking',
};

const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export default function Results() {
  const route = useRoute();
  const navigation = useNavigation();
  const [results, setResults] = useState(null);
  const [historyResults, setHistoryResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: '', items: [] });
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [currentResultId, setCurrentResultId] = useState(null);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  // ─── Entrance animation values ─────────────────────────────────────
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(40)).current;
  const tabsOpacity = useRef(new Animated.Value(0)).current;
  const tabsTranslateY = useRef(new Animated.Value(40)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(new Animated.Value(40)).current;

  // ─── Start entrance animation (isolated function) ──────────────────
  const startEntrance = useCallback(() => {
    // Reset all to 0 before starting
    headerOpacity.setValue(0); headerTranslateY.setValue(-30);
    statsOpacity.setValue(0); statsTranslateY.setValue(40);
    tabsOpacity.setValue(0); tabsTranslateY.setValue(40);
    contentOpacity.setValue(0); contentTranslateY.setValue(30);
    actionsOpacity.setValue(0); actionsTranslateY.setValue(40);

    // Header
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(headerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Stats (staggered)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(statsTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 180);

    // Tabs
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(tabsOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(tabsTranslateY, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }, 340);

    // Content
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(contentTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 480);

    // Action buttons
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(actionsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(actionsTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 620);
  }, []);

  // ─── Hardware back → Dashboard via MainTabs ──────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('MainTabs', { screen: 'Dashboard' });
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // ─── Run entrance whenever screen gains focus and data is ready ──
  useFocusEffect(
    useCallback(() => {
      if (!loading && !loadingHistory && results) {
        startEntrance();
      }
    }, [loading, loadingHistory, results, startEntrance])
  );

  useEffect(() => {
    if (route.params?.results) {
      setResults(route.params.results);
      setCurrentResultId(route.params.results.result_id);
      fetchAllResults();
      fetchJobsForCourses(route.params.results.recommended_courses);
      setLoading(false);
    } else {
      fetchLatestResults();
      fetchAllResults();
    }
  }, []);

  const fetchLatestResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/assessment/latest');
      setResults(response.data);
      setCurrentResultId(response.data.result_id);
      if (response.data.recommended_courses?.length) fetchJobsForCourses(response.data.recommended_courses);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalResult = async (resultId) => {
    try {
      setLoadingHistory(true);
      const response = await api.get(`/api/assessment/result/${resultId}`);
      setResults(response.data);
      setCurrentResultId(resultId);
      setHistoryModalVisible(false);
      if (response.data.recommended_courses?.length) fetchJobsForCourses(response.data.recommended_courses);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to load historical result');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      const response = await api.get('/api/assessment/history');
      setHistoryResults(response.data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchJobsForCourses = async (recommendedCourses) => {
    if (!recommendedCourses?.length) return;
    setLoadingJobs(true);
    try {
      const params = {};
      if (currentResultId) params.result_id = currentResultId;
      const response = await api.get('/api/student/jobs-recommended', { params });
      if (response.data.jobs) setJobs(response.data.jobs.slice(0, 6));
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshingJobs(true);
    try {
      const payload = {};
      if (currentResultId) payload.result_id = currentResultId;
      const response = await api.post('/api/student/refresh-jobs', payload);
      if (response.data.jobs) setJobs(response.data.jobs.slice(0, 6));
    } catch (err) {
      console.error('Error refreshing jobs:', err);
    } finally {
      setRefreshingJobs(false);
    }
  };

  const handleStatClick = (type) => {
    let data = null;
    switch (type) {
      case 'courses':
        data = { items: results?.recommended_courses || [], type: 'courses' };
        break;
      case 'jobs':
        data = { items: jobs, type: 'jobs' };
        break;
      default:
        return;
    }
    setModalData(data);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { text: 'Excellent', color: '#10b981', bg: '#D1FAE5' };
    if (score >= 60) return { text: 'Good', color: '#4A6A3B', bg: '#E8F0E6' };
    if (score >= 40) return { text: 'Potential', color: '#F59E0B', bg: '#FEF3C7' };
    return { text: 'Basic', color: '#6B7280', bg: '#F3F4F6' };
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'Strong': return { bg: '#D1FAE5', text: '#10b981' };
      case 'Developing': return { bg: '#FEF3C7', text: '#F59E0B' };
      case 'Emerging': return { bg: '#FFE4E6', text: '#F97316' };
      case 'Needs Work': return { bg: '#FEE2E2', text: '#EF4444' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getSkillScoresArray = () => {
    if (!results?.skill_scores) return [];
    if (Array.isArray(results.skill_scores)) return results.skill_scores;
    if (typeof results.skill_scores === 'object') {
      return Object.entries(results.skill_scores).map(([key, value]) => ({
        name: SKILL_NAME_MAP[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: value,
        level: value >= 80 ? 'Strong' : value >= 60 ? 'Developing' : value >= 40 ? 'Emerging' : 'Needs Work',
      }));
    }
    return [];
  };

  const calculateRealTimeSummary = () => {
    const skillScores = getSkillScoresArray();
    const recommendedCourses = results?.recommended_courses || [];
    const skillGaps = results?.skill_gaps || [];
    let avgScore = 0;
    if (skillScores.length > 0) {
      const total = skillScores.reduce((sum, s) => sum + s.score, 0);
      avgScore = Math.round(total / skillScores.length);
    }
    let strengthLevel = 'Foundation';
    if (avgScore >= 80) strengthLevel = 'Advanced';
    else if (avgScore >= 65) strengthLevel = 'Intermediate';
    else if (avgScore >= 45) strengthLevel = 'Developing';
    else if (avgScore >= 25) strengthLevel = 'Beginner';
    return {
      avgScore,
      strengthLevel,
      totalQuestions: 12,
      timeSpent: results?.time_spent || 0,
      topMatchScore: recommendedCourses[0]?.score || 0,
      skillsCount: skillScores.length,
      gapsCount: skillGaps.length,
      coursesCount: recommendedCourses.length,
    };
  };

  const handleBack = () => {
    navigation.navigate('MainTabs', { screen: 'Dashboard' });
  };

  if (loading || loadingHistory) {
    return <LoadingSpinner />;
  }

  if (!results) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chart-bell-curve" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptyText}>Complete the assessment to see your personalized results.</Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowRetakeModal(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Retake Assessment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recommendedCourses = results?.recommended_courses || [];
  const skillGaps = results?.skill_gaps || [];
  const skillScores = getSkillScoresArray();
  const summary = calculateRealTimeSummary();
  const categoryName = results?.category_name || 'Career';
  const topCourse = recommendedCourses[0];
  const strengths = skillScores.filter(s => s.score >= 70).slice(0, 3);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Animated Header ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerBadge}>
              <Icon name="trophy" size={16} color="#4A6A3B" />
              <Text style={styles.headerBadgeText}>
                {historyResults.length > 1 && currentResultId !== historyResults[0]?.id
                  ? 'Historical Result'
                  : 'Assessment Complete'}
              </Text>
            </View>
            <Text style={styles.headerTitle}>Your Personalized Results</Text>
            <Text style={styles.headerSubtitle}>Based on your responses in {categoryName}</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </Animated.View>

        {/* ─── Assessment History Button (shared animation with header) ──── */}
        {historyResults.length > 1 && (
          <Animated.View
            style={{
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
              marginBottom: 20,
            }}
          >
            <View style={styles.historySelector}>
              <TouchableOpacity
                style={styles.historySelectorButton}
                onPress={() => setHistoryModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.historyButtonIcon}
                >
                  <Icon name="calendar" size={14} color="#fff" />
                </LinearGradient>
                <Text style={styles.historySelectorText}>Assessment History</Text>
                <View style={styles.historyBadgeCount}>
                  <Text style={styles.historyBadgeCountText}>{historyResults.length}</Text>
                </View>
                <Icon name="chevron-right" size={16} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ─── Animated Summary Cards ─────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.statsGrid,
            {
              opacity: statsOpacity,
              transform: [{ translateY: statsTranslateY }],
            },
          ]}
        >
          {[
            { icon: 'school', label: 'Program Matches', value: summary.coursesCount, color: '#4A6A3B', bg: '#E8F0E6' },
            { icon: 'brain', label: 'Skills Assessed', value: summary.skillsCount, color: '#9333EA', bg: '#F3E8FF' },
            { icon: 'lightbulb', label: 'Areas to Improve', value: summary.gapsCount, color: '#F59E0B', bg: '#FEF3C7' },
          ].map((stat, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.statCard}
              onPress={() => { if (idx === 0) handleStatClick('courses'); }}
              activeOpacity={0.8}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                <Icon name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ─── Animated Tabs ──────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.tabsContainer,
            {
              opacity: tabsOpacity,
              transform: [{ translateY: tabsTranslateY }],
            },
          ]}
        >
          {['courses', 'skills', 'jobs'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'courses' ? 'Program Matches' : tab === 'skills' ? 'Skills & Gaps' : 'Job Opportunities'}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ─── Animated Tab Content ───────────────────────────────────────── */}
        <Animated.View
          style={{
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          }}
        >
          {activeTab === 'courses' && (
            <View style={styles.tabContent}>
              {topCourse ? (
                <View style={styles.topMatchCard}>
                  <View style={styles.cardHeader}>
                    <Icon name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.cardTitle}>Your Best-Fit Program</Text>
                    <View style={[styles.matchBadge, { backgroundColor: getMatchBadge(topCourse.score).bg }]}>
                      <Text style={[styles.matchBadgeText, { color: getMatchBadge(topCourse.score).color }]}>
                        {getMatchBadge(topCourse.score).text} Match
                      </Text>
                    </View>
                  </View>
                  <View style={styles.topMatchContent}>
                    <View style={styles.topMatchIcon}>
                      <Icon name="school" size={36} color="#4A6A3B" />
                    </View>
                    <View style={styles.topMatchInfo}>
                      <Text style={styles.topMatchCode}>{topCourse.course_code}</Text>
                      <Text style={styles.topMatchName}>{topCourse.course_name}</Text>
                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Match Score</Text>
                        <Text style={styles.scoreValue}>{topCourse.score}%</Text>
                      </View>
                      <View style={styles.progressBarSmall}>
                        <View style={[styles.progressFillSmall, { width: `${topCourse.score}%` }]} />
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailText}>📚 4 Years</Text>
                        <Text style={styles.detailText}>📈 High Demand</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyTabText}>No top match found</Text>
              )}
              {recommendedCourses.length > 1 && (
                <View style={styles.otherCourses}>
                  <Text style={styles.sectionTitle}>Other Program Matches</Text>
                  {recommendedCourses.slice(1).map((course, idx) => (
                    <View key={idx} style={styles.courseMiniCard}>
                      <View style={styles.courseMiniHeader}>
                        <Text style={styles.courseMiniCode}>{course.course_code}</Text>
                        <View style={[styles.scoreBadgeMini, { backgroundColor: getMatchBadge(course.score).bg }]}>
                          <Text style={[styles.scoreBadgeMiniText, { color: getMatchBadge(course.score).color }]}>
                            {course.score}%
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.courseMiniName}>{course.course_name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'skills' && (
            <View style={styles.tabContent}>
              {strengths.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Strengths</Text>
                  {strengths.map((skill, idx) => (
                    <View key={idx} style={[styles.skillItem, { backgroundColor: '#D1FAE5' }]}>
                      <Icon name="check-circle" size={18} color="#10b981" />
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={[styles.skillScore, { color: '#10b981' }]}>{Math.round(skill.score)}%</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>All Skills</Text>
                {skillScores.map((skill, idx) => {
                  const levelColor = getSkillLevelColor(skill.level);
                  return (
                    <View key={idx} style={[styles.skillItem, { backgroundColor: levelColor.bg }]}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <View style={styles.skillRight}>
                        <View style={[styles.skillLevel, { backgroundColor: levelColor.text + '20' }]}>
                          <Text style={[styles.skillLevelText, { color: levelColor.text }]}>{skill.level}</Text>
                        </View>
                        <Text style={[styles.skillScore, { color: levelColor.text }]}>{Math.round(skill.score)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              {skillGaps.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recommended Focus Areas</Text>
                  {skillGaps.slice(0, 3).map((gap, idx) => (
                    <View key={idx} style={styles.gapItem}>
                      <Icon name="lightbulb-outline" size={18} color="#F59E0B" />
                      <Text style={styles.gapText}>{gap}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Assessment Summary</Text>
                {[
                  ['Average Score', `${summary.avgScore}%`],
                  ['Questions', summary.totalQuestions],
                  ['Time Spent', `${Math.floor(summary.timeSpent / 60)} min`],
                  ['Level', summary.strengthLevel],
                ].map(([label, val], idx) => (
                  <View key={idx} style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>{val}</Text>
                  </View>
                ))}
                <View style={styles.summaryProgress}>
                  <View style={[styles.summaryProgressFill, { width: `${summary.avgScore}%` }]} />
                </View>
              </View>
            </View>
          )}

          {activeTab === 'jobs' && (
            <View style={styles.tabContent}>
              <View style={styles.jobsHeader}>
                <Text style={styles.sectionTitle}>Job Opportunities</Text>
                <TouchableOpacity onPress={refreshJobs} disabled={refreshingJobs}>
                  {refreshingJobs ? (
                    <ActivityIndicator size="small" color="#4A6A3B" />
                  ) : (
                    <Icon name="refresh" size={18} color="#4A6A3B" />
                  )}
                </TouchableOpacity>
              </View>
              {loadingJobs ? (
                <ActivityIndicator size="large" color="#4A6A3B" style={styles.loadingIndicator} />
              ) : jobs.length === 0 ? (
                <Text style={styles.emptyTabText}>No jobs found</Text>
              ) : (
                jobs.map((job, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.jobCard}
                    onPress={() => job.job_url && Linking.openURL(job.job_url)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
                      {job.course_match_score && (
                        <View style={[styles.jobMatchBadge, { backgroundColor: getMatchBadge(job.course_match_score).bg }]}>
                          <Text style={[styles.jobMatchText, { color: getMatchBadge(job.course_match_score).color }]}>
                            {job.course_match_score}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.jobCompany}>{job.company}</Text>
                    <View style={styles.jobMeta}>
                      <Icon name="map-marker" size={12} color="#9CA3AF" />
                      <Text style={styles.jobMetaText}>{job.location || 'Philippines'}</Text>
                      {job.salary_min && (
                        <>
                          <Icon name="currency-php" size={12} color="#9CA3AF" style={{ marginLeft: 12 }} />
                          <Text style={styles.jobMetaText}>₱{job.salary_min.toLocaleString()}+</Text>
                        </>
                      )}
                    </View>
                    {job.description && (
                      <Text style={styles.jobDescription} numberOfLines={2}>
                        {stripHtml(job.description)}
                      </Text>
                    )}
                    {job.skills?.length > 0 && (
                      <View style={styles.jobSkills}>
                        {job.skills.slice(0, 3).map((skill, i) => (
                          <Text key={i} style={styles.jobSkillTag}>{skill}</Text>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Animated.View>

        {/* ─── Animated Action Buttons ─────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.actionButtons,
            {
              opacity: actionsOpacity,
              transform: [{ translateY: actionsTranslateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Dashboard' })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowRetakeModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Retake Assessment</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoryModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            <View style={styles.historyModalHeader}>
              <View style={styles.historyModalTitleRow}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.historyModalHeaderIcon}
                >
                  <Icon name="calendar" size={18} color="#fff" />
                </LinearGradient>
                <Text style={styles.historyModalTitle}>Assessment History</Text>
              </View>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                style={styles.historyModalCloseButton}
              >
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.historyModalList}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {historyResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.historyModalItem,
                    item.id === currentResultId && styles.historyModalItemActive,
                  ]}
                  onPress={() => fetchHistoricalResult(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyModalItemContent}>
                    <Text style={styles.historyModalItemCategory}>{item.category_name}</Text>
                    <Text style={styles.historyModalItemDate}>{formatDate(item.completed_at)}</Text>
                  </View>
                  <View style={styles.historyModalItemRight}>
                    {item.top_match && (
                      <Text style={styles.historyModalItemMatch}>
                        {item.top_match.course_code} ({item.top_match.score}%)
                      </Text>
                    )}
                    <Icon name="chevron-right" size={18} color="#D1D5DB" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <StatsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalData.type}
        data={modalData}
        onRefresh={modalData.type === 'jobs' ? refreshJobs : null}
      />

      <RetakeConfirmationModal
        visible={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        onConfirm={() => {
          setShowRetakeModal(false);
          navigation.navigate('CategorySelection');
        }}
      />
    </View>
  );
}

// ---------- Styles (unchanged) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  startButton: {
    backgroundColor: '#4A6A3B', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30,
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 65,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerPlaceholder: { width: 40 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F2',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  headerBadgeText: { fontSize: 12, color: '#4A6A3B', marginLeft: 6, fontWeight: '500' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  // --- History selector button ---
  historySelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  historySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  historyButtonIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  historySelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
    marginRight: 8,
  },
  historyBadgeCount: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  historyBadgeCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
  },

  // --- History modal ---
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  historyModalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyModalHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyModalCloseButton: {
    padding: 6,
  },
  historyModalList: {
    maxHeight: 420,
  },
  historyModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyModalItemActive: {
    backgroundColor: '#EEF2FF',
  },
  historyModalItemContent: {
    flex: 1,
    marginRight: 12,
  },
  historyModalItemCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyModalItemDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyModalItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyModalItemMatch: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A6A3B',
    marginRight: 8,
  },

  // --- Stats grid (three cards) ---
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 10, color: '#6B7280', textAlign: 'center' },

  // --- Tabs (unchanged) ---
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  activeTabText: { fontSize: 11, color: '#4A6A3B' },
  tabContent: { paddingHorizontal: 20 },

  // --- Top match card – shadows gone, border crisp ---
  topMatchCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginLeft: 8, flex: 1 },
  matchBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  matchBadgeText: { fontSize: 11, fontWeight: '500' },
  topMatchContent: { flexDirection: 'row' },
  topMatchIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F4F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  topMatchInfo: { flex: 1 },
  topMatchCode: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  topMatchName: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  scoreLabel: { fontSize: 11, color: '#6B7280' },
  scoreValue: { fontSize: 11, fontWeight: '600', color: '#4A6A3B' },
  progressBarSmall: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFillSmall: { height: '100%', backgroundColor: '#4A6A3B', borderRadius: 2 },
  detailRow: { flexDirection: 'row' },
  detailText: { fontSize: 11, color: '#6B7280', marginRight: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  emptyTabText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20 },
  otherCourses: { marginBottom: 20 },
  courseMiniCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  courseMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseMiniCode: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  scoreBadgeMini: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  scoreBadgeMiniText: { fontSize: 11, fontWeight: '500' },
  courseMiniName: { fontSize: 12, color: '#6B7280' },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  skillName: { flex: 1, fontSize: 13, color: '#1F2937', marginLeft: 8 },
  skillRight: { flexDirection: 'row', alignItems: 'center' },
  skillLevel: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginRight: 8 },
  skillLevelText: { fontSize: 9, fontWeight: '500' },
  skillScore: { fontSize: 13, fontWeight: '600', width: 35, textAlign: 'right' },
  gapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    marginBottom: 8,
  },
  gapText: { fontSize: 12, color: '#6B7280', marginLeft: 10, flex: 1 },
  summaryCard: {
    backgroundColor: '#4A6A3B',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 14 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#fff' },
  summaryProgress: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  summaryProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingIndicator: { marginVertical: 20 },
  jobCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  jobMatchBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  jobMatchText: { fontSize: 10, fontWeight: '500' },
  jobCompany: { fontSize: 12, color: '#4A6A3B', marginBottom: 6 },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  jobMetaText: { fontSize: 11, color: '#9CA3AF', marginLeft: 2 },
  jobDescription: { fontSize: 11, color: '#6B7280', lineHeight: 16, marginBottom: 8 },
  jobSkills: { flexDirection: 'row', flexWrap: 'wrap' },
  jobSkillTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 10,
    color: '#6B7280',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
    marginBottom: 4,
  },
  actionButtons: { paddingHorizontal: 20, marginTop: 24 },
  primaryButton: {
    backgroundColor: '#4A6A3B',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#4A6A3B',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#4A6A3B', fontSize: 16, fontWeight: '600' },
});