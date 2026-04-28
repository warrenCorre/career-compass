// frontend-web/src/pages/PersonalAssessment.js - FIXED (prevent refetching)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';

const PersonalAssessment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { category } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!category) {
      navigate('/categories');
      return;
    }
    if (!hasFetched.current) {
      fetchQuestions();
      hasFetched.current = true;
    }
  }, [category, navigate]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/assessment/personal/questions/${category.id}`);
      const questionsData = response.data.questions || [];
      setQuestions(questionsData);
      const initial = {};
      questionsData.forEach(q => { initial[q.id] = null; });
      setAnswers(initial);
    } catch (err) {
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    if (currentIndex < questions.length - 1) {
      setTimeout(() => { setCurrentIndex(currentIndex + 1); }, 300);
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

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => answers[q.id] === null);
    if (unanswered.length > 0) {
      setError(`Please answer all questions before submitting (${unanswered.length} unanswered)`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await axios.post('/api/assessment/personal/submit', {
        category_id: category.id,
        answers: answers
      });
      navigate('/real-assessment', { state: { category } });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-gray-500 mb-4">No questions available for this category</p>
          <button onClick={() => navigate('/categories')} className="btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const isComplete = answeredCount === questions.length;

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-8 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <button onClick={() => navigate('/categories')} className="btn-outline px-4 py-2 text-sm flex items-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
                </button>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full">{category.name}</span>
                <h1 className="text-2xl font-bold gradient-text mt-2">Personal Assessment</h1>
              </div>
              <div className="text-sm text-gray-500">Question {currentIndex + 1}/{questions.length}</div>
            </div>
          </motion.div>

          <div className="mb-8">
            <div className="progress-modern">
              <motion.div className="progress-bar-modern" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Progress</span>
              <span>{answeredCount}/{questions.length} answered</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="glass-card rounded-2xl p-8 mb-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-6">{currentQuestion?.text}</h2>
                  <div className="space-y-3">
                    {currentQuestion?.options.map((opt, idx) => (
                      <motion.button key={idx} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${answers[currentQuestion.id] === opt.value ? 'bg-primary-500 text-white shadow-md' : 'bg-white/50 hover:bg-white/80 border border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <span>{opt.text}</span>
                          {answers[currentQuestion.id] === opt.value && <CheckCircleIcon className="h-5 w-5 text-white" />}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between">
            <button onClick={handlePrevious} disabled={currentIndex === 0} className="btn-outline px-6 py-3 disabled:opacity-50">
              <ArrowLeftIcon className="h-4 w-4 mr-2 inline" /> Previous
            </button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={handleSubmit} disabled={submitting || !isComplete} className="btn-primary px-8 py-3 disabled:opacity-50">
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div> Submitting...
                  </div>
                ) : 'Submit Assessment'}
              </button>
            ) : (
              <button onClick={handleNext} disabled={!answers[currentQuestion?.id]} className="btn-primary px-6 py-3 disabled:opacity-50">
                Next <ArrowRightIcon className="h-4 w-4 ml-2 inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonalAssessment;