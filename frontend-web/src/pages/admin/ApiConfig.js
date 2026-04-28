// frontend-web/src/pages/admin/ApiConfig.js - Enhanced Visuals + Adzuna references (no Jooble)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  CloudIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';

const ApiConfig = () => {
  const [apiMode, setApiMode] = useState('MOCK_MODE');
  const [apiStatus, setApiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfig();
    fetchStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/api-config');
      setApiMode(response.data.api_mode || 'MOCK_MODE');
    } catch (err) {
      console.error('Error fetching config:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Failed to load API configuration' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/admin/api-status');
      setApiStatus(response.data);
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  const handleModeToggle = async (mode) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.post('/api/admin/api-mode', { mode });
      setApiMode(mode);
      setMessage({ 
        type: 'success', 
        text: response.data.msg || `API mode switched to ${mode === 'REALTIME_MODE' ? 'Real-time' : 'Mock'} mode` 
      });
      fetchStatus();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Error switching mode' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          API Configuration
        </h1>
        <p className="text-gray-600 mt-2">Configure API settings for real-time job listings</p>
      </div>

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-xl">
        <div className="flex items-start">
          <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Security Notice</p>
            <p className="text-sm text-blue-700">
              API keys are stored securely on the server and are never exposed to the frontend. 
              To configure API keys, set the following environment variables on your server:
            </p>
            <div className="mt-2 bg-blue-100 rounded-lg p-2 font-mono text-xs text-blue-900">
              ADZUNA_API_KEY=your_key_here<br />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-xl">
            <ArrowPathIcon className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Operation Mode</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleModeToggle('REALTIME_MODE')}
            disabled={saving}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              apiMode === 'REALTIME_MODE'
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-300 hover:bg-white/50'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center mb-3">
              <CloudIcon className={`h-8 w-8 mr-3 ${apiMode === 'REALTIME_MODE' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className={`font-semibold ${apiMode === 'REALTIME_MODE' ? 'text-primary-700' : 'text-gray-600'}`}>
                Real-time Mode
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Fetch live jobs from Adzuna API using server-side API keys
            </p>
            {apiMode === 'REALTIME_MODE' && (
              <div className="mt-3 flex items-center text-green-600 text-sm">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Active
              </div>
            )}
            {apiMode !== 'REALTIME_MODE' && apiStatus?.adzuna_configured === false && (
              <div className="mt-3 flex items-center text-amber-600 text-sm">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                API key not configured
              </div>
            )}
          </button>

          <button
            onClick={() => handleModeToggle('MOCK_MODE')}
            disabled={saving}
            className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
              apiMode === 'MOCK_MODE'
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-gray-200 hover:border-primary-300 hover:bg-white/50'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center mb-3">
              <InformationCircleIcon className={`h-8 w-8 mr-3 ${apiMode === 'MOCK_MODE' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className={`font-semibold ${apiMode === 'MOCK_MODE' ? 'text-primary-700' : 'text-gray-600'}`}>
                Mock Mode
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Use generated mock jobs (no API credentials needed)
            </p>
            {apiMode === 'MOCK_MODE' && (
              <div className="mt-3 flex items-center text-green-600 text-sm">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Active
              </div>
            )}
          </button>
        </div>

        <div className={`p-4 rounded-xl border ${apiMode === 'REALTIME_MODE' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-start">
            <InformationCircleIcon className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${apiMode === 'REALTIME_MODE' ? 'text-blue-500' : 'text-gray-500'}`} />
            <div>
              <p className={`text-sm font-medium ${apiMode === 'REALTIME_MODE' ? 'text-blue-800' : 'text-gray-700'}`}>
                Current Mode: <span className="font-bold">{apiMode === 'REALTIME_MODE' ? 'Real-time' : 'Mock'}</span>
              </p>
              <p className={`text-sm mt-1 ${apiMode === 'REALTIME_MODE' ? 'text-blue-600' : 'text-gray-500'}`}>
                {apiMode === 'REALTIME_MODE' 
                  ? 'Jobs will be fetched live from Adzuna API using securely stored API keys.'
                  : 'Jobs will be generated locally with realistic mock data. No API calls required.'}
              </p>
              {apiMode === 'REALTIME_MODE' && apiStatus?.adzuna_configured === false && (
                <p className="text-sm text-amber-600 mt-2 flex items-center">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Adzuna API key not configured. Set ADZUNA_API_KEY environment variable.
                </p>
              )}
              {apiMode === 'REALTIME_MODE' && apiStatus?.adzuna_configured === true && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Adzuna API key is configured and ready.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mt-6 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <KeyIcon className="h-5 w-5 mr-2 text-primary-500" />
          API Key Management
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            For security reasons, API keys are not stored in the database and are never exposed to the frontend.
            To configure API keys, set the following environment variables on your server:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs">
            <code>ADZUNA_API_KEY=your_adzuna_api_key_here</code><br />
            <code className="mt-1 block">GROQ_API_KEY=your_groq_api_key_here</code>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Changes to environment variables require a server restart to take effect.
              The API mode toggle above can be used to switch between mock and real-time modes without restarting.
            </p>
          </div>
          <div className="mt-2">
            <a 
              href="https://developer.adzuna.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
            >
              <CloudIcon className="h-3 w-3 mr-1" />
              Get a free Adzuna API key →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfig;