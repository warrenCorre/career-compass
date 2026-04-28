// frontend-web/src/pages/admin/ManageCourses.js - Enhanced Visuals

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AcademicCapIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  ComputerDesktopIcon,
  HeartIcon,
  WrenchScrewdriverIcon,
  PaintBrushIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CodeBracketIcon,
  BeakerIcon,
  BookOpenIcon,
  CalculatorIcon,
  BuildingOffice2Icon,
  BoltIcon,
  MegaphoneIcon,
  NewspaperIcon,
  BuildingLibraryIcon,
  UsersIcon,
  MapIcon,
  FireIcon,
  RocketLaunchIcon,
  SparklesIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CloudIcon,
  ShieldCheckIcon,
  CameraIcon,
  FilmIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  TruckIcon,
  CpuChipIcon,
  MusicalNoteIcon,
  RadioIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import ConfirmModal from '../../components/admin/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';

const iconComponents = {
  'ComputerDesktopIcon': ComputerDesktopIcon,
  'HeartIcon': HeartIcon,
  'AcademicCapIcon': AcademicCapIcon,
  'WrenchScrewdriverIcon': WrenchScrewdriverIcon,
  'PaintBrushIcon': PaintBrushIcon,
  'UserGroupIcon': UserGroupIcon,
  'BuildingOfficeIcon': BuildingOfficeIcon,
  'ChartBarIcon': ChartBarIcon,
  'CodeBracketIcon': CodeBracketIcon,
  'BeakerIcon': BeakerIcon,
  'BookOpenIcon': BookOpenIcon,
  'CalculatorIcon': CalculatorIcon,
  'BuildingOffice2Icon': BuildingOffice2Icon,
  'BoltIcon': BoltIcon,
  'MegaphoneIcon': MegaphoneIcon,
  'NewspaperIcon': NewspaperIcon,
  'BuildingLibraryIcon': BuildingLibraryIcon,
  'UsersIcon': UsersIcon,
  'MapIcon': MapIcon,
  'FireIcon': FireIcon,
  'RocketLaunchIcon': RocketLaunchIcon,
  'SparklesIcon': SparklesIcon,
  'BriefcaseIcon': BriefcaseIcon,
  'DocumentTextIcon': DocumentTextIcon,
  'CloudIcon': CloudIcon,
  'FolderIcon': FolderIcon,
  'ShieldCheckIcon': ShieldCheckIcon,
  'CameraIcon': CameraIcon,
  'FilmIcon': FilmIcon,
  'GlobeAltIcon': GlobeAltIcon,
  'CurrencyDollarIcon': CurrencyDollarIcon,
  'TruckIcon': TruckIcon,
  'CpuChipIcon': CpuChipIcon,
  'MusicalNoteIcon': MusicalNoteIcon,
  'RadioIcon': RadioIcon,
  'PhotoIcon': PhotoIcon,
  'VideoCameraIcon': VideoCameraIcon
};

const iconOptions = [
  { value: 'ComputerDesktopIcon', label: 'Technology', emoji: '💻' },
  { value: 'HeartIcon', label: 'Health', emoji: '❤️' },
  { value: 'AcademicCapIcon', label: 'Education', emoji: '🎓' },
  { value: 'WrenchScrewdriverIcon', label: 'Engineering', emoji: '🔧' },
  { value: 'PaintBrushIcon', label: 'Arts', emoji: '🎨' },
  { value: 'UserGroupIcon', label: 'Social', emoji: '👥' },
  { value: 'BuildingOfficeIcon', label: 'Hospitality', emoji: '🏨' },
  { value: 'ChartBarIcon', label: 'Business', emoji: '📊' },
  { value: 'CodeBracketIcon', label: 'Coding', emoji: '💻' },
  { value: 'BeakerIcon', label: 'Science', emoji: '🧪' },
  { value: 'BookOpenIcon', label: 'Reading', emoji: '📖' },
  { value: 'CalculatorIcon', label: 'Math', emoji: '🧮' },
  { value: 'BuildingOffice2Icon', label: 'Construction', emoji: '🏗️' },
  { value: 'BoltIcon', label: 'Electricity', emoji: '⚡' },
  { value: 'MegaphoneIcon', label: 'Media', emoji: '📢' },
  { value: 'NewspaperIcon', label: 'Journalism', emoji: '📰' },
  { value: 'BuildingLibraryIcon', label: 'Government', emoji: '🏛️' },
  { value: 'UsersIcon', label: 'Community', emoji: '👥' },
  { value: 'MapIcon', label: 'Travel', emoji: '🗺️' },
  { value: 'FireIcon', label: 'Culinary', emoji: '🔥' },
  { value: 'RocketLaunchIcon', label: 'Entrepreneurship', emoji: '🚀' },
  { value: 'SparklesIcon', label: 'Innovation', emoji: '✨' },
  { value: 'BriefcaseIcon', label: 'Career', emoji: '💼' },
  { value: 'DocumentTextIcon', label: 'Document', emoji: '📄' },
  { value: 'CloudIcon', label: 'Cloud', emoji: '☁️' },
  { value: 'FolderIcon', label: 'Folder', emoji: '📁' },
  { value: 'ShieldCheckIcon', label: 'Security', emoji: '🛡️' },
  { value: 'CameraIcon', label: 'Photography', emoji: '📷' },
  { value: 'FilmIcon', label: 'Film', emoji: '🎬' },
  { value: 'GlobeAltIcon', label: 'International', emoji: '🌍' },
  { value: 'CurrencyDollarIcon', label: 'Finance', emoji: '💰' },
  { value: 'TruckIcon', label: 'Logistics', emoji: '🚚' },
  { value: 'CpuChipIcon', label: 'Hardware', emoji: '🖥️' },
  { value: 'MusicalNoteIcon', label: 'Music', emoji: '🎵' },
  { value: 'RadioIcon', label: 'Broadcast', emoji: '📻' },
  { value: 'PhotoIcon', label: 'Photography Alt', emoji: '🖼️' },
  { value: 'VideoCameraIcon', label: 'Video', emoji: '🎥' }
];

