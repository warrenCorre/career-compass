// frontend-web/src/components/StatsModal.js - REMOVED careers from history

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  AcademicCapIcon, 
  BriefcaseIcon, 
  ClockIcon, 
  StarIcon, 
  MapPinIcon, 
  CurrencyDollarIcon, 
  TagIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

// Format date nicely
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatsModal = ({ isOpen, onClose, type, data, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch assessment history when modal opens for assessments type
  useEffect(() => {
    if (isOpen && type === 'assessments') {
      fetchAssessmentHistory();
    } else if (type === 'assessments' && data?.history) {
      // Use data passed from parent if available
      setHistoryData(data.history || []);
    }
  }, [isOpen, type, data]);

  const fetchAssessmentHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await axios.get('/api/assessment/history');
      setHistoryData(response.data.history || []);
    } catch (err) {
      console.error('Error fetching assessment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen) return null;

  const handleRefresh = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!onRefresh) {
      console.warn('No refresh function provided');
      return;
    }
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTitle = () => {
    switch(type) {
      case 'courses': return 'Program Matches';
      case 'jobs': return 'Job Opportunities';
      case 'assessments': return 'Assessment History';
      case 'topmatch': return 'Top Match';
      default: return 'Details';
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'courses': return <AcademicCapIcon className="h-5 w-5 text-primary-600" />;
      case 'jobs': return <BriefcaseIcon className="h-5 w-5 text-primary-600" />;
      case 'assessments': return <DocumentTextIcon className="h-5 w-5 text-amber-600" />;
      case 'topmatch': return <StarIcon className="h-5 w-5 text-amber-500" />;
      default: return null;
    }
  };

  const getBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 60) return 'bg-primary-50 text-primary-700 border-primary-200';
    if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getSourceBadge = (source) => {
    switch(source) {
      case 'remotive':
        return { text: 'Remote', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'arbeitnow':
        return { text: 'International', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'mock':
      case 'ph_mock':
        return { text: 'Local', bg: 'bg-green-50 text-green-700 border-green-200' };
      default:
        return { text: 'Local', bg: 'bg-primary-50 text-primary-700 border-primary-200' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden pointer-events-auto shadow-xl border border-gray-200/50">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-gray-50">
                    {getIcon()}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
                  {type === 'assessments' && historyData.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      {historyData.length} total
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {type === 'jobs' && (
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 border ${
                        onRefresh 
                          ? 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:scale-105 cursor-pointer' 
                          : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-medium">
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* JOBS TAB */}
                {type === 'jobs' && data?.items && (
                  <div className="space-y-3">
                    {data.items.length === 0 ? (
                      <div className="text-center py-12">
                        <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm mb-1">No job opportunities found</p>
                        {onRefresh ? (
                          <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="mt-2 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                          >
                            <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh Now'}
                          </button>
                        ) : (
                          <p className="text-xs text-gray-400">Try again later</p>
                        )}
                      </div>
                    ) : (
                      data.items.map((job, idx) => {
                        const sourceBadge = getSourceBadge(job.source);
                        const cleanDescription = job.description ? stripHtml(job.description).substring(0, 120) + '...' : '';
                        const postedDate = formatDate(job.posted_at);
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-base">{job.title}</h3>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sourceBadge.bg}`}>
                                {sourceBadge.text}
                              </span>
                            </div>
                            
                            <p className="text-primary-600 text-sm font-medium mb-2">{job.company}</p>
                            
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                              <span className="flex items-center">
                                <MapPinIcon className="h-3 w-3 mr-1 text-gray-400" />
                                {job.location || 'Philippines'}
                              </span>
                              
                              {job.salary_min && (
                                <span className="flex items-center">
                                  <CurrencyDollarIcon className="h-3 w-3 mr-1 text-gray-400" />
                                  ₱{job.salary_min.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
                                </span>
                              )}
                              
                              {postedDate && (
                                <span className="flex items-center text-gray-400">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {postedDate}
                                </span>
                              )}
                            </div>

                            {job.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {job.skills.slice(0, 3).map((skill, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white text-gray-600 rounded-full text-xs border border-gray-200">
                                    {skill}
                                  </span>
                                ))}
                                {job.skills.length > 3 && (
                                  <span className="px-2 py-0.5 bg-white text-gray-400 rounded-full text-xs border border-gray-200">
                                    +{job.skills.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {cleanDescription && (
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                {cleanDescription}
                              </p>
                            )}

                            {job.job_url && (
                              <div className="flex justify-end">
                                <a
                                  href={job.job_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>View Details</span>
                                  <ChevronRightIcon className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* COURSES TAB */}
                {type === 'courses' && data?.items && (
                  <div className="space-y-3">
                    {data.items.length === 0 ? (
                      <div className="text-center py-12">
                        <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">No program matches found</p>
                      </div>
                    ) : (
                      data.items.map((item, idx) => {
                        const badgeColor = getBadgeColor(item.score);
                        
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">{item.course_code}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{item.course_name}</p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badgeColor}`}>
                                {item.score}%
                              </span>
                            </div>
                            
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                            )}
                            
                            <div className="flex items-center text-xs text-gray-400 mt-3">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              <span>4 years · </span>
                              <span className="ml-1 text-green-600">High Demand</span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ASSESSMENTS TAB */}
                {type === 'assessments' && (
                  <div className="space-y-4">
                    {loadingHistory ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                      </div>
                    ) : historyData.length > 0 ? (
                      <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-primary-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-primary-600">{historyData.length}</p>
                            <p className="text-xs text-gray-600">Total</p>
                          </div>
                          <div className="bg-primary-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-primary-600">
                              {new Set(historyData.map(a => a.category_name)).size}
                            </p>
                            <p className="text-xs text-gray-600">Categories</p>
                          </div>
                          <div className="bg-primary-50 rounded-xl p-3 text-center">
                            <p className="text-2xl font-bold text-primary-600">
                              {historyData.reduce((sum, a) => sum + (a.skills_assessed || 0), 0)}
                            </p>
                            <p className="text-xs text-gray-600">Skills</p>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative">
                          {historyData.map((assessment, idx) => (
                            <motion.div
                              key={assessment.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative pl-8 pb-6 last:pb-0"
                            >
                              {/* Timeline line */}
                              {idx < historyData.length - 1 && (
                                <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-primary-200"></div>
                              )}
                              
                              {/* Timeline dot */}
                              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-primary-300 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                              </div>
                              
                              {/* Content */}
                              <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <FolderIcon className="w-4 h-4 text-primary-600" />
                                    <span className="font-semibold text-gray-900">{assessment.category_name}</span>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                                    {formatDate(assessment.completed_at)}
                                  </span>
                                </div>
                                
                                {assessment.top_match && (
                                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-gray-500">Top Match</span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeColor(assessment.top_match.score).replace('border', '')}`}>
                                        {assessment.top_match.score}%
                                      </span>
                                    </div>
                                    <p className="font-medium text-gray-900">{assessment.top_match.course_code}</p>
                                    <p className="text-xs text-gray-600 mt-1">{assessment.top_match.course_name}</p>
                                  </div>
                                )}
                                
                                <div className="mt-3 text-xs text-gray-500">
                                  {assessment.skills_assessed || 0} skills assessed
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm mb-1">No assessments taken yet</p>
                        <p className="text-xs text-gray-400 mb-4">Complete your first assessment to see history</p>
                        <button
                          onClick={() => {
                            onClose();
                            window.location.href = '/welcome';
                          }}
                          className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                        >
                          Start Your First Assessment
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TOP MATCH TAB */}
                {type === 'topmatch' && data?.item && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 mx-auto bg-primary-50 rounded-xl flex items-center justify-center mb-3 border-2 border-white shadow-sm">
                          <AcademicCapIcon className="h-10 w-10 text-primary-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                          1
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900">{data.item.course_code}</h3>
                      <p className="text-sm text-gray-600 mt-1">{data.item.course_name}</p>
                      
                      <div className="inline-flex items-center justify-center mt-4 px-4 py-2 bg-primary-50 rounded-lg border border-primary-100">
                        <span className="text-2xl font-bold text-primary-600 mr-2">{data.item.score}%</span>
                        <span className="text-xs text-gray-500">match</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium text-gray-900">4 Years</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500">Demand</p>
                        <p className="font-medium text-green-600">High</p>
                      </div>
                    </div>

                    {data.item.description && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">{data.item.description}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.href = '/results';
                      }}
                      className="w-full bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                    >
                      View Full Results
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StatsModal;