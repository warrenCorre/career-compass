// frontend-web/src/pages/Login.js - FIXED functionality, UI unchanged

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import logo from './logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [lockMessage, setLockMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockMessage('');
    
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        if (result.user?.is_admin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        if (result.locked) {
          setLockMessage(result.message);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-primary-500/30 rounded-full blur-3xl -top-48 -right-48 animate-float"></div>
        <div className="absolute w-[500px] h-[500px] bg-secondary-500/30 rounded-full blur-3xl -bottom-48 -left-48 animate-float-slow"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-6 relative z-10"
      >
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 mb-2"
          >
            <img src={logo} alt="CareerCompass" className="w-full h-full object-contain" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text"><b>CareerCompass</b></h2>
          <p className="text-sm text-gray-400 mt-1">Continue your career journey with CareerCompass</p>
        </div>

        <AnimatePresence>
          {lockMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm"
            >
              <p className="text-yellow-700 font-medium">Account Temporarily Locked</p>
              <p className="text-yellow-600 text-xs mt-1">{lockMessage}</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-3 bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm"
            >
              <p className="text-red-700 font-medium">Unable to Sign In</p>
              <p className="text-red-600 text-xs mt-1">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Enter your username or email address"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all pr-10"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-500"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-xs text-primary-600 hover:text-primary-500 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-2.5 rounded-xl font-semibold hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white/90 text-gray-500">New to CareerCompass?</span>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-primary-300 rounded-xl text-sm font-medium text-primary-700 bg-white/50 hover:bg-primary-50 transition-all"
            >
              Create your account
            </Link>
            <p className="text-xs text-gray-500 mt-3">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-primary-600 hover:text-primary-500">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary-600 hover:text-primary-500">Privacy Policy</a>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;