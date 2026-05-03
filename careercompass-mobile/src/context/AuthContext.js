import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { clearSession, initializeAPI, setAccountDeletedHandler, setSessionExpiredHandler } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const USER_DATA_KEY = 'user_data';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [accountDeleted, setAccountDeleted] = useState(false);
  const clearAccountDeleted = useCallback(() => setAccountDeleted(false), []);

  const heartbeatIntervalRef = useRef(null);

  // ── Register global handlers ───────────────────────────────────
  useEffect(() => {
    setAccountDeletedHandler(() => setAccountDeleted(true));

    setSessionExpiredHandler(() => {
      setUser(null);
      setIsAuthenticated(false);
    });

    checkAuth();

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, []);

  // ── Heartbeat ──────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(async () => {
        try {
          await api.post('/api/auth/heartbeat');
        } catch (err) {
          // network / 401 handled by interceptors
        }
      }, 5000);
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  // ── Check authentication on app start / refresh ────────────────
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
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
          } else {
            await performLogout();
          }
        } catch (err) {
          if (err.response) {
            if (err.response.status === 401) {
              await performLogout();
            } else {
              // other server errors – stay with cached data
              const cachedUser = JSON.parse(storedUser);
              setUser(cachedUser);
              setIsAuthenticated(true);
            }
          } else {
            // network error – stay with cached data
            const cachedUser = JSON.parse(storedUser);
            setUser(cachedUser);
            setIsAuthenticated(true);
          }
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

  // ── Updated login: returns full backend message + lock/attempts info ──
  const login = async (username, password) => {
    setError(null);
    try {
      await initializeAPI();
      const response = await api.post('/api/auth/login', {
        username: username.trim(),
        password,
      });

      if (response.data.user) {
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: 'Login failed – no user data' };
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};

      // Default values
      let message = 'Login failed. Please try again.';
      let locked = false;
      let failedAttempts = 0;

      if (status === 403 && data.locked) {
        // Account locked
        message = data.msg || 'Account temporarily locked.';
        locked = true;
      } else if (status === 401) {
        // Invalid credentials with attempts remaining
        message = data.msg || 'Invalid credentials.';
        failedAttempts = data.failed_attempts || 0;
      } else if (data.msg) {
        message = data.msg;
      }

      return { success: false, message, locked, failedAttempts };
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
      let mimeType = imageAsset.mimeType || 'image/jpeg';
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
      login, register, logout, refreshUser, updateProfile, uploadProfilePicture, checkAuth,
      accountDeleted, clearAccountDeleted,
    }}>
      {children}
    </AuthContext.Provider>
  );
};