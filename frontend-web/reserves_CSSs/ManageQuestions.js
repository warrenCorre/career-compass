// frontend-web/src/pages/admin/ManageQuestions.js - Modern List View with mock data fetching

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  TagIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import ConfirmModal from '../src/components/admin/ConfirmModal';
import LoadingSpinner from '../src/components/LoadingSpinner';

// Color options for category badges
const colorOptions = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-700', hex: '#3B82F6' },
  { value: 'red', label: 'Red', bg: 'bg-red-500', light: 'bg-red-100 text-red-700', hex: '#EF4444' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', light: 'bg-green-100 text-green-700', hex: '#10B981' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', light: 'bg-yellow-100 text-yellow-700', hex: '#F59E0B' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', light: 'bg-purple-100 text-purple-700', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', light: 'bg-orange-100 text-orange-700', hex: '#F97316' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500', light: 'bg-pink-100 text-pink-700', hex: '#EC4899' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', light: 'bg-indigo-100 text-indigo-700', hex: '#6366F1' }
];

const ManageQuestions = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [personalQuestions, setPersonalQuestions] = useState([]);
  const [realQuestions, setRealQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [questionType, setQuestionType] = useState('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    text: '',
    options: [
      { text: '', value: 1 },
      { text: '', value: 2 },
      { text: '', value: 3 },
      { text: '', value: 4 }
    ],
    tags: [],
    difficulty: 'medium'
  });

  const difficultyOptions = ['easy', 'medium', 'hard'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [personalRes, realRes, categoriesRes] = await Promise.all([
        axios.get('/api/admin/personal-questions'),
        axios.get('/api/admin/real-questions'),
        axios.get('/api/admin/categories')
      ]);
      
      setPersonalQuestions(personalRes.data);
      setRealQuestions(realRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.color) {
      return colorOptions.find(c => c.value === category.color) || colorOptions[0];
    }
    return colorOptions[0];
  };

  const handleEdit = (question, type) => {
    setEditingQuestion(question);
    setQuestionType(type);
    setFormData({
      category_id: question.category_id,
      text: question.text,
      options: question.options || [
        { text: '', value: 1 },
        { text: '', value: 2 },
        { text: '', value: 3 },
        { text: '', value: 4 }
      ],
      tags: question.tags || [],
      difficulty: question.difficulty || 'medium'
    });
    setShowModal(true);
  };

  const handleDeleteClick = (question, type) => {
    setQuestionToDelete({ ...question, type });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;
    
    const endpoint = questionToDelete.type === 'personal' ? 'personal-questions' : 'real-questions';
    
    try {
      setError('');
      await axios.delete(`/api/admin/${endpoint}/${questionToDelete.id}`);
      setSuccess('Question deleted successfully');
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting question');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = field === 'value' ? parseInt(value) || 0 : value;
    setFormData({...formData, options: newOptions});
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.category_id || !formData.text) {
        setError('Please fill in all required fields');
        return;
      }

      const invalidOptions = formData.options.some(opt => !opt.text || !opt.value);
      if (invalidOptions) {
        setError('All options must have text and value');
        return;
      }

      const endpoint = questionType === 'personal' ? 'personal-questions' : 'real-questions';
      
      if (editingQuestion) {
        await axios.put(`/api/admin/${endpoint}/${editingQuestion.id}`, formData);
        setSuccess('Question updated successfully');
      } else {
        await axios.post(`/api/admin/${endpoint}`, formData);
        setSuccess('Question created successfully');
      }
      
      setShowModal(false);
      setEditingQuestion(null);
      setFormData({
        category_id: '',
        text: '',
        options: [
          { text: '', value: 1 },
          { text: '', value: 2 },
          { text: '', value: 3 },
          { text: '', value: 4 }
        ],
        tags: [],
        difficulty: 'medium'
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error saving question');
    }
  };

  const resetForm = () => {
    setEditingQuestion(null);
    setFormData({
      category_id: '',
      text: '',
      options: [
        { text: '', value: 1 },
        { text: '', value: 2 },
        { text: '', value: 3 },
        { text: '', value: 4 }
      ],
      tags: [],
      difficulty: 'medium'
    });
    setTagInput('');
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const currentQuestions = activeTab === 'personal' ? personalQuestions : realQuestions;

  // Filter questions based on search and category
  const filteredQuestions = currentQuestions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || q.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <motion.h1 
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Manage Questions
            </motion.h1>
            <motion.p 
              className="text-gray-600 mt-2 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400" />
              Personal: {personalQuestions.length} | Real: {realQuestions.length}
            </motion.p>
          </div>
          
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setQuestionType(activeTab);
              setShowModal(true);
            }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all group"
          >
            <motion.div
              animate={{ rotate: 0 }}
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
            </motion.div>
            Add {activeTab === 'personal' ? 'Personal' : 'Real'} Question
          </motion.button>
        </div>
      </motion.div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm"
          >
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-sm"
          >
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <p className="ml-3 text-sm text-green-700">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/30 backdrop-blur-sm p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === 'personal'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          Personal Assessment
        </button>
        <button
          onClick={() => setActiveTab('real')}
          className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
            activeTab === 'real'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          Real Assessment
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions by text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <FolderIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setSearchTerm('');
            setSelectedCategory('');
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all"
        >
          Clear Filters
        </motion.button>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200"
          >
            <QuestionMarkCircleIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No questions found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const categoryColor = getCategoryColor(q.category_id);
            
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20, x: -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex items-start">
                  {/* Color Accent Bar */}
                  <div 
                    className="w-1.5 h-full self-stretch"
                    style={{ backgroundColor: categoryColor.hex }}
                  />
                  
                  {/* Icon */}
                  <div className="px-5 py-4">
                    <div className={`w-12 h-12 rounded-xl ${categoryColor.light} flex items-center justify-center`}>
                      <QuestionMarkCircleIcon className="h-6 w-6" style={{ color: categoryColor.hex }} />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 py-4 pr-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor.light}`}>
                            {getCategoryName(q.category_id)}
                          </span>
                          {activeTab === 'real' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {q.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{q.text}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <SparklesIcon className="h-3 w-3" />
                            {q.options?.length || 0} options
                          </span>
                          {activeTab === 'real' && q.tags?.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <TagIcon className="h-3 w-3" />
                              {q.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {q.tags.length > 3 && (
                                <span className="text-gray-400">+{q.tags.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(q, activeTab)}
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05, rotate: -5 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteClick(q, activeTab)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Question Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl">
                <motion.div 
                  className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                      {editingQuestion ? 'Edit' : 'Add New'} {questionType === 'personal' ? 'Personal' : 'Real'} Question
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </motion.button>
                  </div>
                </motion.div>

                <div className="p-6 space-y-6">
                  {/* Category Selection */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </motion.div>

                  {/* Question Text */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.text}
                      onChange={(e) => setFormData({...formData, text: e.target.value})}
                      rows="3"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                      placeholder="Enter your question here..."
                      required
                    />
                  </motion.div>

                  {/* Real Question Specific Fields */}
                  {questionType === 'real' && (
                    <>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty
                        </label>
                        <div className="flex gap-3">
                          {difficultyOptions.map(level => (
                            <motion.button
                              key={level}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setFormData({...formData, difficulty: level})}
                              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                                formData.difficulty === level
                                  ? level === 'easy' ? 'bg-green-500 text-white shadow-md' :
                                    level === 'medium' ? 'bg-yellow-500 text-white shadow-md' :
                                    'bg-red-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tags
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                            placeholder="e.g., programming, design"
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={addTag}
                            className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                          >
                            Add
                          </motion.button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm flex items-center"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-2 text-primary-700 hover:text-primary-900"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}

                  {/* Answer Options */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Answer Options <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-4">
                      {formData.options.map((opt, idx) => (
                        <motion.div 
                          key={idx} 
                          className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">
                              Option {idx + 1} Text
                            </label>
                            <input
                              type="text"
                              placeholder={`Option ${idx + 1} description`}
                              value={opt.text}
                              onChange={(e) => updateOption(idx, 'text', e.target.value)}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                              required
                            />
                          </div>
                          <div className="sm:w-24">
                            <label className="block text-xs text-gray-500 mb-1">
                              Value
                            </label>
                            <input
                              type="number"
                              placeholder="Value"
                              value={opt.value}
                              onChange={(e) => updateOption(idx, 'value', e.target.value)}
                              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                              required
                              min="1"
                              max="4"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl flex justify-end space-x-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(74,106,59,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    {editingQuestion ? 'Update Question' : 'Create Question'}
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </motion.div>
  );
};

export default ManageQuestions;