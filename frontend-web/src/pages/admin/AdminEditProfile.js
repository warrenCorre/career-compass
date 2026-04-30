// frontend-web/src/pages/admin/AdminEditProfile.js
// FIX: profile picture preview now uses full backend URL.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EnvelopeIcon,
  UserIcon,
  CalendarIcon,
  AtSymbolIcon,
  PencilIcon,
  CameraIcon,
  TrashIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminEditProfile = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    age: '',
    email: '',
    profile_picture: null,
    profile_picture_preview: null,
    existing_profile_picture: null
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameTimeout, setUsernameTimeout] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const backendUrl = process.env.REACT_APP_API_URL || 'https://career-compass-production-5a2e.up.railway.app';

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/student/profile');
      const existingImage = res.data.profile_picture || null;
      
      // Construct full URL for existing image
      const existingPreview = existingImage 
        ? (existingImage.startsWith('/') ? `${backendUrl}${existingImage}` : existingImage)
        : null;

      setFormData({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        username: res.data.username || '',
        age: res.data.age || '',
        email: res.data.email || '',
        profile_picture: null,
        profile_picture_preview: existingPreview,
        existing_profile_picture: res.data.profile_picture || null
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username === formData.username) {
      setUsernameAvailable(null);
      return;
    }
    
    setCheckingUsername(true);
    try {
      const response = await axios.post('/api/auth/check-username', { username });
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
      } else {
        setErrors(prev => ({ ...prev, username: null }));
      }
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: value });
    
    if (usernameTimeout) clearTimeout(usernameTimeout);
    
    const timeout = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);
    setUsernameTimeout(timeout);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = 'Required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Required';
    
    if (!formData.username.trim()) {
      newErrors.username = 'Required';
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Only lowercase letters, numbers, and underscores';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username already taken';
    }
    
    if (!formData.age) {
      newErrors.age = 'Required';
    } else {
      const age = parseInt(formData.age);
      if (age < 17) newErrors.age = 'Must be at least 17';
      else if (age > 100) newErrors.age = 'Invalid age';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (showPasswordFields) {
      if (!passwordData.old_password) newErrors.old_password = 'Current password required';
      if (!passwordData.new_password) newErrors.new_password = 'New password required';
      else if (passwordData.new_password.length < 8) newErrors.new_password = 'Must be at least 8 characters';
      if (passwordData.new_password !== passwordData.confirm_password) newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setFormData({
      ...formData,
      profile_picture: file,
      profile_picture_preview: previewUrl
    });
    setMessage({ type: '', text: '' });
  };

  const uploadProfilePicture = async (file) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);
    
    try {
      const response = await axios.post('/api/student/upload-profile-picture', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.profile_picture_url;
    } catch (err) {
      throw new Error('Failed to upload image');
    }
  };

  const removeImage = () => {
    if (formData.profile_picture_preview && !formData.existing_profile_picture) {
      URL.revokeObjectURL(formData.profile_picture_preview);
    }
    setFormData({
      ...formData,
      profile_picture: null,
      profile_picture_preview: null,
      existing_profile_picture: null
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        age: parseInt(formData.age),
        email: formData.email
      };
      
      if (formData.profile_picture instanceof File) {
        setUploadingImage(true);
        const imageUrl = await uploadProfilePicture(formData.profile_picture);
        updateData.profile_picture = imageUrl;
        setUploadingImage(false);
      } else if (formData.existing_profile_picture === null && formData.profile_picture_preview === null) {
        updateData.profile_picture = null;
      }
      
      if (showPasswordFields && passwordData.new_password) {
        updateData.old_password = passwordData.old_password;
        updateData.new_password = passwordData.new_password;
      }
      
      await axios.put('/api/student/profile', updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully! Redirecting...' });
      
      if (formData.profile_picture_preview && !formData.existing_profile_picture) {
        URL.revokeObjectURL(formData.profile_picture_preview);
      }
      
      setTimeout(() => navigate('/admin/profile'), 1500);
    } catch (err) {
      setUploadingImage(false);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Update failed' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.first_name?.[0] || '';
    const last = formData.last_name?.[0] || '';
    return (first + last).toUpperCase();
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => navigate('/admin/profile')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors mb-6 group"
      >
        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">Back to Profile</span>
      </button>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        {/* Header Gradient */}
        <div className="h-20 bg-gradient-to-r from-primary-500 to-emerald-500" />

        {/* Content */}
        <div className="relative px-8 pb-10">
          {/* Avatar with Upload */}
          <div className="flex justify-center">
            <div className="absolute -top-12 group">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl relative">
                {formData.profile_picture_preview ? (
                  <img 
                    src={formData.profile_picture_preview} 
                    alt="Profile preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">{getInitials()}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-600 transition-all"
                >
                  <CameraIcon className="w-3.5 h-3.5" />
                </button>
                {formData.profile_picture_preview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-all"
                  >
                    <TrashIcon className="w-2.5 h-2.5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          
          {/* Title */}
          <div className="mt-16 text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-4 p-3 rounded-xl text-sm flex items-center ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border ${
                      errors.first_name ? 'border-red-300' : 'border-gray-200'
                    } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="First name"
                  />
                </div>
                {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border ${
                      errors.last_name ? 'border-red-300' : 'border-gray-200'
                    } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="Last name"
                  />
                </div>
                {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSymbolIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                    errors.username ? 'border-red-300' : usernameAvailable === true && formData.username !== '' ? 'border-green-300' : 'border-gray-200'
                  } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Username (lowercase letters, numbers, underscores)"
                />
                {checkingUsername && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === true && formData.username !== '' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {!checkingUsername && usernameAvailable === false && formData.username !== '' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <XCircleIcon className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
              {!errors.username && usernameAvailable === true && formData.username !== '' && (
                <p className="mt-1 text-xs text-green-600">Username is available</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="17"
                  max="100"
                  className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border ${
                    errors.age ? 'border-red-300' : 'border-gray-200'
                  } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Age"
                />
              </div>
              {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border ${
                    errors.email ? 'border-red-300' : 'border-gray-200'
                  } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  placeholder="Email address"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Optional Password Change */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                <KeyIcon className="w-4 h-4" />
                <span>{showPasswordFields ? 'Cancel password change' : 'Change password (optional)'}</span>
              </button>
              
              <AnimatePresence>
                {showPasswordFields && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={showOldPassword ? "text" : "password"}
                          name="old_password"
                          value={passwordData.old_password}
                          onChange={handlePasswordChange}
                          className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                            errors.old_password ? 'border-red-300' : 'border-gray-200'
                          } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showOldPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                      {errors.old_password && <p className="mt-1 text-xs text-red-600">{errors.old_password}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                            errors.new_password ? 'border-red-300' : 'border-gray-200'
                          } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                          placeholder="Enter new password (min. 8 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                      {errors.new_password && <p className="mt-1 text-xs text-red-600">{errors.new_password}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <KeyIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border ${
                            errors.confirm_password ? 'border-red-300' : 'border-gray-200'
                          } bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4 text-gray-400" /> : <EyeIcon className="h-4 w-4 text-gray-400" />}
                        </button>
                      </div>
                      {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password}</p>}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Password must be at least 8 characters long
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/admin/profile')}
                className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage || usernameAvailable === false}
                className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving || uploadingImage ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    {uploadingImage ? 'Uploading...' : 'Saving...'}
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminEditProfile;