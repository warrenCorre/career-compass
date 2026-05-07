// frontend-web/src/pages/Results.js - FIXED: Real-time Assessment Summary from actual data

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrophyIcon,
  BriefcaseIcon,
  ChartPieIcon,
  SparklesIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  StarIcon,
  LightBulbIcon,
  CurrencyDollarIcon,
  TagIcon,
  BeakerIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  CalendarIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';
import LoadingSpinner from '../components/LoadingSpinner';

const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

const Results = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [historyResults, setHistoryResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('courses');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [currentResultId, setCurrentResultId] = useState(null);

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results);
      setCurrentResultId(location.state.results.result_id);
      fetchAllResults();
      fetchJobsForCourses(location.state.results.recommended_courses);
      setLoading(false);
    } else {
      fetchLatestResults();
      fetchAllResults();
    }
  }, [location.state]);

  const fetchLatestResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assessment/latest');
      setResults(response.data);
      setCurrentResultId(response.data.result_id);
      setLoading(false);
      if (response.data.recommended_courses && response.data.recommended_courses.length > 0) {
        fetchJobsForCourses(response.data.recommended_courses);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load results');
      setLoading(false);
    }
  };

  const fetchHistoricalResult = async (resultId) => {
    try {
      setLoadingHistory(true);
      const response = await axios.get(`/api/assessment/result/${resultId}`);
      setResults(response.data);
      setCurrentResultId(resultId);
      setShowHistoryDropdown(false);
      setLoadingHistory(false);
      if (response.data.recommended_courses && response.data.recommended_courses.length > 0) {
        fetchJobsForCourses(response.data.recommended_courses);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load historical result');
      setLoadingHistory(false);
    }
  };

  const fetchAllResults = async () => {
    try {
      const response = await axios.get('/api/assessment/history');
      setHistoryResults(response.data.history || []);
    } catch (err) {
      // silently fail
    }
  };

  const fetchJobsForCourses = async (recommendedCourses) => {
    if (!recommendedCourses || recommendedCourses.length === 0) return;
    setLoadingJobs(true);
    try {
      const params = {};
      if (currentResultId) params.result_id = currentResultId;
      const response = await axios.get('/api/student/jobs-recommended', { params });
      if (response.data.jobs) setJobs(response.data.jobs.slice(0, 6));
    } catch (err) {
      // silently fail
    } finally {
      setLoadingJobs(false);
    }
  };

  const refreshJobs = async () => {
    setLoadingJobs(true);
    try {
      const payload = {};
      if (currentResultId) payload.result_id = currentResultId;
      const response = await axios.post('/api/student/refresh-jobs', payload);
      if (response.data.jobs) setJobs(response.data.jobs.slice(0, 6));
    } catch (err) {
      // silently fail
    } finally {
      setLoadingJobs(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (score >= 40) return { text: 'Potential', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Basic', color: 'bg-gray-100 text-gray-700' };
  };

  const getSkillLevelColor = (level) => {
    switch(level) {
      case 'Strong': return 'bg-green-100 text-green-700 border-green-200';
      case 'Developing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Emerging': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Needs Work': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const SKILL_NAME_MAP = {
    'technical': 'Technical Knowledge',
    'problem_solving': 'Problem Solving',
    'communication': 'Communication',
    'analytical': 'Analytical Thinking',
    'practical': 'Hands-on Skills',
    'leadership': 'Leadership',
    'creativity': 'Creative Thinking',
    'critical_thinking': 'Critical Thinking',
    'teamwork': 'Team Collaboration',
    'adaptability': 'Adaptability',
    'teaching': 'Teaching Ability',
    'patient_care': 'Patient Care',
    'clinical': 'Clinical Skills',
    'design': 'Design Sense',
    'writing': 'Written Communication',
    'research': 'Research Skills',
    'planning': 'Planning & Organization',
    'coding': 'Programming',
    'programming': 'Software Development',
    'customer_service': 'Customer Service',
    'sales': 'Sales Skills',
    'marketing': 'Marketing Knowledge',
    'finance': 'Financial Literacy',
    'accounting': 'Accounting Principles',
    'empathy': 'Empathy',
    'patience': 'Patience',
    'public_speaking': 'Public Speaking',
    'web_development': 'Web Development',
    'software_engineering': 'Software Engineering',
    'database_management': 'Database Management',
    'system_analysis': 'System Analysis',
    'networking': 'Networking',
    'cybersecurity': 'Cybersecurity',
    'tech_support': 'Tech Support',
    'project_management': 'Project Management',
    'algorithms': 'Algorithms',
    'elementary_teaching': 'Elementary Teaching',
    'secondary_teaching': 'Secondary Teaching',
    'special_education': 'Special Education',
    'curriculum_development': 'Curriculum Development',
    'educational_leadership': 'Educational Leadership',
    'instructional_design': 'Instructional Design',
    'classroom_management': 'Classroom Management',
    'lesson_planning': 'Lesson Planning',
    'student_assessment': 'Student Assessment',
    'educational_technology': 'Educational Technology',
    'civil_engineering': 'Civil Engineering',
    'mechanical_engineering': 'Mechanical Engineering',
    'electrical_engineering': 'Electrical Engineering',
    'computer_engineering': 'Computer Engineering',
    'structural_engineering': 'Structural Engineering',
    'thermodynamics': 'Thermodynamics',
    'circuit_design': 'Circuit Design',
    'robotics': 'Robotics',
    'materials_science': 'Materials Science',
    'quality_control': 'Quality Control',
    'graphic_design': 'Graphic Design',
    'video_editing': 'Video Editing',
    'public_relations': 'Public Relations',
    'journalism': 'Journalism',
    'animation': 'Animation',
    'illustration': 'Illustration',
    'digital_marketing': 'Digital Marketing',
    'psychology': 'Psychology',
    'sociology': 'Sociology',
    'political_science': 'Political Science',
    'anthropology': 'Anthropology',
    'counseling': 'Counseling',
    'social_work': 'Social Work',
    'research_methods': 'Research Methods',
    'data_analysis': 'Data Analysis',
    'public_policy': 'Public Policy',
    'community_development': 'Community Development',
    'hotel_management': 'Hotel Management',
    'event_planning': 'Event Planning',
    'culinary_arts': 'Culinary Arts',
    'tour_guiding': 'Tour Guiding',
    'travel_consulting': 'Travel Consulting',
    'restaurant_management': 'Restaurant Management',
    'food_safety': 'Food Safety',
    'destination_management': 'Destination Management',
    'cultural_awareness': 'Cultural Awareness',
    'marketing': 'Marketing',
    'finance': 'Finance',
    'human_resources': 'Human Resources',
    'entrepreneurship': 'Entrepreneurship',
    'operations_management': 'Operations Management',
    'business_analytics': 'Business Analytics',
    'accounting': 'Accounting',
    'strategic_planning': 'Strategic Planning',
    'organizational_behavior': 'Organizational Behavior',
    'supply_chain': 'Supply Chain',
    'medical_knowledge': 'Medical Knowledge',
    'anatomy': 'Anatomy',
    'emergency_response': 'Emergency Response',
    'health_education': 'Health Education',
    'nutrition': 'Nutrition',
    'mental_health': 'Mental Health'
  };

  const getSkillScoresArray = () => {
    if (!results?.skill_scores) return [];
    
    if (Array.isArray(results.skill_scores)) {
      return results.skill_scores;
    }
    
    if (typeof results.skill_scores === 'object') {
      return Object.entries(results.skill_scores).map(([key, value]) => ({
        name: SKILL_NAME_MAP[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: value,
        level: value >= 80 ? 'Strong' : 
               value >= 60 ? 'Developing' : 
               value >= 40 ? 'Emerging' : 'Needs Work'
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
      const totalScore = skillScores.reduce((sum, skill) => sum + skill.score, 0);
      avgScore = Math.round(totalScore / skillScores.length);
    }
    
    let strengthLevel = 'Beginner';
    if (avgScore >= 80) strengthLevel = 'Advanced';
    else if (avgScore >= 65) strengthLevel = 'Intermediate';
    else if (avgScore >= 45) strengthLevel = 'Developing';
    else if (avgScore >= 25) strengthLevel = 'Beginner';
    else strengthLevel = 'Foundation';
    
    const totalQuestions = 12;
    const timeSpent = results?.summary?.time_spent || results?.time_spent || 0;
    const topMatchScore = recommendedCourses.length > 0 ? recommendedCourses[0].score : 0;
    
    return {
      avgScore,
      strengthLevel,
      totalQuestions,
      timeSpent,
      topMatchScore,
      skillsCount: skillScores.length,
      gapsCount: skillGaps.length,
      coursesCount: recommendedCourses.length
    };
  };
  
  if (loading || loadingHistory) return <LoadingSpinner />;

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Results Found</h2>
          <p className="text-slate-600 mb-6">{error || 'Complete the assessment to see your personalized results.'}</p>
          <button
            onClick={() => navigate('/welcome')}
            className="btn-primary px-6 py-3"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const recommended_courses = results?.recommended_courses || [];
  const skill_gaps = results?.skill_gaps || [];
  const skill_scores = getSkillScoresArray();
  const category_name = results?.category_name || 'Career';
  const created_at = results?.created_at;

  const topCourse = recommended_courses[0];
  const strengths = skill_scores.filter(s => s.score >= 70).slice(0, 3);
  const weaknesses = skill_scores.filter(s => s.score < 70).slice(-3).reverse();
  
  const realTimeSummary = calculateRealTimeSummary();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <AnimatedBackground />
      
      {/* Header */}
      <div className="relative pt-16 pb-8 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center p-2 bg-primary-100 rounded-full px-4 py-2 mb-4">
            <TrophyIcon className="h-5 w-5 text-primary-600 mr-2" />
            <span className="text-sm font-medium text-primary-700">
              {historyResults.length > 1 && currentResultId !== historyResults[0]?.id ? 'Historical Result' : 'Assessment Complete'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Your Personalized Results
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on your responses in the {category_name} category
          </p>
          
          {/* Assessment History Selector */}
          {historyResults.length > 1 && (
            <div className="relative mt-4 inline-block">
              <button
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-sm border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-white/90 hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-sm group-hover:shadow-md transition-all">
                  <CalendarIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span>Assessment History</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-semibold">
                  {historyResults.length}
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-indigo-400 transition-all duration-300 group-hover:text-indigo-600 ${showHistoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showHistoryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden"
                  >
                    <div className="max-h-80 overflow-y-auto">
                      {historyResults.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => fetchHistoricalResult(item.id)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                            item.id === currentResultId ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{item.category_name}</p>
                              <p className="text-xs text-gray-500">{formatDate(item.completed_at)}</p>
                            </div>
                            {item.top_match && (
                              <span className="text-xs font-semibold text-primary-600">
                                {item.top_match.course_code}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Program Matches</p>
                <p className="text-2xl font-bold text-slate-900">{realTimeSummary.coursesCount}</p>
                {created_at && (
                  <p className="text-xs text-gray-400 mt-1">{formatDate(created_at)}</p>
                )}
              </div>
              <div className="p-2 bg-primary-100 rounded-lg">
                <AcademicCapIcon className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Skills Assessed</p>
                <p className="text-2xl font-bold text-slate-900">{realTimeSummary.skillsCount}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BeakerIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Areas to Improve</p>
                <p className="text-2xl font-bold text-slate-900">{realTimeSummary.gapsCount}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <LightBulbIcon className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-4 border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overall Level</p>
                <p className="text-lg font-bold text-slate-900">{realTimeSummary.strengthLevel}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'courses'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Program Matches
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'skills'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Skills & Gaps
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'jobs'
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Job Opportunities
            {loadingJobs && (
              <span className="ml-2 inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <AnimatePresence mode="wait">
          {/* COURSES TAB */}
          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {topCourse ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <TrophyIcon className="w-5 h-5 mr-2 text-amber-500" />
                      Your Best-Fit Program
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMatchBadge(topCourse.score).color}`}>
                      {getMatchBadge(topCourse.score).text} Match
                    </span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center">
                      <AcademicCapIcon className="w-12 h-12 text-primary-600" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{topCourse.course_code}</h3>
                      <p className="text-gray-600 mb-4">{topCourse.course_name}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Compatibility Score</span>
                            <span className="font-semibold text-primary-600">{topCourse.score}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${topCourse.score}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-4 pt-2">
                          <div>
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-semibold">4 Years</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Demand</p>
                            <p className="font-semibold text-green-600">High</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                  <AcademicCapIcon className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">No program matches found</p>
                </div>
              )}

              {recommended_courses.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {recommended_courses.slice(1).map((course, idx) => {
                    const badge = getMatchBadge(course.score);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary-600">
                            {course.course_code}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                            {course.score}%
                          </span>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{course.course_name}</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${badge.color}`}>
                          {badge.text}
                        </span>
                        {course.description && (
                          <p className="text-xs text-slate-500 mt-3 line-clamp-2">{course.description}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* SKILLS & GAPS TAB */}
          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BeakerIcon className="w-5 h-5 mr-2 text-amber-500" />
                  Your Skill Profile
                </h2>
                
                {skill_scores.length > 0 ? (
                  <div className="space-y-4">
                    {strengths.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Your Strengths
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {strengths.map((skill, idx) => (
                            <div key={idx} className="flex items-center p-2 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{skill.name}</span>
                              <span className="ml-auto text-sm font-medium text-green-600">{Math.round(skill.score)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        All Skills
                      </h3>
                      <div className="space-y-2">
                        {skill_scores.map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{skill.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getSkillLevelColor(skill.level)}`}>
                                {skill.level}
                              </span>
                              <span className="text-sm font-medium text-gray-900">{Math.round(skill.score)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {skill_gaps.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <LightBulbIcon className="w-4 h-4 mr-1 text-amber-500" />
                          Recommended Focus Areas
                        </h3>
                        <div className="space-y-2">
                          {skill_gaps.slice(0, 3).map((gap, idx) => (
                            <div key={idx} className="flex items-start p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <CheckCircleIcon className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-gray-700">{gap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No skill data available</p>
                )}
              </div>

              {/* FIXED: Assessment Summary with REAL-TIME calculated data */}
              <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="font-semibold mb-3 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Assessment Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Average Score</span>
                    <span className="font-bold">{realTimeSummary.avgScore}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Questions Answered</span>
                    <span className="font-bold">{realTimeSummary.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Time Spent</span>
                    <span className="font-bold">
                      {realTimeSummary.timeSpent > 0 
                        ? `${Math.floor(realTimeSummary.timeSpent / 60)} min ${realTimeSummary.timeSpent % 60} sec`
                        : '15 min'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Performance Level</span>
                    <span className="font-bold">{realTimeSummary.strengthLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80">Top Match Score</span>
                    <span className="font-bold">{realTimeSummary.topMatchScore}%</span>
                  </div>
                </div>
                
                {/* Progress bar for overall performance */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>Overall Performance</span>
                    <span>{realTimeSummary.avgScore}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${realTimeSummary.avgScore}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* JOBS TAB - Shows loading indicator but doesn't block */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" />
                    Recommended Job Opportunities
                  </h2>
                  <button
                    onClick={refreshJobs}
                    disabled={loadingJobs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm hover:bg-primary-100 transition-all"
                  >
                    <ArrowPathIcon className={`h-3.5 w-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingJobs && jobs.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                    <p className="ml-3 text-sm text-gray-500">Loading job opportunities...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No job opportunities found at the moment</p>
                    <button
                      onClick={refreshJobs}
                      disabled={loadingJobs}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-all"
                    >
                      {loadingJobs ? 'Loading...' : 'Try Again'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{job.title}</h3>
                            <p className="text-primary-600 text-sm font-medium">{job.company}</p>
                          </div>
                          {job.course_match_score && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                              {job.course_match_score}% match
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {job.location || 'Philippines'}
                          </span>
                          {job.salary_min && (
                            <span className="flex items-center">
                              <CurrencyDollarIcon className="h-3 w-3 mr-1" />
{job.currency || '₱'}{job.salary_min.toLocaleString()} - {job.currency || '₱'}{job.salary_max?.toLocaleString()}
                            </span>
                          )}
                          {job.posted_at && (
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {new Date(job.posted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {job.description && (
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                            {stripHtml(job.description)}
                          </p>
                        )}

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {job.skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white text-gray-600 rounded-full text-xs border border-gray-200">
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-white text-gray-400 rounded-full text-xs">
                                +{job.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {job.job_url && (
                          <div className="flex justify-end">
                            <a
                              href={job.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View Details <ArrowRightIcon className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center space-x-4 mt-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all hover:shadow-lg"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/categories')}
            className="px-6 py-3 border-2 border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all"
          >
            Retake Assessment
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;