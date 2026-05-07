// frontend-web/src/context/AuthContext.js - CLEANED: no console logs

import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountDeleted, setAccountDeleted] = useState(false);
  const clearAccountDeleted = useCallback(() => setAccountDeleted(false), []);

  // Track if the user just completed an assessment for the first time in this session.
  // "true" means: brand-new account that just finished their very first assessment.
  // Persisted in sessionStorage so it survives page reloads but is wiped on tab close,
  // logout, or a new login (returning user).
  const [justCompletedAssessment, setJustCompletedAssessment] = useState(
    sessionStorage.getItem('justCompletedAssessment') === 'true'
  );

  const setJustCompletedAssessmentTrue = useCallback(() => {
    sessionStorage.setItem('justCompletedAssessment', 'true');
    setJustCompletedAssessment(true);
  }, []);

  const clearJustCompletedAssessment = useCallback(() => {
    sessionStorage.removeItem('justCompletedAssessment');
    setJustCompletedAssessment(false);
  }, []);

  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
    return () => {
      stopHeartbeat();
    };
  }, [user]);

  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        await axios.post('/api/auth/heartbeat');
      } catch (err) {
        if (err.response?.status === 401) {
          stopHeartbeat();
          setUser(null);
        }
      }
    }, 5000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { 
        username: username.trim(), 
        password 
      });
      const userResponse = await axios.get('/api/auth/me');
      setUser(userResponse.data);
      // Always clear the "just completed" flag on a fresh login.
      // This ensures returning users always see "Welcome back".
      clearJustCompletedAssessment();
      return { success: true, user: userResponse.data };
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        return { 
          success: false, 
          message: `Cannot connect to server at ${axios.defaults.baseURL}. Make sure backend is running.` 
        };
      }
      if (error.response) {
        if (error.response.data.locked) {
          return { 
            success: false, 
            locked: true,
            message: error.response.data.msg || 'Account is locked' 
          };
        }
        return { 
          success: false, 
          message: error.response.data?.msg || 'Login failed' 
        };
      }
      return { 
        success: false, 
        message: 'Login failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      stopHeartbeat();
      await axios.post('/api/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      clearJustCompletedAssessment();   // reset flag on logout → "Welcome back" on next login
    }
  };

  useEffect(() => {
    // ── GLOBAL response interceptor for "Account no longer exists" ──
    const respInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          const msg = error.response.data?.msg || '';
          if (msg === 'Account no longer exists') {
            setAccountDeleted(true);
            stopHeartbeat();
            setUser(null);
            clearJustCompletedAssessment();   // also reset
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(respInterceptor);
      stopHeartbeat();
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      accountDeleted,
      clearAccountDeleted,
      justCompletedAssessment,                // true only for brand-new users right after their first assessment
      setJustCompletedAssessmentTrue,         // called by RealAssessment on successful submit
      clearJustCompletedAssessment,           // called on login / logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};