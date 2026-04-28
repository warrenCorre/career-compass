// frontend-web/src/pages/CategorySelection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Import local images (fallbacks)
import technologyImg from '../assets/technology.png';
import healthMedicalScienceImg from '../assets/healthmedicalscience.png';
import educationImg from '../assets/education.png';
import engineeringImg from '../assets/engineering.png';
import artsMediaCommunicationImg from '../assets/artsmediacommunication.png';
import socialSciencesImg from '../assets/socialscience.png';
import hospitalityTourismImg from '../assets/hospitalitytourism.png';
import businessManagementImg from '../assets/businessmanagement.png';

import { 
  ComputerDesktopIcon,
  HeartIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  PaintBrushIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  FolderIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CategorySelection = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasExistingResults, setHasExistingResults] = useState(false);
  const [modalCategory, setModalCategory] = useState(null);
  const navigate = useNavigate();

  const fallbackImages = {
    'Technology': technologyImg,
    'Health & Medical Science': healthMedicalScienceImg,
    'Education': educationImg,
    'Engineering': engineeringImg,
    'Arts, Media, & Communication': artsMediaCommunicationImg,
    'Social Sciences': socialSciencesImg,
    'Hospitality & Tourism': hospitalityTourismImg,
    'Business & Management': businessManagementImg,
  };

  const getIcon = (categoryName) => {
    const iconMap = {
      'Technology': ComputerDesktopIcon,
      'Health & Medical Science': HeartIcon,
      'Education': AcademicCapIcon,
      'Engineering': WrenchScrewdriverIcon,
      'Arts, Media, & Communication': PaintBrushIcon,
      'Social Sciences': UserGroupIcon,
      'Hospitality & Tourism': BuildingOfficeIcon,
      'Business & Management': ChartBarIcon,
    };
    return iconMap[categoryName] || FolderIcon;
  };

  const getCategoryImageUrl = (category) => {
  if (category.image_url) return category.image_url;
  return fallbackImages[category.name] || null;
};

  useEffect(() => {
    fetchCategories();
    checkUserResults();
  }, []);

  const checkUserResults = async () => {
    try {
      const response = await axios.get('/api/student/dashboard');
      setHasExistingResults(response.data.has_results === true);
    } catch (err) {
      console.error('Error checking user results:', err);
      setHasExistingResults(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories/');
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (category) => {
    setSelectedCategory(category);
  };

  const handleContinue = (category = null) => {
    const cat = category || selectedCategory;
    if (!cat) return;
    setModalCategory(cat);
  };

  const handleStartAssessment = () => {
    setModalCategory(null);
    if (modalCategory) {
      navigate('/personal-assessment', { state: { category: modalCategory } });
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-primary-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BriefcaseIcon className="h-8 w-8 text-primary-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const ModalIcon = modalCategory ? getIcon(modalCategory.name) : null;
  const modalImage = modalCategory ? getCategoryImageUrl(modalCategory) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <AnimatedBackground />
      
      {hasExistingResults && (
        <div className="fixed top-6 left-6 z-20">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 group"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium text-gray-700">Back to Dashboard</span>
          </button>
        </div>
      )}
      
      <div className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-6">
            {hasExistingResults ? "Explore New Paths" : "Find Your True North"}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {hasExistingResults 
              ? "Select a new career category to discover more opportunities and expand your horizons."
              : "Select the career category that aligns with your passions and goals. Each path opens doors to unique opportunities."}
          </p>
        </motion.div>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
            <XCircleIcon className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = getIcon(category.name);
            const isSelected = selectedCategory?.id === category.id;
            const bgImage = getCategoryImageUrl(category);
            
            return (
              <motion.div
                key={category.id}
                custom={index}
                variants={itemVariants}
                layout
                transition={{ layout: { duration: 0.3, type: "spring", stiffness: 400, damping: 30 } }}
                onClick={() => handleSelect(category)}
                className={`
                  relative group cursor-pointer rounded-2xl overflow-hidden
                  transition-shadow duration-300
                  ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                `}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0">
                  {bgImage ? (
                    <img 
                      src={bgImage}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.backgroundColor = '#1e293b';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                  )}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-t"
                    animate={{
                      background: isSelected
                        ? 'linear-gradient(to top, rgba(74,106,59,0.95), rgba(61,90,48,0.9))'
                        : 'linear-gradient(to top, rgba(15,23,42,0.9), rgba(30,41,59,0.85), transparent)'
                    }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <div className="relative p-8 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <motion.div 
                      className="mb-6 p-4 rounded-2xl w-16 h-16 flex items-center justify-center"
                      style={{
                        backgroundColor: isSelected ? '#fff' : 'rgba(255,255,255,0.1)',
                        backdropFilter: isSelected ? 'none' : 'blur(4px)',
                        color: isSelected ? '#4A6A3B' : '#fff',
                      }}
                      animate={{ 
                        scale: isSelected ? 1.1 : 1,
                        boxShadow: isSelected ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <Icon className="w-8 h-8" />
                    </motion.div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                      {category.name}
                    </h3>
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-3">
                      {category.description}
                    </p>
                  </div>

                  <div className="h-12 mt-6">
                    <AnimatePresence mode="wait">
                      {isSelected ? (
                        <motion.button
                          key="continue"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContinue(category);
                          }}
                          className="w-full h-full bg-white text-primary-700 rounded-xl font-semibold 
                                     hover:bg-primary-50 transition-all duration-300 hover:scale-[1.02]
                                     shadow-md flex items-center justify-center gap-2"
                        >
                          <span>Continue</span>
                          <ChevronRightIcon className="w-5 h-5" />
                        </motion.button>
                      ) : (
                        <motion.div
                          key="explore"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center text-sm font-medium text-white/60 group-hover:text-white transition-colors duration-200 h-full"
                        >
                          <span>Explore category</span>
                          <ChevronRightIcon className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-6 right-6"
                      >
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Global Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => handleContinue()}
            disabled={!selectedCategory}
            className={`
              inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold
              transition-all duration-300 transform hover:scale-105
              ${selectedCategory
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg hover:shadow-xl'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <span>Continue</span>
            <ChevronRightIcon className="w-5 h-5 ml-2" />
          </button>
          {!selectedCategory && (
            <p className="mt-3 text-sm text-slate-500">
              Select a category to continue your journey
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Category Detail Modal */}
      <AnimatePresence>
        {modalCategory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalCategory(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              >
                {/* Image area */}
                <div className="relative h-48 bg-slate-800">
                  {modalImage ? (
                    <img src={modalImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-primary-800" />
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Content */}
                <div className="relative px-6 pb-8 -mt-10">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center -mt-10 ring-4 ring-white">
                      {ModalIcon && <ModalIcon className="w-10 h-10 text-primary-600" />}
                    </div>
                  </div>

                  <div className="text-center mt-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      {modalCategory.name}
                    </h2>
                    <p className="text-slate-600 leading-relaxed mb-6">
                      {modalCategory.description}
                    </p>

                    <button
                      onClick={handleStartAssessment}
                      className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3.5 rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <span>Start Assessment</span>
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setModalCategory(null)}
                      className="mt-3 w-full py-2.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
                    >
                      Choose Another
                    </button>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setModalCategory(null)}
                  className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySelection;