// frontend-web/src/components/LoadingSpinner.js

import React from 'react';
import { motion } from 'framer-motion';
import logo from '../pages/logo.png';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-200 border-t-primary-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={logo} 
            alt="CareerCompass" 
            className="h-12 w-12 animate-pulse object-contain"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingSpinner;