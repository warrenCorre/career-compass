// frontend-web/src/components/Sidebar.js - With Assessment menu item

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import logo from '../pages/logo.png';

import {
  HomeIcon,
  SparklesIcon,
  ChartPieIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronRightIcon,
  ShieldCheckIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarRef.current && !sidebarRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get('/api/student/profile');
      setProfile(response.data);
    } catch (err) {
      // ignore
    }
  };

  const handleAssessmentClick = () => {
    setShowRetakeModal(true);
  };

  const confirmRetake = () => {
    setShowRetakeModal(false);
    navigate('/categories');
  };

  const menuItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard', description: 'Overview & progress' },
    { path: '/results', icon: ChartPieIcon, label: 'Results', description: 'View your matches' },
    { path: null, icon: SparklesIcon, label: 'Assessment', description: 'Take career assessment', onClick: handleAssessmentClick },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '';
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getProfileImage = () => profile?.profile_picture || null;

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-[100] p-2.5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
        >
          {isOpen ? <XMarkIcon className="w-5 h-5 text-gray-600" /> : <Bars3Icon className="w-5 h-5 text-gray-600" />}
        </button>
      )}

      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(isOpen || !isMobile) && (
          <motion.div
            ref={sidebarRef}
            initial={isMobile ? { x: -320 } : false}
            animate={isMobile ? { x: 0 } : false}
            exit={isMobile ? { x: -320 } : false}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed top-0 left-0 h-full bg-gradient-to-b from-white to-gray-50 shadow-2xl z-50 overflow-y-auto ${
              isMobile ? 'w-80' : 'w-72'
            } border-r border-gray-200`}
          >
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
              <Link to="/dashboard" className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-500 rounded-xl blur-md opacity-20"></div>
                  <img src={logo} alt="CareerCompass" className="h-10 w-10 relative z-10 object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">CareerCompass</h1>
                  <p className="text-xs text-gray-500">Navigate Your Future</p>
                </div>
              </Link>
            </div>

            {user && (
              <Link to="/profile" className="block px-6 py-4 border-b border-gray-200 bg-white/50 hover:bg-primary-50/30 transition-all duration-200 group cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getProfileImage() ? (
                      <img src={getProfileImage()} alt="Profile" className="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-primary-100 group-hover:ring-primary-300 transition-all" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                        {getInitials()}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <ShieldCheckIcon className="w-3 h-3 mr-1 text-primary-500" />
                      {user.is_admin ? 'Administrator' : 'Student'}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )}

            <div className="p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">Navigation</p>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = item.path ? location.pathname === item.path : false;
                if (item.onClick) {
                  return (
                    <button key={index} onClick={item.onClick}
                      className="w-full flex items-center px-4 py-2.5 rounded-xl mb-1 transition-all group text-gray-700 hover:bg-primary-50">
                      <Icon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-primary-500 transition-colors" />
                      <div className="flex-1 text-left">
                        <span className="font-medium block text-sm">{item.label}</span>
                        <span className="text-xs text-gray-400">{item.description}</span>
                      </div>
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                }
                return (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-xl mb-1 transition-all group ${
                      isActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'text-gray-700 hover:bg-primary-50'
                    }`}>
                    <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-500'}`} />
                    <div className="flex-1">
                      <span className="font-medium block text-sm">{item.label}</span>
                      <span className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{item.description}</span>
                    </div>
                    {isActive && <ChevronRightIcon className="w-4 h-4 text-white/80" />}
                  </Link>
                );
              })}
            </div>

            {user?.is_admin && (
              <div className="px-4 mt-2">
                <Link to="/admin" className="flex items-center px-4 py-2.5 rounded-xl text-gray-600 hover:bg-primary-50 transition-all group">
                  <ShieldCheckIcon className="w-5 h-5 mr-3 text-gray-500 group-hover:text-primary-500 transition-colors" />
                  <span className="font-medium text-sm">Admin Panel</span>
                </Link>
              </div>
            )}

            <div className="px-4 mt-2">
              <button onClick={handleLogout} className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all group">
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Sign out</span>
              </button>
            </div>

            <div className="px-4 py-4 mt-auto">
              <p className="text-xs text-gray-400 text-center">© 2026 CareerCompass</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRetakeModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRetakeModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl max-w-md w-full pointer-events-auto shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <SparklesIcon className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Want to explore different paths?</h3>
                  <p className="text-gray-600 text-center mb-6">Retake the assessment to discover other programs that might be a better fit for you.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setShowRetakeModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all">Cancel</button>
                    <button onClick={confirmRetake} className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-all hover:shadow-lg">Retake Assessment</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;