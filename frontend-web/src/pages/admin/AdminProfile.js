// frontend-web/src/pages/admin/AdminProfile.js
// FIX: profile picture URL now constructed correctly.

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
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminProfile = () => {
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
      console.error(err);
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
      const base = process.env.REACT_APP_API_URL || 'https://career-compass-production-5a2e.up.railway.app';
      return `${base}${pic}`;
    }
    return pic;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 text-xl">{error}</p>
          <button 
            onClick={fetchProfileData}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Header Gradient */}
        <div className="h-20 bg-gradient-to-r from-primary-500 to-emerald-500" />

        {/* Content */}
        <div className="relative px-8 pb-8">
          {/* Avatar */}
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
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{getInitials()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mt-16 text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Administrator account</p>
          </div>

          {/* Display Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800">{profile.first_name}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-800">{profile.last_name}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <AtSymbolIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">@{profile.username}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">{profile.age} years old</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-800">{profile.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
              <div className="flex items-center gap-2 p-2.5 bg-primary-50 rounded-xl border border-primary-100">
                <ShieldCheckIcon className="h-4 w-4 text-primary-500 shrink-0" />
                <span className="text-sm text-primary-700 font-medium">Administrator</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div className="mt-8">
            <button
              onClick={() => navigate('/admin/profile/edit')}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <PencilIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProfile;