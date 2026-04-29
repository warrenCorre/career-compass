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
  // No scanning needed, just mark as ready
  console.log('[CareerCompass] API initialised, baseURL:', api.defaults.baseURL);
  isInitialized = true;
  return api.defaults.baseURL;
};

// ── Request interceptor ──────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  // Ensure baseURL is set (first request)
  if (!isInitialized) {
    await initializeAPI();
  }

  // Attach stored session cookie (if any)
  const cookie = await AsyncStorage.getItem('session_cookie');
  if (cookie) {
    config.headers.Cookie = cookie;
  }

  config.headers['X-Platform'] = Platform.OS;
  config.headers['X-App'] = 'careercompass-mobile';
  console.log('[CareerCompass] REQ', config.method?.toUpperCase(), config.url, config.data ? JSON.stringify(config.data) : '');
  return config;
}, error => Promise.reject(error));

// ── Response interceptor ─────────────────────────────────────────
api.interceptors.response.use(
  async (response) => {
    console.log('[CareerCompass] RES', response.status, response.config.url);
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      console.log('[CareerCompass] Set-Cookie received. Saving...');
      await AsyncStorage.setItem('session_cookie', sessionCookie);
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      console.log('[CareerCompass] RES ERR', error.response.status, error.config?.url, error.response.data);
      // Session expired – clear stored data
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('session_cookie');
        await AsyncStorage.removeItem('user_data');
      }
    } else {
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