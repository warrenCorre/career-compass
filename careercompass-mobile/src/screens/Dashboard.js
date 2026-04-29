// src/screens/Dashboard.js – Header fills screen, cards without shadows – cleaned
// Fixed: Back handler now exits the app instead of navigating back to Results
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, Dimensions, Linking, Image, StatusBar,
  Animated, Easing, Platform, BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import StatsModal from '../components/StatsModal';
import RetakeConfirmationModal from '../components/RetakeConfirmationModal';

const { width } = Dimensions.get('window');

// ─── Shimmer Skeleton Component ─────────────────────────────────
const ShimmerBox = ({ style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true,
      })
    ).start();
  }, []);
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  return (
    <View style={[{ backgroundColor: '#E5E7EB', overflow: 'hidden', borderRadius: 12 }, style]}>
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, width: '100%', transform: [{ translateX }], backgroundColor: 'rgba(255,255,255,0.55)' }} />
    </View>
  );
};

// ─── Animated Counter Component ─────────────────────────────────
const AnimatedCounter = ({ value, style, delay = 0 }) => {
  const animVal = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(animVal, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, delay);
    const listener = animVal.addListener(({ value: v }) => { setDisplay(Math.round(v)); });
    return () => { clearTimeout(timeout); animVal.removeListener(listener); };
  }, [value]);
  return <Text style={style}>{display}</Text>;
};

// ─── Animated Progress Bar ─────────────────────────────────────
const AnimatedProgressBar = ({ score, color = '#4A6A3B', delay = 0 }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(widthAnim, { toValue: score, tension: 50, friction: 9, useNativeDriver: false }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [score]);
  const animatedWidth = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={progressStyles.track}>
      <Animated.View style={[progressStyles.fill, { width: animatedWidth, backgroundColor: color }]} />
    </View>
  );
};
const progressStyles = StyleSheet.create({
  track: { height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, marginBottom: 12 },
  fill: { height: '100%', borderRadius: 3 },
});

// ─── Card that animates directly (no extra wrapper) ────────────
const SpringCard = React.forwardRef(({ delay = 0, style, children }, ref) => {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.94)).current;
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  return <Animated.View ref={ref} style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}>{children}</Animated.View>;
});

