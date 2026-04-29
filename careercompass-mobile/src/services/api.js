// src/services/api.js – Cleaned: removed verbose network logs, kept essential error handling

import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

let cachedBackendIP = null;
let isInitialized = false;
let connectionTestPromise = null;

const BASE_URL_CANDIDATES = [
  "https://career-compass-doyx.onrender.com",
  "http://10.128.149.234:5000",
  "http://172.21.95.234:5000",
  "http://192.168.10.213:5000",
  "http://192.168.10.160:5000",
  "http://192.168.1.14:5000",
  "http://192.168.0.100:5000",
  "http://10.0.0.100:5000",
  "http://172.29.112.1:5000",
  Platform.OS === 'android' ? "http://10.0.2.2:5000" : "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://192.168.1.11:5000",
];

const getLocalIP = async () => {
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '0.0.0.0' && ip !== '127.0.0.1' && ip !== '::1') {
      return ip;
    }
  } catch (err) {
    // ignore
  }
  return null;
};

const getExpoHostIP = () => {
  try {
    const manifest = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (manifest) {
      const ipMatch = manifest.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) return ipMatch[0];
    }
  } catch (e) {}
  return null;
};

const testURL = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${url}/api/categories/`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 
        'Content-Type': 'application/json',
        'X-Platform': Platform.OS,
        'X-App': 'careercompass-mobile',
      },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch { return false; }
};

const findWorkingBackend = async () => {
  if (connectionTestPromise) return connectionTestPromise;
  connectionTestPromise = (async () => {
    const candidates = [...BASE_URL_CANDIDATES];
    const expoIP = getExpoHostIP();
    if (expoIP && !candidates.includes(`http://${expoIP}:5000`)) candidates.unshift(`http://${expoIP}:5000`);
    const localIP = await getLocalIP();
    if (localIP) {
      const parts = localIP.split('.');
      if (parts.length === 4) {
        const prefix = parts.slice(0,3).join('.');
        [1,2,10,14,20,50,100,150,200,213,234,250].forEach(n => {
          const ip = `http://${prefix}.${n}:5000`;
          if (!candidates.includes(ip)) candidates.push(ip);
        });
      }
    }
    const unique = [...new Set(candidates)];
    const firstBatch = unique.slice(0,8);
    const results = await Promise.all(firstBatch.map(async url => ({url, works: await testURL(url)})));
    const working = results.find(r => r.works);
    if (working) return working.url;
    for (const url of unique.slice(8,20)) {
      if (await testURL(url)) return url;
    }
    return BASE_URL_CANDIDATES[0];
  })();
  const result = await connectionTestPromise;
  connectionTestPromise = null;
  return result;
};

const api = axios.create({
  baseURL: BASE_URL_CANDIDATES[0],
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Platform': Platform.OS,
    'X-App': 'careercompass-mobile',
  },
  withCredentials: true,
});

export const initializeAPI = async () => {
  if (isInitialized) return cachedBackendIP;
  const url = await findWorkingBackend();
  api.defaults.baseURL = url;
  cachedBackendIP = url;
  isInitialized = true;
  return url;
};

// Auto failover on network errors
api.interceptors.response.use(res => res, async (error) => {
  const originalRequest = error.config;
  const shouldRetry = !error.response || (error.response && error.response.status >= 500);
  if (shouldRetry && !originalRequest._retry) {
    originalRequest._retry = true;
    isInitialized = false;
    const newURL = await findWorkingBackend();
    api.defaults.baseURL = newURL;
    cachedBackendIP = newURL;
    isInitialized = true;
    return api(originalRequest);
  }
  if (error.response?.status === 401) {
    await AsyncStorage.removeItem('session_cookie');
    await AsyncStorage.removeItem('user_data');
  }
  return Promise.reject(error);
});

// Request interceptor: add cookie
api.interceptors.request.use(async (config) => {
  if (!api.defaults.baseURL || !isInitialized) await initializeAPI();
  const cookie = await AsyncStorage.getItem('session_cookie');
  if (cookie) config.headers.Cookie = cookie;
  config.headers['X-Platform'] = Platform.OS;
  config.headers['X-App'] = 'careercompass-mobile';
  return config;
}, error => Promise.reject(error));

// Response interceptor: store session cookie
api.interceptors.response.use(async (response) => {
  const setCookie = response.headers['set-cookie'];
  if (setCookie) {
    const sessionCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    await AsyncStorage.setItem('session_cookie', sessionCookie);
  }
  return response;
}, async (error) => {
  return Promise.reject(error);
});

export const clearSession = async () => {
  await AsyncStorage.removeItem('session_cookie');
  await AsyncStorage.removeItem('user_data');
};
export const refreshBackendConnection = async () => {
  isInitialized = false;
  connectionTestPromise = null;
  return await initializeAPI();
};
export const getCurrentBackendURL = () => api.defaults.baseURL;

initializeAPI().catch(() => {});
export default api;