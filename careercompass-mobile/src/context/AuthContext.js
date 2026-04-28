// src/context/AuthContext.js – Cleaned: removed verbose auth logs

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { clearSession, refreshBackendConnection, initializeAPI } from '../services/api';

const AuthContext = createContext();
const USER_DATA_KEY = 'user_data';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      await initializeAPI();
      const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);
      if (storedUser) {
        try {
          const response = await api.get('/api/auth/me');
          if (response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            await performLogout();
          }
        } catch (err) {
          if (!err.response) {
            await refreshBackendConnection();
            try {
              const retryResponse = await api.get('/api/auth/me');
              if (retryResponse.data) {
                setUser(retryResponse.data);
                setIsAuthenticated(true);
                return;
              }
            } catch (retryErr) {}
          }
          await performLogout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      await performLogout();
    } finally {
      setLoading(false);
    }
  };

  const performLogout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await clearSession();
    await AsyncStorage.removeItem(USER_DATA_KEY);
  };

  const login = async (username, password) => {
    setError(null);
    try {
      await initializeAPI();
      const response = await api.post('/api/auth/login', {
        username: username.trim(),
        password
      });

      if (response.data.user) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: 'Login failed - no user data' };
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        await refreshBackendConnection();
        try {
          const retryResponse = await api.post('/api/auth/login', {
            username: username.trim(),
            password
          });
          if (retryResponse.data.user) {
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(retryResponse.data.user));
            setUser(retryResponse.data.user);
            setIsAuthenticated(true);
            return { success: true, user: retryResponse.data.user };
          }
        } catch (retryErr) {}
        return { success: false, message: 'Cannot connect to server.' };
      }
      const errorData = err.response?.data;
      if (errorData?.locked) return { success: false, locked: true, message: errorData.msg };
      if (errorData?.msg) return { success: false, message: errorData.msg };
      if (errorData?.failed_attempts) {
        const attemptsLeft = 3 - errorData.failed_attempts;
        return { success: false, message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining.` };
      }
      return { success: false, message: 'Login failed.' };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      await initializeAPI();
      const response = await api.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (err) {
      const message = err.response?.data?.msg || 'Registration failed';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async (navigation) => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {}
    await performLogout();
    if (navigation) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {}
    return null;
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/student/profile', profileData);
      await refreshUser();
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.msg || 'Update failed' };
    }
  };

  const uploadProfilePicture = async (imageAsset) => {
    try {
      if (!imageAsset?.uri) return { success: false, message: 'No image to upload' };
      let mimeType = imageAsset.mimeType || imageAsset.type;
      if (!mimeType || mimeType === 'image') {
        const ext = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        mimeType = mimeMap[ext] || 'image/jpeg';
      }
      const fileName = imageAsset.fileName || `profile_${Date.now()}.${mimeType.split('/')[1]}`;
      const formData = new FormData();
      formData.append('image', { uri: imageAsset.uri, type: mimeType, name: fileName });
      const response = await api.post('/api/student/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      return { success: true, url: response.data.profile_picture_url };
    } catch (err) {
      return { success: false, message: err.response?.data?.msg || 'Upload failed' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, error, isAuthenticated,
      login, register, logout, refreshUser, updateProfile, uploadProfilePicture, checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};