// frontend-web/src/components/admin/StatCard.js
import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, title, value, color, onClick, trend, trendValue, link }) => {
  const handleClick = () => {
    if (onClick) onClick();
    if (link && !onClick) window.location.href = link;
  };

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold text-gray-800">{value}</span>
          {trend && trendValue && (
            <div className={`flex items-center text-xs ${trendColors[trend]} mt-1 justify-end`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
      <h3 className="text-gray-600 font-medium">{title}</h3>
      {(link || onClick) && (
        <p className="text-xs text-primary-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view →
        </p>
      )}
    </motion.div>
  );
};

export default StatCard;