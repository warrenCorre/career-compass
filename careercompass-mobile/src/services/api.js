import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTION_BACKEND = 'https://career-compass-production-5a2e.up.railway.app';

const api = axios.create({
  baseURL: PRODUCTION_BACKEND,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Platform': Platform.OS,
    'X-App': 'careercompass-mobile',
  },
  withCredentials: true,
});

let isInitialized = false;

export const initializeAPI = async () => {
  console.log('[CareerCompass] API initialised, baseURL:', api.defaults.baseURL);
  isInitialized = true;
  return api.defaults.baseURL;
};

// ── Request interceptor ──────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  if (!isInitialized) {
    await initializeAPI();
  }

  const cookie = await AsyncStorage.getItem('session_cookie');
  if (cookie) {
    config.headers.Cookie = cookie;
  }

  config.headers['X-Platform'] = Platform.OS;
  config.headers['X-App'] = 'careercompass-mobile';
  console.log('[CareerCompass] REQ', config.method?.toUpperCase(), config.url);
  return config;
}, error => Promise.reject(error));

// ── Global callback for account deletion ─────────────────────────
let accountDeletedHandler = null;
export const setAccountDeletedHandler = (handler) => {
  accountDeletedHandler = handler;
};

// ── Global callback for session expiration ──────────────────────
let sessionExpiredHandler = null;
export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

// ── List of endpoints where 401 is *expected* (e.g. invalid credentials) ──
const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/verify-reset-code',
  '/api/auth/reset-password',
  '/api/auth/check-username',
];

// ── Response interceptor ─────────────────────────────────────────
api.interceptors.response.use(
  async (response) => {
    console.log('[CareerCompass] RES', response.status, response.config.url);
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      await AsyncStorage.setItem('session_cookie', sessionCookie);
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, config, data } = error.response;
      console.log('[CareerCompass] RES ERR', status, config?.url, data);

      // ── Only treat 401 as session expiry for non‑auth endpoints ──
      if (status === 401) {
        const isAuthEndpoint = AUTH_ENDPOINTS.some(
          (endpoint) => config?.url?.includes(endpoint)
        );

        if (data?.msg === 'Account no longer exists') {
          // Account deleted by admin
          await AsyncStorage.removeItem('session_cookie');
          await AsyncStorage.removeItem('user_data');
          if (accountDeletedHandler) {
            accountDeletedHandler();
          }
          return Promise.resolve({ data: { accountDeleted: true }, status: 200 });
        }

        if (!isAuthEndpoint) {
          // Session expired (generic 401 on protected routes)
          await AsyncStorage.removeItem('session_cookie');
          await AsyncStorage.removeItem('user_data');
          if (sessionExpiredHandler) {
            sessionExpiredHandler();
          }
          return Promise.resolve({ data: { sessionExpired: true }, status: 401 });
        }

        // For auth endpoints (login, register, etc.) let the 401 pass through
        // so the callers can display the exact error message.
      }
    } else {
      // ⚠️ Network error – do NOT clear stored session
      console.log('[CareerCompass] NETWORK ERR', error.message);
    }

    return Promise.reject(error);
  }
);

export const clearSession = async () => {
  await AsyncStorage.removeItem('session_cookie');
  await AsyncStorage.removeItem('user_data');
};

export default api;