// frontend-web/src/pages/RealAssessment.js - FIXED (prevent refetching)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';

const RealAssessment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(900);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const isFirstTimeRef = useRef(false);

  // Single useAuth call — pull both values at once
  const { setJustCompletedAssessmentTrue } = useAuth();

  // Use ref to track if questions have been fetched
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!category) {
      navigate('/categories');
      return;
    }
    
    // Only fetch if we haven't already
    if (!hasFetched.current) {
      checkExistingResults();
      fetchQuestions();
      hasFetched.current = true;
    }
  }, [category, navigate]);

  const checkExistingResults = async () => {
    try {
      const response = await axios.get('/api/student/dashboard');
      // If has_results is false, this is the first assessment
      isFirstTimeRef.current = !response.data.has_results;
    } catch (err) {
      isFirstTimeRef.current = true;
    }
  };

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/assessment/real/questions');
      const questionsData = response.data.questions || [];
      setQuestions(questionsData);
      
      // Initialize answers with sequential IDs
      const initial = {};
      questionsData.forEach(q => { initial[q.id] = null; });
      setAnswers(initial);
      setTimerActive(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOut = async () => {
    if (Object.values(answers).some(a => a !== null)) {
      await handleSubmit(true);
    } else {
      navigate('/categories');
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      return newAnswers;
    });
    
    // Keep auto-advance
    if (currentIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    // Check if all questions answered
    const unanswered = questions.filter(q => answers[q.id] === null || answers[q.id] === undefined);
    if (!isAutoSubmit && unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    setError('');

    const timeSpent = 900 - timeLeft;

    try {
      const response = await axios.post('/api/assessment/real/submit', {
        answers: answers,
        time_spent: timeSpent
      });

      const isFirstTime = isFirstTimeRef.current;

      // ✅ SET THE FLAG so Dashboard shows "Welcome" instead of "Welcome back"
      // This flag is automatically cleared on the next login, so returning users
      // will always see "Welcome back" after their first session ends.
      setJustCompletedAssessmentTrue();

      navigate('/results', {
        state: { results: response.data, isFirstTime }
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No questions available</p>
          <button
            onClick={() => navigate('/categories')}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const isComplete = answeredCount === questions.length;

  const timerColor = timeLeft < 300 ? 'text-red-600' : timeLeft < 600 ? 'text-yellow-600' : 'text-primary-600';

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-8 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate('/categories')}
                  className="btn-outline px-4 py-2 text-sm flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                  {category?.name || 'Assessment'}
                </span>
                <h1 className="text-2xl font-bold gradient-text mt-2">
                  Real Assessment
                </h1>
              </div>
              <div className={`flex items-center space-x-2 bg-white/80 px-3 py-1 rounded-full shadow-md ${timerColor}`}>
                <ClockIcon className="h-4 w-4" />
                <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="progress-modern">
              <motion.div
                className="progress-bar-modern"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Question {currentIndex + 1}/{questions.length}</span>
              <span>{answeredCount}/{questions.length} answered</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="glass-card rounded-2xl p-8 mb-6"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-6">
                    {currentQuestion?.text}
                  </h2>
                  
                  <div className="space-y-3">
                    {currentQuestion?.options.map((opt, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                        className={`
                          w-full p-4 rounded-xl text-left transition-all
                          ${answers[currentQuestion.id] === opt.value
                            ? 'bg-primary-500 text-white shadow-md'
                            : 'bg-white/50 hover:bg-white/80 border border-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{opt.text}</span>
                          {answers[currentQuestion.id] === opt.value && (
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="btn-outline px-6 py-3 disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2 inline" />
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting || !isComplete}
                className={`btn-primary px-8 py-3 ${!isComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Submit Assessment'
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers[currentQuestion?.id]}
                className="btn-primary px-6 py-3 disabled:opacity-50"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RealAssessment;