const colorOptions = [
  { value: 'primary', label: 'Primary Green', bg: 'bg-primary-500', gradient: 'from-primary-500 to-primary-600', hex: '#4A6A3B' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-600', hex: '#10B981' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', hex: '#3B82F6' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600', hex: '#8B5CF6' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500', gradient: 'from-amber-500 to-amber-600', hex: '#F59E0B' }
];

const StatCard = ({ icon: Icon, title, value, color, trend, trendValue }) => {
  const colorMap = {
    primary: 'from-primary-500 to-primary-600',
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600'
  };
  
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${colorMap[color]} p-4 shadow-md`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:translate-x-8 transition-transform duration-500"></div>
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value.toLocaleString()}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <ArrowTrendingUpIcon className="h-3 w-3 text-white/70" />
              <span className="text-[10px] text-white/70">{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [courseMatches, setCourseMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    category_id: '',
    duration: '4 years',
    icon: 'AcademicCapIcon',
    color: 'primary'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getIconComponent = (iconName) => {
    const Icon = iconComponents[iconName] || AcademicCapIcon;
    return Icon;
  };

  const getProfileImageUrl = (profilePicture) => {
    if (!profilePicture) return null;
    if (profilePicture.startsWith('/')) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${profilePicture}`;
    }
    return profilePicture;
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      const [coursesRes, categoriesRes] = await Promise.all([
        axios.get('/api/admin/courses', {
          params: {
            page: currentPage,
            per_page: 50,
            search: searchTerm || undefined,
            category_id: selectedCategory || undefined
          }
        }),
        axios.get('/api/admin/categories')
      ]);
      
      let coursesData = [];
      if (coursesRes.data && coursesRes.data.courses) {
        coursesData = coursesRes.data.courses;
        setTotalPages(coursesRes.data.pages || 1);
        setTotalCourses(coursesRes.data.total || coursesData.length);
      } else if (Array.isArray(coursesRes.data)) {
        coursesData = coursesRes.data;
        setTotalPages(1);
        setTotalCourses(coursesData.length);
      } else if (coursesRes.data && coursesRes.data.data && Array.isArray(coursesRes.data.data)) {
        coursesData = coursesRes.data.data;
        setTotalPages(1);
        setTotalCourses(coursesData.length);
      } else {
        coursesData = [];
        setTotalPages(1);
        setTotalCourses(0);
      }
      
      setCourses(coursesData);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.msg || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getColorOption = (colorValue) => {
    return colorOptions.find(c => c.value === colorValue) || colorOptions[0];
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      description: course.description || '',
      category_id: course.category_id,
      duration: course.duration || '4 years',
      icon: course.icon || 'AcademicCapIcon',
      color: course.color || 'primary'
    });
    setShowModal(true);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      setError('');
      await axios.delete(`/api/admin/courses/${courseToDelete.id}`);
      setSuccess('Course deleted successfully');
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err.response?.data?.msg || 'Error deleting course');
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.course_code || !formData.course_name || !formData.category_id) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingCourse) {
        await axios.put(`/api/admin/courses/${editingCourse.id}`, formData);
        setSuccess('Course updated successfully');
      } else {
        await axios.post('/api/admin/courses', formData);
        setSuccess('Course created successfully');
      }
      
      setShowModal(false);
      setEditingCourse(null);
      setFormData({
        course_code: '',
        course_name: '',
        description: '',
        category_id: '',
        duration: '4 years',
        icon: 'AcademicCapIcon',
        color: 'primary'
      });
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error saving course');
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      course_code: '',
      course_name: '',
      description: '',
      category_id: '',
      duration: '4 years',
      icon: 'AcademicCapIcon',
      color: 'primary'
    });
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('');
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleViewDetails = async (course) => {
    setSelectedCourseDetails(course);
    setShowViewModal(true);
    setLoadingMatches(true);
    try {
      const response = await axios.get(`/api/admin/courses/${course.id}/matches`);
      setCourseMatches(response.data.matches || []);
    } catch (err) {
      console.error('Error fetching course matches:', err);
      setError(err.response?.data?.msg || 'Failed to load matches');
      setCourseMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };

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
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Manage Courses
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(currentTime, 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-primary-600 font-medium">System Online</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all text-sm"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Course</span>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg"
          >
            <div className="flex">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-50 border-l-4 border-green-400 p-3 rounded-lg"
          >
            <div className="flex">
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
              <p className="ml-2 text-sm text-green-700">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={AcademicCapIcon}
          title="Total Courses"
          value={totalCourses}
          color="primary"
          trend={true}
          trendValue="+12 this month"
        />
        <StatCard
          icon={FolderIcon}
          title="Categories"
          value={categories.length}
          color="emerald"
          trend={true}
          trendValue="All active"
        />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses by code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-9 pr-24 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-3 py-1 bg-primary-500 text-white rounded-md text-xs font-medium hover:bg-primary-600 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
        
        <div className="relative min-w-[200px]">
          <FolderIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedCategory) && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm hover:bg-primary-100 transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No courses found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try a different search term' : 'Click "Add Course" to create one'}
            </p>
          </div>
        ) : (
          courses.map((course, idx) => {
            const courseColor = getColorOption(course.color || 'primary');
            const IconComponent = getIconComponent(course.icon);
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        backgroundColor: courseColor.value === 'primary' ? '#4A6A3B15' : `${courseColor.hex}15`,
                        color: courseColor.value === 'primary' ? '#4A6A3B' : courseColor.hex
                      }}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">
                          {course.course_code}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {getCategoryName(course.category_id)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm font-medium">{course.course_name}</p>
                      {course.description && (
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{course.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {course.duration || '4 years'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(course)}
                        className="p-1.5 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-all"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(course)}
                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            Showing {courses.length} of {totalCourses} courses
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Data reflects current system state • Last updated: {format(currentTime, 'h:mm a')}
        </p>
      </div>

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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {editingCourse ? 'Edit Course' : 'Add New Course'}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Course Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.course_code}
                        onChange={(e) => setFormData({...formData, course_code: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="e.g., BSIT"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Course Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.course_name}
                        onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="e.g., Bachelor of Science in IT"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="2"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="Describe the course..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        placeholder="4 years"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Icon
                      </label>
                      <select
                        value={formData.icon}
                        onChange={(e) => setFormData({...formData, icon: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      >
                        {iconOptions.map(icon => (
                          <option key={icon.value} value={icon.value}>
                            {icon.emoji} {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Accent Color
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({...formData, color: color.value})}
                          className={`w-6 h-6 rounded-full transition-all ${color.bg} ${
                            formData.color === color.value ? 'ring-2 ring-offset-1 ring-primary-500' : ''
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all"
                  >
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && selectedCourseDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Course Details</h3>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="bg-primary-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                        {(() => {
                          const IconComponent = getIconComponent(selectedCourseDetails.icon);
                          return <IconComponent className="h-6 w-6 text-primary-600" />;
                        })()}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{selectedCourseDetails.course_code}</h4>
                        <p className="text-gray-600 text-sm">{selectedCourseDetails.course_name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">
                            {getCategoryName(selectedCourseDetails.category_id)}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {selectedCourseDetails.duration || '4 years'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedCourseDetails.description && (
                      <p className="mt-3 text-sm text-gray-500">{selectedCourseDetails.description}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1.5 text-primary-500" />
                      Users Who Matched This Course
                    </h4>
                    {loadingMatches ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                      </div>
                    ) : courseMatches.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg">
                        No users have this course as a recommended match yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {courseMatches.slice(0, 5).map((match, idx) => {
                          const profileImage = getProfileImageUrl(match.profile_picture);
                          const initials = match.user_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-all">
                              <div className="flex-shrink-0">
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={match.user_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-xs">
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{match.user_name}</p>
                                <p className="text-xs text-gray-400">@{match.username}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  match.score >= 80 ? 'bg-green-100 text-green-700' :
                                  match.score >= 60 ? 'bg-primary-100 text-primary-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {match.score}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {courseMatches.length > 5 && (
                          <p className="text-center text-xs text-gray-400 pt-2">
                            +{courseMatches.length - 5} more users
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl flex justify-end">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to delete "${courseToDelete?.course_code} - ${courseToDelete?.course_name}"? This will also delete all associated careers.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </motion.div>
  );
};

export default ManageCourses;