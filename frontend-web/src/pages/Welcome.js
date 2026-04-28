// frontend-web/src/pages/Welcome.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from './logo.png';
import AnimatedBackground from '../components/AnimatedBackground';

const Welcome = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/categories');
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <img 
              src={logo} 
              alt="CareerCompass" 
              className="w-32 h-32 mx-auto object-contain"
            />
          </motion.div>

          <motion.h1
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-5xl md:text-7xl font-bold gradient-text mb-6"
          >
            <b>CareerCompass</b>
          </motion.h1>

          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-gray-400 mb-12 max-w-lg mx-auto"
          >
            Discover your perfect career path with our Smart Guidance
          </motion.p>

          <motion.button
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="btn-primary text-xl px-12 py-4 rounded-full shadow-2xl"
          >
            Tap to Start
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};

export default Welcome;