// frontend-web/src/pages/Profile.js - Same layout as Edit Profile but display-only
// FIX: profile picture URL fixed

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  PencilIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  AtSymbolIcon,
  ArrowLeftIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import AnimatedBackground from '../components/AnimatedBackground';

const backendUrl = process.env.REACT_APP_API_URL || 'https://career-compass-production-5a2e.up.railway.app';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const profileRes = await axios.get('/api/student/profile');
      setProfile(profileRes.data);
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!profile) return '';
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getProfileImageUrl = () => {
    if (!profile?.profile_picture) return null;
    let pic = profile.profile_picture;
    // FIX: construct full URL for relative paths
    if (pic.startsWith('/')) {
      return `${backendUrl}${pic}`;
    }
    return pic;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">{error}</p>
          <button 
            onClick={fetchProfileData}
            className="mt-4 btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const profileImageUrl = getProfileImageUrl();

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="h-24 bg-gradient-to-r from-primary-500 to-secondary-500 relative">
              <div className="absolute inset-0 bg-black/5"></div>
            </div>
            
            <div className="relative px-8 pb-10">
              <div className="flex justify-center">
                <div className="absolute -top-12">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl">
                    {profileImageUrl ? (
                      <img 
                        src={profileImageUrl}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-16 text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Your personal information</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                        {profile.first_name}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                        {profile.last_name}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AtSymbolIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                      {profile.username}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                      {profile.age} years old
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                      {profile.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <PencilIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Edit Profile
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Profile;