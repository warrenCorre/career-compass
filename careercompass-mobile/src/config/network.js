// src/config/network.js - Auto-detect backend IP

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

// Try to get local IP from Expo manifest
const getExpoHost = () => {
  const manifest = Constants.expoConfig?.hostUri || Constants.manifest?.hostUri;
  if (manifest) {
    // hostUri format: "192.168.1.100:19000"
    const ipMatch = manifest.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (ipMatch) {
      return ipMatch[0];
    }
  }
  return null;
};

// Try to get local IP using expo-network
const getLocalIP = async () => {
  try {
    const ip = await Network.getIpAddressAsync();
    if (ip && ip !== '0.0.0.0' && ip !== '127.0.0.1') {
      // Get the network prefix (first three octets)
      const parts = ip.split('.');
      parts.pop(); // Remove last octet
      const networkPrefix = parts.join('.');
      return { ip, networkPrefix };
    }
  } catch (err) {
    console.log('Error getting local IP:', err);
  }
  return { ip: null, networkPrefix: null };
};

// Common network prefixes to scan
const getPotentialBackendIPs = (currentIP, networkPrefix) => {
  const candidates = [];
  
  // Add Expo host if available
  const expoHost = getExpoHost();
  if (expoHost) candidates.push(expoHost);
  
  // Add current IP (maybe backend is on same device)
  if (currentIP && currentIP !== '0.0.0.0') candidates.push(currentIP);
  
  // Add common backend IPs based on network prefix
  if (networkPrefix) {
    // Try common static IPs on the network
    for (let i = 1; i <= 255; i++) {
      // Only add a few common ones, not all 255
      if (i === 10 || i === 20 || i === 50 || i === 100 || i === 150 || i === 200 || i === 250) {
        candidates.push(`${networkPrefix}.${i}`);
      }
    }
  }
  
  // Remove duplicates
  return [...new Set(candidates)];
};

// Try to find working backend IP
export const findBackendIP = async () => {
  const { ip: localIP, networkPrefix } = await getLocalIP();
  const candidates = getPotentialBackendIPs(localIP, networkPrefix);
  
  // Add default fallbacks
  candidates.push('10.0.2.2'); // Android emulator
  candidates.push('localhost');
  candidates.push('127.0.0.1');
  candidates.push('192.168.1.14'); // Common router IP
  candidates.push('192.168.0.100');
  candidates.push('10.0.0.100');
  
  console.log('🔍 Testing backend IP candidates:', candidates);
  
  for (const ip of candidates) {
    if (await testBackendConnection(ip)) {
      console.log('✅ Found working backend at:', ip);
      return ip;
    }
  }
  
  console.log('❌ No working backend found, using fallback');
  return '192.168.1.14'; // Return last known good IP
};

const testBackendConnection = async (ip) => {
  if (!ip || ip === 'localhost' || ip === '127.0.0.1') {
    // For localhost, use appropriate format for platform
    if (Platform.OS === 'android') {
      ip = '10.0.2.2';
    } else if (Platform.OS === 'ios') {
      ip = 'localhost';
    }
  }
  
  const url = `http://${ip}:5000/api/categories/`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 200;
  } catch (err) {
    return false;
  }
};

// Store the discovered IP
let cachedIP = null;

export const getBackendURL = async () => {
  if (cachedIP) {
    return `http://${cachedIP}:5000`;
  }
  
  const ip = await findBackendIP();
  cachedIP = ip;
  return `http://${ip}:5000`;
};

export const resetBackendCache = () => {
  cachedIP = null;
};