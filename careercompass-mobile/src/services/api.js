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

// ── NEW: Global callback for session expiration ──────────────────
let sessionExpiredHandler = null;
export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
};

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
      console.log('[CareerCompass] RES ERR', error.response.status, error.config?.url, error.response.data);
      if (error.response.status === 401) {
        const msg = error.response.data?.msg || '';
        if (msg === 'Account no longer exists') {
          if (accountDeletedHandler) {
            accountDeletedHandler();
          }
          await AsyncStorage.removeItem('session_cookie');
          await AsyncStorage.removeItem('user_data');
          return Promise.resolve({ data: { accountDeleted: true }, status: 200 });
        }

        // 🔥 Session expired (generic 401)
        await AsyncStorage.removeItem('session_cookie');
        await AsyncStorage.removeItem('user_data');
        if (sessionExpiredHandler) {
          sessionExpiredHandler();   // notify AuthContext to log out
        }
        // Return a resolved promise so calling code doesn't crash
        return Promise.resolve({ data: { sessionExpired: true }, status: 401 });
      }
      // For other server errors (500, etc.), we still reject – they'll be handled by the callers
    } else {
      // ⚠️ Network error (no internet) – do NOT clear stored session/user
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