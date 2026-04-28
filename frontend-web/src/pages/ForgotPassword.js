// frontend-web/src/pages/ForgotPassword.js

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { EnvelopeIcon, UserIcon } from '@heroicons/react/24/outline';
import logo from './logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await axios.post('/api/auth/forgot-password', { 
        identifier: identifier.trim() 
      });
      
      setMessage('Reset code sent! Redirecting...');
      
      setTimeout(() => {
        navigate('/reset-password', { state: { email: identifier.trim() } });
      }, 1500);
      
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.msg || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of JSX unchanged (same layout as before)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative">
      {/* Animated background circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-primary-500/30 rounded-full blur-3xl -top-48 -right-48 animate-float"></div>
        <div className="absolute w-[500px] h-[500px] bg-secondary-500/30 rounded-full blur-3xl -bottom-48 -left-48 animate-float-slow"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/70 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl p-8 relative z-10"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-24 w-24 mb-4"
          >
            <img src={logo} alt="CareerCompass" className="w-full h-full object-contain" />
          </motion.div>
          <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            CareerCompass
          </h2>
          <p className="mt-2 text-sm text-gray-600">Reset your password</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border-l-4 border-green-400 p-4 rounded"
          >
            <p className="text-sm text-green-700">{message}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-400 p-4 rounded"
          >
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
              Username or Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {identifier.includes('@') ? (
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your username or email"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your username or email address. We'll send a 6‑digit reset code to your registered email.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier.trim()}
            className="w-full bg-primary-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none relative overflow-hidden group"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              'Continue'
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </form>

        <div className="text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
          <p>We'll never share your information with anyone else.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;