// ─── Main Dashboard ──────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ type: '', items: [] });
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [jobFetchError, setJobFetchError] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  const headerSlide = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(1)).current;
  const greetingSlide = useRef(new Animated.Value(30)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const badgeSlide = useRef(new Animated.Value(20)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.8)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerParallax = scrollY.interpolate({ inputRange: [0, 120], outputRange: [0, -40], extrapolate: 'clamp' });

  // Handle hardware back button (Android)
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (modalVisible || showRetakeModal) return false;
        BackHandler.exitApp();
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => BackHandler.removeEventListener('hardwareBackPress', backAction);
    }, [modalVisible, showRetakeModal])
  );

  // Status bar styling
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#4A6A3B'); StatusBar.setTranslucent(false);
      }
      StatusBar.setBarStyle('light-content');
      return () => {
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor('transparent'); StatusBar.setTranslucent(true);
        }
        StatusBar.setBarStyle('dark-content');
      };
    }, [])
  );

  const runEntranceAnimation = useCallback(() => {
    headerSlide.setValue(-50); headerOpacity.setValue(0); headerScale.setValue(1);
    greetingSlide.setValue(30); greetingOpacity.setValue(0);
    badgeSlide.setValue(20); badgeOpacity.setValue(0);
    buttonScale.setValue(0.8); buttonOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(headerSlide, { toValue: 0, tension: 30, friction: 9, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(headerScale, { toValue: 1, tension: 65, friction: 10, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(greetingSlide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(greetingOpacity, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 120);
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(badgeSlide, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }, 220);
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(buttonScale, { toValue: 1, tension: 90, friction: 7, useNativeDriver: true }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setContentReady(true);
    }, 340);
  }, []);

  useFocusEffect(
    useCallback(() => { setContentReady(true); runEntranceAnimation(); }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (user && isFocused) { fetchDashboard(); fetchAssessmentHistory(); fetchJobs(); }
    }, [user, isFocused])
  );

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/api/student/dashboard');
      setDashboardData(response.data);
    } catch (err) { /* silent */ } finally { setLoading(false); }
  };
  const fetchAssessmentHistory = async () => {
    try {
      const response = await api.get('/api/assessment/history');
      setAssessmentHistory(response.data.history || []);
    } catch (err) { /* silent */ }
  };
  const fetchJobs = async () => {
    setLoadingJobs(true); setJobFetchError(false);
    try {
      const response = await api.get('/api/student/jobs-recommended');
      if (response.data.jobs) setJobs(response.data.jobs);
    } catch (err) { setJobFetchError(true); } finally { setLoadingJobs(false); }
  };
  const refreshJobs = async () => {
    setRefreshingJobs(true); setJobFetchError(false);
    try {
      const response = await api.post('/api/student/refresh-jobs');
      if (response.data.jobs) {
        setJobs(response.data.jobs);
        if (modalVisible && modalData.type === 'jobs') setModalData((prev) => ({ ...prev, items: response.data.jobs }));
      }
    } catch (err) { setJobFetchError(true); } finally { setRefreshingJobs(false); }
  };
  const onRefresh = async () => {
    setRefreshing(true); runEntranceAnimation();
    await Promise.all([fetchDashboard(), fetchAssessmentHistory(), fetchJobs()]);
    setRefreshing(false);
  };
  const handleStatClick = (type) => {
    let data = null;
    switch (type) {
      case 'courses': data = { items: dashboardData?.results?.recommended_courses || [], type: 'courses' }; break;
      case 'jobs': data = { items: jobs, type: 'jobs' }; break;
      case 'assessments': data = { type: 'assessments', history: assessmentHistory, currentResults: dashboardData?.results }; break;
      default: return;
    }
    setModalData(data); setModalVisible(true);
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
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const getProfileImageUrl = () => {
    const profilePic = dashboardData?.user?.profile_picture || user?.profile_picture;
    if (!profilePic) return null;
    if (profilePic.startsWith('/')) return `${api.defaults.baseURL}${profilePic}`;
    return profilePic;
  };
  const navigateToProfile = () => navigation.navigate('Profile');
  const handleRetakePress = () => setShowRetakeModal(true);
  const confirmRetake = () => { setShowRetakeModal(false); navigation.navigate('CategorySelection'); };

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.skeletonHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <ShimmerBox style={{ width: 140, height: 38, borderRadius: 10 }} />
            <ShimmerBox style={{ width: 44, height: 44, borderRadius: 22 }} />
          </View>
          <ShimmerBox style={{ width: 140, height: 16, marginBottom: 8 }} />
          <ShimmerBox style={{ width: 200, height: 30, marginBottom: 14 }} />
          <ShimmerBox style={{ width: '100%', height: 44, borderRadius: 22 }} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {[0, 1, 2].map((i) => (<ShimmerBox key={i} style={{ flex: 1, height: 96, borderRadius: 18 }} />))}
          </View>
          <ShimmerBox style={{ height: 160, borderRadius: 22, marginBottom: 20 }} />
          <ShimmerBox style={{ height: 220, borderRadius: 22 }} />
        </View>
      </View>
    );
  }

  // 🔒 SAFETY: ensure dashboardData.results exists even if null
  const results = dashboardData?.results || {};
  const topCourse = results?.recommended_courses?.[0] || null;
  const skillScores = results?.skill_scores || [];
  const skillGaps = results?.skill_gaps || [];
  const hasResults = dashboardData?.has_results === true;
  const selectedCategory = dashboardData?.selected_category;
  const profilePic = getProfileImageUrl();

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A6A3B']} tintColor="#4A6A3B" />}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.headerSection, { opacity: headerOpacity, transform: [{ translateY: headerSlide }, { scale: headerScale }, { translateY: headerParallax }], width: '100%', alignSelf: 'stretch' }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandSection}>
              <Image source={require('../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
              <View><Text style={styles.brandTitle}>CareerCompass</Text><Text style={styles.brandSubtitle}>Navigate Your Future</Text></View>
            </View>
            <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
              {profilePic ? (<Image source={{ uri: profilePic }} style={styles.profileImage} />) : (
                <View style={styles.profileInitials}><Text style={styles.profileInitialsText}>{(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')}</Text></View>
              )}
            </TouchableOpacity>
          </View>
          <Animated.View style={{ opacity: greetingOpacity, transform: [{ translateY: greetingSlide }] }}>
            <Text style={styles.greeting}>Welcome back,</Text><Text style={styles.userName}>{user?.first_name || 'User'}!</Text>
          </Animated.View>
          <Animated.View style={{ opacity: badgeOpacity, transform: [{ translateY: badgeSlide }] }}>
            <View style={styles.statusBadge}>
              <Icon name="shield-check" size={14} color="#fff" />
              <Text style={styles.statusBadgeText}>{hasResults ? 'Your career journey continues' : 'Ready to discover your perfect program?'}</Text>
            </View>
            {selectedCategory && (
              <View style={styles.categoryTag}>
                <Icon name="folder" size={12} color="#fff" />
                <Text style={styles.categoryTagText}>Latest: {selectedCategory.name}</Text>
              </View>
            )}
          </Animated.View>
          <Animated.View style={{ opacity: buttonOpacity, transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity style={styles.retakeHeaderButton} onPress={handleRetakePress}>
              <Icon name="compass" size={18} color="#fff" />
              <Text style={styles.retakeHeaderText}>Explore New Paths</Text>
              <Icon name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {!hasResults ? (
          <SpringCard delay={500} style={{ marginHorizontal: 16 }}>
            <View style={styles.emptyState}>
              <Icon name="compass" size={64} color="#4A6A3B" />
              <Text style={styles.emptyTitle}>Begin Your Program Discovery</Text>
              <Text style={styles.emptyText}>Take our comprehensive assessment to discover programs that match your unique profile.</Text>
              <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('CategorySelection')}>
                <Text style={styles.startButtonText}>Start Assessment</Text>
              </TouchableOpacity>
            </View>
          </SpringCard>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {[
                { type: 'courses', icon: 'school', iconBg: '#E8F0E6', iconColor: '#4A6A3B', value: (results?.recommended_courses?.length || 0), label: 'Program Matches' },
                { type: 'jobs', icon: 'briefcase', iconBg: '#E0F2FE', iconColor: '#0284C7', value: jobs.length, label: 'Job Opportunities', loading: loadingJobs, error: jobFetchError },
                { type: 'assessments', icon: 'file-document', iconBg: '#FEF3C7', iconColor: '#F59E0B', value: assessmentHistory.length || 1, label: 'Assessments' },
              ].map((stat, idx) => (
                <SpringCard key={stat.type} delay={contentReady ? 420 + idx * 90 : 9999} style={{ flex: 1 }}>
                  <TouchableOpacity style={styles.statCard} onPress={() => handleStatClick(stat.type)}>
                    <View style={[styles.statIcon, { backgroundColor: stat.iconBg }]}><Icon name={stat.icon} size={22} color={stat.iconColor} /></View>
                    {stat.loading ? (<ActivityIndicator size="small" color={stat.iconColor} style={{ marginVertical: 4 }} />) : (<AnimatedCounter value={stat.value} delay={contentReady ? 600 + idx * 100 : 9999} style={styles.statValue} />)}
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    {stat.error && !stat.loading && <Text style={styles.statErrorText}>Tap to retry</Text>}
                  </TouchableOpacity>
                </SpringCard>
              ))}
            </View>

            {topCourse && (
              <SpringCard delay={contentReady ? 680 : 9999} style={{ marginHorizontal: 16, marginBottom: 20 }}>
                <TouchableOpacity style={styles.bestMatchCard} onPress={() => navigation.navigate('Results')} activeOpacity={0.85}>
                  <View style={styles.bestMatchHeader}>
                    <View style={styles.bestMatchHeaderLeft}><Icon name="trophy" size={18} color="#F59E0B" /><Text style={styles.bestMatchTitle}>Your Best-Fit Program</Text></View>
                    <View style={[styles.matchBadge, { backgroundColor: getMatchBadge(topCourse.score).bg }]}><Text style={[styles.matchBadgeText, { color: getMatchBadge(topCourse.score).color }]}>{getMatchBadge(topCourse.score).text} Match</Text></View>
                  </View>
                  <View style={styles.bestMatchContent}>
                    <View style={styles.bestMatchIcon}><Icon name="school" size={40} color="#4A6A3B" /></View>
                    <View style={styles.bestMatchInfo}>
                      <Text style={styles.bestMatchCode}>{topCourse.course_code}</Text><Text style={styles.bestMatchName}>{topCourse.course_name}</Text>
                      <View style={styles.scoreRow}><Text style={styles.scoreLabel}>Compatibility Score</Text><Text style={styles.scoreValue}>{topCourse.score}%</Text></View>
                      <AnimatedProgressBar score={topCourse.score} color="#4A6A3B" delay={contentReady ? 900 : 9999} />
                      <View style={styles.bestMatchDetails}><Text style={styles.detailText}>📚 4 Years</Text><Text style={styles.detailText}>📈 High Demand</Text></View>
                    </View>
                  </View>
                  <View style={styles.cardArrowIcon}><Icon name="chevron-right" size={20} color="#4A6A3B" /></View>
                </TouchableOpacity>
              </SpringCard>
            )}

            {results?.recommended_courses?.length > 1 && (
              <SpringCard delay={contentReady ? 780 : 9999} style={{ marginHorizontal: 16, marginBottom: 20 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}><Icon name="star-four-points" size={18} color="#4A6A3B" /><Text style={styles.sectionTitle}>Other Program Matches</Text></View>
                  {results.recommended_courses.slice(1, 4).map((course, idx) => {
                    const badge = getMatchBadge(course.score);
                    return (
                      <TouchableOpacity key={idx} style={styles.courseItem} onPress={() => handleStatClick('courses')}>
                        <View style={styles.courseItemHeader}><Text style={styles.courseCode}>{course.course_code}</Text><View style={[styles.scoreBadge, { backgroundColor: badge.bg }]}><Text style={[styles.scoreBadgeText, { color: badge.color }]}>{course.score}%</Text></View></View>
                        <Text style={styles.courseName} numberOfLines={1}>{course.course_name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {results.recommended_courses.length > 4 && (<TouchableOpacity onPress={() => handleStatClick('courses')}><Text style={styles.viewMoreText}>+{results.recommended_courses.length - 4} more</Text></TouchableOpacity>)}
                </View>
              </SpringCard>
            )}

            <SpringCard delay={contentReady ? 880 : 9999} style={{ marginHorizontal: 16, marginBottom: 20 }}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}><Icon name="brain" size={18} color="#F59E0B" /><Text style={styles.sectionTitle}>Skills Overview</Text></View>
                {skillScores.length > 0 ? (
                  <>
                    <View style={styles.skillsList}>
                      {skillScores.slice(0, 6).map((skill, idx) => {
                        const levelColor = getSkillLevelColor(skill.level);
                        return (
                          <View key={idx} style={styles.skillItem}>
                            <Text style={styles.skillName}>{skill.name}</Text>
                            <View style={styles.skillRight}>
                              <View style={[styles.skillLevelBadge, { backgroundColor: levelColor.bg }]}><Text style={[styles.skillLevelText, { color: levelColor.text }]}>{skill.level}</Text></View>
                              <AnimatedCounter value={Math.round(skill.score)} delay={contentReady ? 1000 + idx * 80 : 9999} style={[styles.skillScore, { color: levelColor.text }]} />
                              <Text style={[styles.skillScore, { color: levelColor.text }]}>%</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    {skillGaps.length > 0 && (
                      <View style={styles.gapsSection}>
                        <Text style={styles.gapsTitle}><Icon name="lightbulb" size={14} color="#F59E0B" /> Recommended Focus Areas</Text>
                        {skillGaps.slice(0, 3).map((gap, idx) => (<View key={idx} style={styles.gapItem}><Icon name="check-circle" size={16} color="#F59E0B" /><Text style={styles.gapText}>{gap}</Text></View>))}
                      </View>
                    )}
                  </>
                ) : (<Text style={styles.noSkillsText}>No skill data available yet</Text>)}
              </View>
            </SpringCard>

            <SpringCard delay={contentReady ? 980 : 9999} style={{ marginHorizontal: 16, marginBottom: 20 }}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Icon name="briefcase" size={18} color="#0284C7" /><Text style={styles.sectionTitle}>Job Opportunities</Text>
                  <TouchableOpacity onPress={refreshJobs} disabled={refreshingJobs}>{refreshingJobs ? <ActivityIndicator size="small" color="#4A6A3B" /> : <Icon name="refresh" size={16} color="#4A6A3B" />}</TouchableOpacity>
                </View>
                {loadingJobs ? (<ActivityIndicator size="small" color="#4A6A3B" style={styles.loadingState} />)
                  : jobFetchError ? (<TouchableOpacity onPress={refreshJobs} style={styles.errorState}><Icon name="alert-circle" size={32} color="#F59E0B" /><Text style={styles.errorText}>Unable to load jobs – tap to retry</Text></TouchableOpacity>)
                    : jobs.length > 0 ? (<>{
                      jobs.slice(0, 4).map((job, idx) => (
                        <TouchableOpacity key={idx} style={styles.jobItem} onPress={() => job.job_url && Linking.openURL(job.job_url)}>
                          <View style={styles.jobItemHeader}><Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>{job.course_match_score && (<View style={[styles.jobMatchBadge, { backgroundColor: getMatchBadge(job.course_match_score).bg }]}><Text style={[styles.jobMatchText, { color: getMatchBadge(job.course_match_score).color }]}>{job.course_match_score}%</Text></View>)}</View>
                          <Text style={styles.jobCompany}>{job.company}</Text>
                          <View style={styles.jobMeta}><Icon name="map-marker" size={10} color="#9CA3AF" /><Text style={styles.jobMetaText}>{job.location || 'Philippines'}</Text>{job.salary_min && (<><Icon name="currency-usd" size={10} color="#9CA3AF" style={{ marginLeft: 12 }} /><Text style={styles.jobMetaText}>₱{job.salary_min.toLocaleString()}+</Text></>)}</View>
                          {job.job_url && (<View style={styles.jobFooter}><Text style={styles.viewJobText}>View Details</Text><Icon name="arrow-right" size={12} color="#4A6A3B" /></View>)}
                        </TouchableOpacity>
                      ))}{jobs.length > 4 && (<TouchableOpacity style={styles.viewAllButton} onPress={() => handleStatClick('jobs')}><Text style={styles.viewAllText}>View All {jobs.length} Jobs</Text></TouchableOpacity>)}
                    </>) : (<View style={styles.emptyJobs}><Icon name="briefcase" size={32} color="#D1D5DB" /><Text style={styles.emptyJobsText}>No jobs found</Text><TouchableOpacity onPress={refreshJobs} style={styles.refreshButton}><Text style={styles.refreshButtonText}>Refresh</Text></TouchableOpacity></View>)}
              </View>
            </SpringCard>

            {assessmentHistory.length > 0 && (
              <SpringCard delay={contentReady ? 1080 : 9999} style={{ marginHorizontal: 16, marginBottom: 20 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}><Icon name="clock-outline" size={18} color="#4A6A3B" /><Text style={styles.sectionTitle}>Recent Assessments</Text></View>
                  {assessmentHistory.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <View style={styles.historyIcon}><Icon name="folder" size={16} color="#4A6A3B" /></View>
                      <View style={styles.historyInfo}><Text style={styles.historyCategory}>{item.category_name}</Text><Text style={styles.historyDate}>{formatDate(item.completed_at)}</Text></View>
                      {item.top_match && <Text style={styles.historyScore}>{item.top_match.score}%</Text>}
                    </View>
                  ))}
                </View>
              </SpringCard>
            )}
          </>
        )}
      </Animated.ScrollView>

      <StatsModal visible={modalVisible} onClose={() => setModalVisible(false)} type={modalData.type} data={modalData} onRefresh={modalData.type === 'jobs' ? refreshJobs : null} refreshing={modalData.type === 'jobs' ? refreshingJobs : false} />
      <RetakeConfirmationModal visible={showRetakeModal} onClose={() => setShowRetakeModal(false)} onConfirm={confirmRetake} />
    </View>
  );
}

// ─── Styles (same as before, including below) ─────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skeletonHeader: { backgroundColor: '#4A6A3B', paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, marginBottom: 16 },
  headerSection: { backgroundColor: '#4A6A3B', paddingTop: 50, paddingBottom: 24, marginBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 20 },
  brandSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  brandLogo: { width: 38, height: 38, marginRight: 12 },
  brandTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  brandSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  profileButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  profileImage: { width: '100%', height: '100%' },
  profileInitials: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  profileInitialsText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', paddingHorizontal: 20 },
  userName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8, paddingHorizontal: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 20 },
  statusBadgeText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginLeft: 6 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 14, marginHorizontal: 20 },
  categoryTagText: { fontSize: 12, color: '#fff', marginLeft: 6 },
  retakeHeaderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginHorizontal: 20 },
  retakeHeaderText: { fontSize: 15, fontWeight: '500', color: '#fff', marginHorizontal: 8 },
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 60, backgroundColor: '#fff', borderRadius: 22, borderWidth: 1.5, borderColor: '#D1D5DB' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 16, textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  startButton: { backgroundColor: '#4A6A3B', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30 },
  startButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20, paddingHorizontal: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D5DB' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  statErrorText: { fontSize: 8, color: '#EF4444' },
  bestMatchCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, borderWidth: 1.5, borderColor: '#D1D5DB', position: 'relative' },
  cardArrowIcon: { position: 'absolute', bottom: 14, right: 14 },
  bestMatchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bestMatchHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  bestMatchTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 },
  matchBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  matchBadgeText: { fontSize: 11, fontWeight: '500' },
  bestMatchContent: { flexDirection: 'row', gap: 16 },
  bestMatchIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F4F7F2', alignItems: 'center', justifyContent: 'center' },
  bestMatchInfo: { flex: 1 },
  bestMatchCode: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  bestMatchName: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  scoreLabel: { fontSize: 11, color: '#6B7280' },
  scoreValue: { fontSize: 11, fontWeight: '600', color: '#4A6A3B' },
  bestMatchDetails: { flexDirection: 'row', gap: 24 },
  detailText: { fontSize: 12, color: '#6B7280' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, borderWidth: 1.5, borderColor: '#D1D5DB' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  skillsList: { gap: 14 },
  skillItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  skillName: { fontSize: 14, color: '#1F2937', flex: 1 },
  skillRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skillLevelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  skillLevelText: { fontSize: 11, fontWeight: '500' },
  skillScore: { fontSize: 14, fontWeight: '600', width: 30, textAlign: 'right' },
  gapsSection: { marginTop: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FEF9E6', borderRadius: 16, paddingHorizontal: 14, paddingBottom: 14 },
  gapsTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 10 },
  gapItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  gapText: { fontSize: 13, color: '#6B7280', flex: 1 },
  noSkillsText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20 },
  loadingState: { paddingVertical: 20 },
  errorState: { alignItems: 'center', paddingVertical: 20 },
  errorText: { fontSize: 12, color: '#999', marginTop: 6 },
  jobItem: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 14, marginBottom: 12 },
  jobItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  jobTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  jobMatchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  jobMatchText: { fontSize: 10, fontWeight: '500' },
  jobCompany: { fontSize: 12, color: '#4A6A3B', marginBottom: 6 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 },
  jobMetaText: { fontSize: 10, color: '#9CA3AF', marginLeft: 3 },
  jobFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  viewJobText: { fontSize: 11, color: '#4A6A3B', marginRight: 4 },
  emptyJobs: { alignItems: 'center', paddingVertical: 18 },
  emptyJobsText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  refreshButton: { backgroundColor: '#4A6A3B', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 16, marginTop: 8 },
  refreshButtonText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  viewAllButton: { marginTop: 8, paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  viewAllText: { fontSize: 12, color: '#4A6A3B', fontWeight: '500' },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  historyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F4F7F2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  historyInfo: { flex: 1 },
  historyCategory: { fontSize: 13, fontWeight: '500', color: '#1F2937' },
  historyDate: { fontSize: 10, color: '#9CA3AF' },
  historyScore: { fontSize: 13, fontWeight: '600', color: '#4A6A3B' },
  courseItem: { marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  courseItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  courseCode: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  scoreBadgeText: { fontSize: 11, fontWeight: '500' },
  courseName: { fontSize: 12, color: '#6B7280' },
  viewMoreText: { fontSize: 12, color: '#4A6A3B', textAlign: 'center', marginTop: 4 },
});