// frontend-web/src/pages/Dashboard.js - With separate job fetching endpoint
// FIX: profile picture URL now uses full backend URL

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  TrophyIcon,
  ClockIcon,
  BriefcaseIcon,
  StarIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  LightBulbIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  FolderIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import StatsModal from '../components/StatsModal';
import LoadingSpinner from '../components/LoadingSpinner';

const BACKEND_URL = 'https://career-compass-production-5a2e.up.railway.app';

const Dashboard = () => {
  const { user, justCompletedAssessment } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobFetchError, setJobFetchError] = useState(false);
  const [refreshingJobs, setRefreshingJobs] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
    data: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDashboard();
      fetchAssessmentHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/dashboard');
      setDashboardData(response.data);
      if (response.data.has_results) {
        fetchJobsSeparately();
      }
    } catch (err) {
      setDashboardData({ has_results: false, jobs: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobsSeparately = async () => {
    setLoadingJobs(true);
    setJobFetchError(false);
    try {
      const response = await axios.get('/api/student/jobs-recommended');
      if (response.data.jobs) {
        setDashboardData(prev => ({
          ...prev,
          jobs: response.data.jobs,
          jobs_count: response.data.jobs.length,
        }));
      }
    } catch (err) {
      setJobFetchError(true);
    } finally {
      setLoadingJobs(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshingJobs(true);
    setJobFetchError(false);
    try {
      const response = await axios.post('/api/student/refresh-jobs');
      if (response.data.jobs) {
        setDashboardData(prev => ({
          ...prev,
          jobs: response.data.jobs,
          jobs_count: response.data.jobs.length,
        }));
        if (modalState.type === 'jobs' && modalState.isOpen) {
          setModalState(prev => ({ ...prev, data: { ...prev.data, items: response.data.jobs } }));
        }
      }
    } catch (err) {
      setJobFetchError(true);
    } finally {
      setRefreshingJobs(false);
    }
  };

  const fetchAssessmentHistory = async () => {
    try {
      const response = await axios.get('/api/assessment/history');
      setAssessmentHistory(response.data.history || []);
    } catch (err) {
      // silently fail
    }
  };

  const handleStatClick = (type) => {
    let data = null;
    switch (type) {
      case 'courses':
        data = { items: dashboardData?.results?.recommended_courses || [], type: 'courses' };
        break;
      case 'jobs':
        data = { items: dashboardData?.jobs || [], type: 'jobs' };
        break;
      case 'assessments':
        data = { type: 'assessments', history: assessmentHistory, currentResults: dashboardData?.results };
        break;
      case 'topmatch':
        data = { item: dashboardData?.results?.recommended_courses?.[0], type: 'topmatch' };
        break;
      default:
        return;
    }
    setModalState({ isOpen: true, type, data });
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { text: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (score >= 60) return { text: 'Good', color: 'bg-blue-100 text-blue-700' };
    if (score >= 40) return { text: 'Potential', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Basic', color: 'bg-gray-100 text-gray-700' };
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'Strong': return 'bg-green-100 text-green-700 border-green-200';
      case 'Developing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Emerging': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Needs Work': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProfileImageUrl = () => {
    const profilePic = dashboardData?.user?.profile_picture || user?.profile_picture;
    if (!profilePic) return null;
    if (profilePic.startsWith('/')) {
      return `${BACKEND_URL}${profilePic}`;
    }
    return profilePic;
  };

  if (loading) return <LoadingSpinner />;

  const results = dashboardData?.results;
  const topCourse = results?.recommended_courses?.[0];
  const hasResults = dashboardData?.has_results === true;
  const skillScores = results?.skill_scores || [];
  const skillGaps = results?.skill_gaps || [];
  const jobs = dashboardData?.jobs || [];
  const selectedCategory = dashboardData?.selected_category;
  const profileImageUrl = getProfileImageUrl();

  // ── Greeting Logic ────────────────────────────────────────────────────────
  // `justCompletedAssessment` is true ONLY when a brand-new user has just
  // submitted their very first assessment in this session (set in RealAssessment.js).
  // It is cleared on logout or the next login, so returning users always see
  // "Welcome back" after they re-authenticate.
  const isNewUserJustFinished = hasResults && justCompletedAssessment;
  const greetingText = isNewUserJustFinished
    ? `Welcome, ${user?.first_name}!`
    : `Welcome back, ${user?.first_name}!`;
  const subtitleText = isNewUserJustFinished
    ? 'Your assessment is complete. Explore your results below.'
    : (hasResults ? 'Your career journey continues' : 'Ready to discover your perfect program?');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Welcome Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\\"60\\\" height=\\\"60\\\" viewBox=\\\"0 0 60 60\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"%3E%3Cg fill=\\\"none\\\" fill-rule=\\\"evenodd\\\"%3E%3Cg fill=\\\"%23ffffff\\\" fill-opacity=\\\"0.2\\\"%3E%3Cpath d=\\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-4xl font-bold mb-2">{greetingText}</h1>
      <p className="text-lg text-white/90 flex items-center">
        <ShieldCheckIcon className="w-5 h-5 mr-2" />
        {subtitleText}
      </p>
              {selectedCategory && (
                <p className="text-sm text-white/80 mt-2 flex items-center">
                  <FolderIcon className="w-4 h-4 mr-1" /> Latest category: {selectedCategory.name}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {hasResults && topCourse && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30">
                  <span className="font-semibold">{topCourse.course_code}</span> Top Match
                </div>
              )}
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="fill-white" viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 48h1440V0c-211.2 32-422.4 48-633.6 48C595.2 48 384 32 172.8 0 115.2 0 57.6 5.6 0 16.8V48z" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!hasResults ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 px-4">
            <div className="w-32 h-32 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
              <AcademicCapIcon className="w-16 h-16 text-primary-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Begin Your Program Discovery</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">Take our comprehensive assessment to discover programs that match your unique profile.</p>
            <button onClick={() => navigate('/welcome')} className="btn-primary px-8 py-4 text-lg">Start Assessment</button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                onClick={() => handleStatClick('courses')}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-primary-100 rounded-xl"><AcademicCapIcon className="w-6 h-6 text-primary-600" /></div>
                  <span className="text-2xl font-bold text-gray-900">{results?.recommended_courses?.length || 0}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Program Matches</h3>
                <p className="text-xs text-primary-500 mt-1">Click to view details →</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                onClick={() => handleStatClick('jobs')}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-100 rounded-xl"><BriefcaseIcon className="w-6 h-6 text-green-600" /></div>
                  <span className="text-2xl font-bold text-gray-900">
                    {loadingJobs ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div> : jobs.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">Job Opportunities</h3>
                  <button onClick={(e) => { e.stopPropagation(); refreshJobs(); }} disabled={refreshingJobs || loadingJobs} className="text-xs text-green-500 hover:text-green-600 flex items-center">
                    <ArrowPathIcon className={`h-3 w-3 mr-1 ${refreshingJobs ? 'animate-spin' : ''}`} />
                    {refreshingJobs ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                <p className="text-xs text-green-500 mt-1">{loadingJobs ? 'Loading jobs...' : (jobFetchError ? 'Click refresh to load jobs' : 'Real-time listings →')}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onClick={() => handleStatClick('assessments')}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-amber-100 rounded-xl"><DocumentTextIcon className="w-6 h-6 text-amber-600" /></div>
                  <span className="text-2xl font-bold text-gray-900">{assessmentHistory.length || 1}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Assessments Taken</h3>
                <p className="text-xs text-amber-500 mt-1">Click to view history →</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                onClick={() => handleStatClick('topmatch')}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-100 rounded-xl"><StarIcon className="w-6 h-6 text-purple-600" /></div>
                  <span className="text-2xl font-bold text-gray-900">{topCourse?.score || 0}%</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Best Match</h3>
                <p className="text-xs text-purple-500 mt-1">{topCourse?.course_code || 'N/A'}</p>
              </motion.div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {topCourse && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrophyIcon className="w-5 h-5 mr-2 text-amber-500" /> Your Best-Fit Program
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
                              <motion.div initial={{ width: 0 }} animate={{ width: `${topCourse.score}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" />
                            </div>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <div><p className="text-xs text-gray-500">Duration</p><p className="font-semibold">4 Years</p></div>
                            <div><p className="text-xs text-gray-500">Demand</p><p className="font-semibold text-green-600">High</p></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2 text-amber-500" /> Skills Overview
                  </h2>
                  {skillScores.length > 0 && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skillScores.slice(0, 6).map((skill, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                            <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getSkillLevelColor(skill.level)}`}>{skill.level}</span>
                              <span className="text-sm font-bold text-primary-600">{Math.round(skill.score)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {skillGaps.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <LightBulbIcon className="w-4 h-4 mr-1 text-amber-500" /> Recommended Focus Areas
                      </h3>
                      <div className="space-y-2">
                        {skillGaps.slice(0, 3).map((gap, idx) => (
                          <div key={idx} className="flex items-start p-3 bg-amber-50 rounded-xl border border-amber-200">
                            <CheckCircleIcon className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-gray-700">{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {skillScores.length === 0 && skillGaps.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No skill data available yet</p>
                  )}
                </motion.div>
              </div>

              {/* Right Column - Jobs Section */}
              <div className="space-y-6">
                {loadingJobs ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" /> Job Opportunities</h2>
                    <div className="text-center py-8">
                      <ArrowPathIcon className="w-12 h-12 mx-auto text-gray-300 animate-spin mb-4" />
                      <p className="text-gray-500">Loading job opportunities...</p>
                      <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
                    </div>
                  </motion.div>
                ) : jobFetchError ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" /> Job Opportunities</h2>
                    <div className="text-center py-8">
                      <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                      <p className="text-gray-500">Unable to load jobs</p>
                      <button onClick={refreshJobs} disabled={refreshingJobs} className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshingJobs ? 'animate-spin' : ''}`} /> {refreshingJobs ? 'Retrying...' : 'Try Again'}
                      </button>
                    </div>
                  </motion.div>
                ) : jobs.length > 0 ? (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" /> Job Opportunities</h2>
                      <button onClick={refreshJobs} disabled={refreshingJobs} className="text-xs text-primary-600 hover:text-primary-700 flex items-center">
                        <ArrowPathIcon className={`h-3 w-3 mr-1 ${refreshingJobs ? 'animate-spin' : ''}`} /> {refreshingJobs ? 'Refreshing...' : 'Refresh'}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {jobs.slice(0, 3).map((job, idx) => (
                        <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer group">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 group-hover:text-primary-600">{job.title}</h3>
                            {job.source && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                {job.source === 'adzuna' ? '🇸🇬 Singapore' : 'New'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-primary-600 mb-2">{job.company}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-2"><MapPinIcon className="h-3 w-3 mr-1 text-gray-400" />{job.location || 'Philippines'}</div>
                          {job.salary_min && (
                            <div className="flex items-center text-xs text-gray-500 mb-2"><CurrencyDollarIcon className="h-3 w-3 mr-1 text-gray-400" />{job.currency || '₱'}{job.salary_min.toLocaleString()} - {job.currency || '₱'}{job.salary_max?.toLocaleString()}</div>
                          )}
                          {job.course_code && (
                            <div className="mt-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchBadge(job.course_match_score).color}`}>{job.course_match_score}% match with {job.course_code}</span>
                            </div>
                          )}
                          <div className="mt-3 flex justify-end">
                            {job.job_url ? (
                              <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 font-medium hover:underline flex items-center" onClick={(e) => e.stopPropagation()}>
                                View Details <ArrowRightIcon className="h-3 w-3 ml-1" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">Check back for details</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {jobs.length > 3 && (
                      <button onClick={() => handleStatClick('jobs')} className="w-full mt-4 bg-primary-50 text-primary-700 py-2 rounded-xl text-sm font-medium hover:bg-primary-100 transition-all border border-primary-200">View All {jobs.length} Jobs</button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-primary-500" /> Job Opportunities</h2>
                    <div className="text-center py-8">
                      <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No jobs found at the moment</p>
                      <button onClick={refreshJobs} disabled={refreshingJobs} className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshingJobs ? 'animate-spin' : ''}`} /> {refreshingJobs ? 'Refreshing...' : 'Refresh Now'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Recent Assessment History Card */}
            {assessmentHistory.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><ClockIcon className="w-5 h-5 mr-2 text-primary-500" /> Recent Assessments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assessmentHistory.slice(0, 3).map((assessment, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center"><FolderIcon className="w-5 h-5 text-primary-600" /></div>
                        <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">{formatDate(assessment.completed_at)}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{assessment.category_name}</h4>
                      {assessment.top_match && (
                        <p className="text-xs text-gray-500">Top match: {assessment.top_match.course_code} ({assessment.top_match.score}%)</p>
                      )}
                    </div>
                  ))}
                </div>
                {assessmentHistory.length > 3 && (
                  <button onClick={() => handleStatClick('assessments')} className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium text-center border-t border-gray-100 pt-4">View All {assessmentHistory.length} Assessments</button>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      <StatsModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, type: null, data: null })} type={modalState.type} data={modalState.data} onRefresh={modalState.type === 'jobs' ? refreshJobs : null} />
    </div>
  );
};

export default Dashboard;