// frontend-web/src/pages/admin/ManageCategories.js - Enhanced Visuals

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ComputerDesktopIcon,
  HeartIcon,
  AcademicCapIcon,
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
  Squares2X2Icon,
  ViewColumnsIcon,
  PhotoIcon,
  ArrowPathIcon,
  EyeIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import technologyImg from '../../assets/technology.png';
import healthMedicalScienceImg from '../../assets/healthmedicalscience.png';
import educationImg from '../../assets/education.png';
import engineeringImg from '../../assets/engineering.png';
import artsMediaCommunicationImg from '../../assets/artsmediacommunication.png';
import socialSciencesImg from '../../assets/socialscience.png';
import hospitalityTourismImg from '../../assets/hospitalitytourism.png';
import businessManagementImg from '../../assets/businessmanagement.png';

import ConfirmModal from '../../components/admin/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';

const colorOptions = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-blue-600', hex: '#3B82F6' },
  { value: 'red', label: 'Red', bg: 'bg-red-500', light: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-red-600', hex: '#EF4444' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', light: 'bg-green-100 text-green-700', gradient: 'from-green-500 to-green-600', hex: '#10B981' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500', light: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-amber-600', hex: '#F59E0B' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', light: 'bg-purple-100 text-purple-700', gradient: 'from-purple-500 to-purple-600', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', light: 'bg-orange-100 text-orange-700', gradient: 'from-orange-500 to-orange-600', hex: '#F97316' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500', light: 'bg-pink-100 text-pink-700', gradient: 'from-pink-500 to-pink-600', hex: '#EC4899' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', light: 'bg-indigo-100 text-indigo-700', gradient: 'from-indigo-500 to-indigo-600', hex: '#6366F1' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', light: 'bg-cyan-100 text-cyan-700', gradient: 'from-cyan-500 to-cyan-600', hex: '#06B6D4' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', light: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-emerald-600', hex: '#10B981' }
];

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryUsers, setCategoryUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'ComputerDesktopIcon',
    color: 'blue',
    image_file: null,
    image_preview: null,
    image_url: null,
    display_order: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const defaultCategoryImages = {
    'Technology': technologyImg,
    'Health & Medical Science': healthMedicalScienceImg,
    'Education': educationImg,
    'Engineering': engineeringImg,
    'Arts, Media, & Communication': artsMediaCommunicationImg,
    'Social Sciences': socialSciencesImg,
    'Hospitality & Tourism': hospitalityTourismImg,
    'Business & Management': businessManagementImg,
  };

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
    'FolderIcon': FolderIcon
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
    { value: 'FolderIcon', label: 'Folder', emoji: '📁' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await axios.get('/api/admin/categories');
      console.log('Categories fetched:', response.data);
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.msg || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCategories(true);
  };

  const getIconComponent = (iconName) => {
    const Icon = iconComponents[iconName] || FolderIcon;
    return Icon;
  };

  const getCategoryImageUrl = (category) => {
  if (category.image_url) return category.image_url;
  return defaultCategoryImages[category.name] || null;
};

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setFormData({
      ...formData,
      image_file: file,
      image_preview: previewUrl,
      image_url: null
    });
  };

  const uploadImage = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
    try {
      const response = await axios.post('/api/admin/categories/upload-image', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.image_url;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error('Failed to upload image');
    }
  };

  const removeImage = () => {
    if (formData.image_preview) {
      URL.revokeObjectURL(formData.image_preview);
    }
    setFormData({
      ...formData,
      image_file: null,
      image_preview: null,
      image_url: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'FolderIcon',
      color: category.color || 'blue',
      image_file: null,
      image_preview: category.image_url ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${category.image_url}` : null,
      image_url: category.image_url || null,
      display_order: category.display_order || 0
    });
    setShowModal(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    setDeleting(true);
    setError('');
    
    try {
      console.log(`Deleting category: ${categoryToDelete.name} (ID: ${categoryToDelete.id})`);
      await axios.delete(`/api/admin/categories/${categoryToDelete.id}`);
      setSuccess(`Category "${categoryToDelete.name}" and all associated data deleted successfully`);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.msg || 'Error deleting category. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    
    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index - 1];
    newCategories[index - 1] = temp;
    
    try {
      await Promise.all([
        axios.put(`/api/admin/categories/${newCategories[index].id}`, {
          display_order: index
        }),
        axios.put(`/api/admin/categories/${newCategories[index - 1].id}`, {
          display_order: index - 1
        })
      ]);
      
      setCategories(newCategories);
      setSuccess('Order updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Error updating order');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === categories.length - 1) return;
    
    const newCategories = [...categories];
    const temp = newCategories[index];
    newCategories[index] = newCategories[index + 1];
    newCategories[index + 1] = temp;
    
    try {
      await Promise.all([
        axios.put(`/api/admin/categories/${newCategories[index].id}`, {
          display_order: index
        }),
        axios.put(`/api/admin/categories/${newCategories[index + 1].id}`, {
          display_order: index + 1
        })
      ]);
      
      setCategories(newCategories);
      setSuccess('Order updated');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Error updating order');
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.name) {
        setError('Category name is required');
        return;
      }

      let image_url = formData.image_url;
      
      if (formData.image_file) {
        setUploadingImage(true);
        image_url = await uploadImage(formData.image_file);
        setUploadingImage(false);
      }
      
      const submitData = {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        display_order: formData.display_order,
        image_url: image_url
      };

      console.log('Submitting category data:', submitData);

      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory.id}`, submitData);
        setSuccess('Category updated successfully');
      } else {
        submitData.display_order = categories.length;
        await axios.post('/api/admin/categories', submitData);
        setSuccess('Category created successfully');
      }
      
      setShowModal(false);
      setEditingCategory(null);
      
      if (formData.image_preview && !formData.image_url) {
        URL.revokeObjectURL(formData.image_preview);
      }
      
      setFormData({
        name: '',
        description: '',
        icon: 'FolderIcon',
        color: 'blue',
        image_file: null,
        image_preview: null,
        image_url: null,
        display_order: 0
      });
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.msg || 'Error saving category');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    if (formData.image_preview && !formData.image_url) {
      URL.revokeObjectURL(formData.image_preview);
    }
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'FolderIcon',
      color: 'blue',
      image_file: null,
      image_preview: null,
      image_url: null,
      display_order: 0
    });
  };

  const handleViewDetails = async (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
    setLoadingUsers(true);
    try {
      const response = await axios.get(`/api/admin/categories/${category.id}/users`);
      setCategoryUsers(response.data.users || []);
    } catch (err) {
      console.error('Error fetching category users:', err);
      setError(err.response?.data?.msg || 'Failed to load users');
      setCategoryUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const getProfileImageUrl = (profilePicture) => profilePicture || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const getColorOption = (colorValue) => {
    return colorOptions.find(c => c.value === colorValue) || colorOptions[0];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {deleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center max-w-md mx-4"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deleting Category</h3>
              <p className="text-sm text-gray-500 text-center">
                Deleting "{categoryToDelete?.name}" and all associated data...
                <br />
                This may take a few seconds.
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-primary-500 h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Manage Categories
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
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Grid View"
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <ViewColumnsIcon className="h-4 w-4" />
              </button>
            </div>

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
              <span>Add Category</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-green-50 border-l-4 border-green-400 p-3 rounded-lg"
          >
            <div className="flex">
              <CheckCircleIcon className="h-4 w-4 text-green-400" />
              <p className="ml-2 text-sm text-green-700">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
        {categories.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No categories found</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Category" to create one</p>
          </div>
        ) : (
          categories.map((cat, idx) => {
            const colorOption = getColorOption(cat.color);
            const IconComponent = getIconComponent(cat.icon);
            const categoryImage = getCategoryImageUrl(cat);
            const isHovered = hoveredCard === cat.id;
            
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                onHoverStart={() => setHoveredCard(cat.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className="group relative rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute inset-0">
                  {categoryImage ? (
                    <img 
                      src={categoryImage} 
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.backgroundColor = '#1e293b';
                      }}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${colorOption.gradient} opacity-90`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
                </div>
                
                <div 
                  className="absolute top-0 left-0 right-0 h-1 z-10"
                  style={{ backgroundColor: colorOption.hex }}
                />
                
                <div className="relative p-6 z-10 flex flex-col min-h-[320px] text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(idx);
                        }}
                        disabled={idx === 0}
                        className="p-1.5 bg-white/20 rounded-md text-white hover:bg-white/30 disabled:opacity-30 transition-all"
                        title="Move Up"
                      >
                        <ArrowUpIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(idx);
                        }}
                        disabled={idx === categories.length - 1}
                        className="p-1.5 bg-white/20 rounded-md text-white hover:bg-white/30 disabled:opacity-30 transition-all"
                        title="Move Down"
                      >
                        <ArrowDownIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
                    {cat.name}
                  </h3>
                  
                  <p className="text-sm text-white/80 mb-4 line-clamp-3 drop-shadow">
                    {cat.description || 'No description provided'}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-end pt-4 border-t border-white/20">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(cat);
                        }}
                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
                        title="View Users"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(cat);
                        }}
                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-all"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(cat);
                        }}
                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-red-500/50 transition-all"
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

      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">
          Total categories: {categories.length} • Last updated: {format(currentTime, 'h:mm a')}
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
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Image
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {formData.image_preview ? (
                          <>
                            <img 
                              src={formData.image_preview} 
                              alt="Category preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={removeImage}
                              className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <PhotoIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="category-image-upload"
                          disabled={uploadingImage}
                        />
                        <label
                          htmlFor="category-image-upload"
                          className={`inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs cursor-pointer hover:bg-gray-200 transition-colors ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <PhotoIcon className="h-3.5 w-3.5 mr-1" />
                          {uploadingImage ? 'Uploading...' : (formData.image_preview ? 'Change' : 'Upload')}
                        </label>
                        <p className="text-[10px] text-gray-400 mt-1">
                          800x800px, max 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="e.g., Technology"
                    />
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
                      placeholder="Describe this category..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color Theme
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

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Preview</h4>
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${getColorOption(formData.color).gradient} text-white`}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const PreviewIcon = getIconComponent(formData.icon);
                          return <PreviewIcon className="h-5 w-5" />;
                        })()}
                        <h5 className="font-bold text-sm">{formData.name || 'Category Name'}</h5>
                      </div>
                      <p className="text-xs text-white/80 mt-1">{formData.description || 'Description'}</p>
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
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : (editingCategory ? 'Update' : 'Create')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && selectedCategory && (
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
                <div className="sticky top-0 bg-gradient-to-r from-primary-50 via-white to-white border-b border-gray-200 p-5 rounded-t-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-primary-100 rounded-lg">
                          <UsersIcon className="h-5 w-5 text-primary-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          Users Interested in {selectedCategory.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500 ml-11">
                        These users have completed a full assessment in the <span className="font-medium text-gray-700">{selectedCategory.name}</span> category.
                        {categoryUsers.length > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            {categoryUsers.length} {categoryUsers.length === 1 ? 'user' : 'users'} found
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary-500 border-t-transparent mb-3"></div>
                      <p className="text-gray-500 text-sm">Loading user data...</p>
                      <p className="text-gray-400 text-xs mt-1">Fetching assessment history for this category</p>
                    </div>
                  ) : categoryUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium mb-1">No users have explored this category yet</p>
                      <p className="text-gray-400 text-sm max-w-md mx-auto">
                        When students complete assessments in the <span className="font-medium">{selectedCategory.name}</span> category, 
                        they will appear here with their top program matches.
                      </p>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                        <InformationCircleIcon className="h-4 w-4 text-blue-500 inline mr-1" />
                        <span className="text-xs text-blue-700">This data updates automatically when new assessments are completed.</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 flex items-start gap-2">
                        <InformationCircleIcon className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span>
                          Showing users who have completed both personal and real assessments in this category. 
                          The match score indicates their compatibility with the recommended program.
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {categoryUsers.map((user, idx) => {
                          const profileImage = getProfileImageUrl(user.profile_picture);
                          const initials = user.user_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          
                          return (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-all group">
                              <div className="flex-shrink-0">
                                {profileImage ? (
                                  <img
                                    src={profileImage}
                                    alt={user.user_name}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{user.user_name}</p>
                                <p className="text-xs text-gray-400">@{user.username}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {user.top_match_course && (
                                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200 group-hover:border-primary-200 transition-colors">
                                    {user.top_match_course}
                                  </span>
                                )}
                                {user.top_match_score && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    user.top_match_score >= 80 ? 'bg-green-100 text-green-700' :
                                    user.top_match_score >= 60 ? 'bg-primary-100 text-primary-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {user.top_match_score}%
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-xl flex justify-between items-center">
                  <p className="text-xs text-gray-400">
                    {categoryUsers.length > 0 ? `Last updated: Just now` : ''}
                  </p>
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
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? This will also delete all associated courses, careers, and questions. This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        confirmDisabled={deleting}
      />
    </motion.div>
  );
};

export default ManageCategories;