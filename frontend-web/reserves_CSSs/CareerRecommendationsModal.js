// frontend-web/src/components/CareerRecommendationsModal.js - Add related jobs

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  TagIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const CareerRecommendationsModal = ({ isOpen, onClose, career }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    if (isOpen && career?.career_id) {
      fetchRelatedJobs();
    }
  }, [isOpen, career]);

  const fetchRelatedJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await axios.get(`/api/jobs/by-career/${career.career_id}?limit=3`);
      if (response.data.success) {
        setRelatedJobs(response.data.jobs);
      }
    } catch (err) {
      console.error('Error fetching related jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDemandColor = (demand) => {
    switch(demand) {
      case 'High': return 'bg-green-100 text-green-700 border-green-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-primary-100 text-primary-700 border-primary-200';
    }
  };

  if (!isOpen || !career) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto shadow-xl border border-gray-200/50">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <BriefcaseIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{career.title}</h2>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDemandColor(career.demand_level)}`}>
                          {career.demand_level} Demand
                        </span>
                        <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                          {career.match_score}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Career Overview */}
                <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Career Overview
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {career.description || `A career as a ${career.title}`}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-primary-100">
                      <CurrencyDollarIcon className="h-6 w-6 mx-auto text-green-600 mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Salary Range</p>
                      <p className="font-semibold text-gray-900">
                        ₱{career.salary_min?.toLocaleString()} - ₱{career.salary_max?.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-primary-100">
                      <ArrowTrendingUpIcon className="h-6 w-6 mx-auto text-primary-600 mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Demand Level</p>
                      <p className={`font-semibold ${
                        career.demand_level === 'High' ? 'text-green-600' :
                        career.demand_level === 'Medium' ? 'text-amber-600' : 'text-gray-600'
                      }`}>{career.demand_level}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-primary-100">
                      <TagIcon className="h-6 w-6 mx-auto text-primary-600 mb-2" />
                      <p className="text-xs text-gray-500 mb-1">Match Score</p>
                      <p className="font-semibold text-primary-600">{career.match_score}%</p>
                    </div>
                  </div>
                </div>

                {/* Required Skills */}
                {career.required_skills?.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {career.required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium border border-primary-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Courses */}
                {career.related_courses?.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                      Recommended Programs
                    </h3>
                    
                    <div className="space-y-3">
                      {career.related_courses.map((course, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedCourse === idx
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedCourse(selectedCourse === idx ? null : idx)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{course.course_code}</h4>
                            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                              {Math.round(course.match_score)}% Match
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{course.course_name}</p>
                          
                          {selectedCourse === idx && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pt-4 border-t border-primary-200"
                            >
                              <p className="text-sm text-gray-700">
                                This program provides the foundation needed for a career as a {career.title}.
                              </p>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-Time Job Listings for this Career */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-2 text-primary-600" />
                    Real-Time Job Openings
                    {loadingJobs && <span className="ml-2 text-xs text-gray-400">(Loading...)</span>}
                  </h3>
                  
                  {relatedJobs.length > 0 ? (
                    <div className="space-y-3">
                      {relatedJobs.map((job, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            {job.source && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                {job.source === 'jooble' ? '🇵🇭 Local' : 'New'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-primary-600 mb-2">{job.company}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                            <span className="flex items-center">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {job.location || 'Philippines'}
                            </span>
                            {job.salary_min && (
                              <span className="flex items-center">
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                ₱{job.salary_min.toLocaleString()} - ₱{job.salary_max?.toLocaleString()}
                              </span>
                            )}
                            {job.posted_at && (
                              <span className="flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatDate(job.posted_at)}
                              </span>
                            )}
                          </div>
                          {job.job_url && (
                            <div className="flex justify-end">
                              <a
                                href={job.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                              >
                                View Details <ChevronRightIcon className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      {loadingJobs ? (
                        <p className="text-gray-400 text-sm">Fetching latest jobs...</p>
                      ) : (
                        <>
                          <BriefcaseIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No current openings found</p>
                          <p className="text-xs text-gray-400 mt-1">Check back later for opportunities</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = '/results';
                    }}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    View All Results
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CareerRecommendationsModal;