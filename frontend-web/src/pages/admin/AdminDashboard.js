// frontend-web/src/pages/admin/AdminDashboard.js – Dynamic category chart

import React, { useState, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  FolderIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
  UserPlusIcon,
  StarIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/LoadingSpinner';

// -------------------------------------------------------------------
// Dynamic colour helper – defined colours for known categories,
// fallback palette for any new / custom ones.
// -------------------------------------------------------------------
const getCategoryColor = (categoryName) => {
  const KNOWN = {
    'Technology': '#3B82F6',
    'Health & Medical Science': '#EF4444',
    'Education': '#10B981',
    'Engineering': '#F59E0B',
    'Arts, Media, & Communication': '#8B5CF6',
    'Social Sciences': '#F97316',
    'Hospitality & Tourism': '#EC4899',
    'Business & Management': '#6366F1',
  };
  if (KNOWN[categoryName]) return KNOWN[categoryName];

  const FALLBACK = [
    '#0EA5E9', '#D946EF', '#F43F5E', '#14B8A6', '#84CC16',
    '#EAB308', '#A855F7', '#F97316', '#06B6D4', '#22C55E',
  ];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK[Math.abs(hash) % FALLBACK.length];
};

// -------------------------------------------------------------------
// Enhanced Stat Card (unchanged)
// -------------------------------------------------------------------
const StatCard = memo(({ icon: Icon, title, value, cardColor, link, description, onClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    if (link) navigate(link);
  };

  const cardColors = {
    emerald: 'from-emerald-600 to-emerald-700',
    amber: 'from-amber-600 to-amber-700',
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
  };

  const gradientClass = cardColors[cardColor] || 'from-primary-600 to-primary-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.4, ease: 'easeOut' } }}
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:translate-x-12 transition-transform duration-1000 ease-out"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 group-hover:-translate-x-8 transition-transform duration-1000 ease-out"></div>

      <div className="relative p-5">
        <div className="flex items-start justify-between mb-3">
          <motion.div
            className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl"
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          <div className="text-right">
            <motion.span
              className="text-2xl font-bold text-white drop-shadow-md block"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.span>
          </div>
        </div>
        <h3 className="text-white font-semibold text-sm opacity-95">{title}</h3>
        {description && <p className="text-white/75 text-xs mt-1">{description}</p>}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <ArrowRightIcon className="h-3.5 w-3.5 text-white/70" />
        </div>
      </div>
    </motion.div>
  );
});

StatCard.displayName = 'StatCard';

// -------------------------------------------------------------------
// Custom Tooltip – uses the colour from the active bar cell
// -------------------------------------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.color || '#6B7280';
    return (
      <div className="bg-white rounded-xl shadow-xl p-3 border border-gray-100">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-xs font-semibold text-gray-700">{label}</p>
        </div>
        <p className="text-xl font-bold" style={{ color }}>
          {item.value}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">assessments</p>
      </div>
    );
  }
  return null;
};

// -------------------------------------------------------------------
// Growth Tooltip (unchanged)
// -------------------------------------------------------------------
const GrowthTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-3 border border-gray-100">
        <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600">{item.name}:</span>
            <span className="text-xs font-bold" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// -------------------------------------------------------------------
// Main AdminDashboard component
// -------------------------------------------------------------------
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_users: 0,
    total_categories: 0,
    total_courses: 0,
    total_assessments: 0,
    total_jobs: 0,
    category_distribution: [],
    recent_users: [],
  });
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    fetchUserGrowthData();
  }, []);

  // Trigger chart animation once data is loaded
  useEffect(() => {
    if (!loading && categoryData.length > 0) {
      const timer = setTimeout(() => setAnimateChart(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading, categoryData]);

  // -------------------------------------------------------------------
  // Fetch dashboard stats AND all categories (for dynamic chart)
  // -------------------------------------------------------------------
  const fetchDashboardData = async () => {
    try {
      setError('');
      const [dashboardRes, categoriesRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/categories'),
      ]);

      const dashboardData = dashboardRes.data;
      setStats(dashboardData);

      // Normalise categories list (backend may wrap in `categories` key)
      const rawCategories = categoriesRes.data.categories || categoriesRes.data || [];
      const categoriesList = Array.isArray(rawCategories) ? rawCategories : [];

      // Map from distribution (name -> count)
      const distributionMap = new Map();
      if (dashboardData.category_distribution && Array.isArray(dashboardData.category_distribution)) {
        dashboardData.category_distribution.forEach(item => {
          distributionMap.set(item.name, item.count);
        });
      }

      // Build complete chart data from the **categories list**, filling 0 where missing
      const completeData = categoriesList.map((cat, index) => {
        const name = cat.name || cat.category_name;
        return {
          name,
          assessments: distributionMap.get(name) || 0,
          color: getCategoryColor(name),
        };
      });

      setCategoryData(completeData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.msg || 'Failed to load dashboard data');
      // fallback: even if categories fetch fails we still have distribution,
      // but we'll keep it simple – the chart will just be empty.
      setCategoryData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // -------------------------------------------------------------------
  // Recent activities (unchanged)
  // -------------------------------------------------------------------
  const fetchRecentActivities = async () => {
    try {
      const usersResponse = await axios.get('/api/admin/users', {
        params: { per_page: 5, sort_by: 'created_at', sort_order: 'desc' },
      });
      const recentUsers = usersResponse.data.users || [];

      const activities = recentUsers.map(user => ({
        type: 'user_registered',
        message: `${user.first_name} ${user.last_name} joined CareerCompass`,
        time: formatRelativeTime(user.created_at),
        timestamp: new Date(user.created_at),
      }));

      activities.sort((a, b) => b.timestamp - a.timestamp);
      setRecentActivities(activities.slice(0, 6));
    } catch (err) {
      console.error('Error fetching activities:', err);
      // Try fallback
      try {
        const usersResponse = await axios.get('/api/admin/users', {
          params: { per_page: 5, sort_by: 'created_at', sort_order: 'desc' },
        });
        const recentUsers = usersResponse.data.users || [];
        const fallbackActivities = recentUsers.map(user => ({
          type: 'user_registered',
          message: `${user.first_name} ${user.last_name} joined CareerCompass`,
          time: formatRelativeTime(user.created_at),
          timestamp: new Date(user.created_at),
        }));
        setRecentActivities(fallbackActivities);
      } catch (e) {
        console.error('Error fetching fallback activities:', e);
      }
    }
  };

  // -------------------------------------------------------------------
  // User growth data (unchanged)
  // -------------------------------------------------------------------
  const fetchUserGrowthData = async () => {
    try {
      const response = await axios.get('/api/admin/reports/daily-growth', {
        params: { days: 7 },
      });
      const dailyData = response.data.daily_data || [];
      const formattedData = dailyData.map(day => ({
        date: day.date,
        users: day.users,
        assessments: day.assessments,
      }));
      setUserGrowthData(formattedData);
    } catch (err) {
      console.error('Error fetching growth data:', err);
      if (err.response?.status === 404) {
        console.warn('Daily growth endpoint not found - add /api/admin/reports/daily-growth');
      } else {
        // Don't override existing errors from dashboard fetch
      }
      setUserGrowthData([]);
    }
  };

  // -------------------------------------------------------------------
  // Time formatting helpers
  // -------------------------------------------------------------------
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return format(date, 'MMM dd');
  };

  // -------------------------------------------------------------------
  // Refresh handler
  // -------------------------------------------------------------------
  const handleRefresh = async () => {
    setRefreshing(true);
    setAnimateChart(false);
    await Promise.all([fetchDashboardData(), fetchRecentActivities(), fetchUserGrowthData()]);
    setTimeout(() => setAnimateChart(true), 400);
  };

  const totalAssessments = categoryData.reduce((sum, item) => sum + item.assessments, 0);

  // -------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600 p-6 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              {format(currentTime, 'EEEE, MMMM d, yyyy • h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs text-white font-medium">System Online</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all text-sm border border-white/20"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded-xl"
        >
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UsersIcon}
          title="Total Users"
          value={stats.total_users}
          cardColor="emerald"
          link="/admin/users"
          description="Registered accounts"
        />
        <StatCard
          icon={AcademicCapIcon}
          title="Total Courses"
          value={stats.total_courses}
          cardColor="amber"
          link="/admin/courses"
          description="Academic programs"
        />
        <StatCard
          icon={FolderIcon}
          title="Total Categories"
          value={stats.total_categories}
          cardColor="purple"
          link="/admin/categories"
          description="Career categories"
        />
        <StatCard
          icon={ChartBarIcon}
          title="Assessments"
          value={totalAssessments}
          cardColor="blue"
          link="/admin/reports"
          description="Completed assessments"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Chart – now 100% dynamic */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-primary-500" />
                  Category Distribution
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Assessments by career category</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <SparklesIcon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">{totalAssessments} total</span>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                    angle={-45}
                    textAnchor="end"
                    height={65}
                    interval={0}
                  />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                  <Bar
                    dataKey="assessments"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={animateChart}
                    animationDuration={2000}
                    animationEasing="ease-out"
                    animationBegin={0}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* User Growth & Assessments Chart */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600" />
                  User Growth & Activity
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Daily registrations & assessments (last 7 days)</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="h-[320px]">
              {userGrowthData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No data available for the last 7 days</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} />
                    <Tooltip content={<GrowthTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#3B82F6"
                      fill="#DBEAFE"
                      strokeWidth={2}
                      name="New Users"
                      isAnimationActive={animateChart}
                      animationDuration={2000}
                      animationEasing="ease-out"
                      animationBegin={200}
                    />
                    <Area
                      type="monotone"
                      dataKey="assessments"
                      stroke="#10B981"
                      fill="#D1FAE5"
                      strokeWidth={2}
                      name="Assessments"
                      isAnimationActive={animateChart}
                      animationDuration={2000}
                      animationEasing="ease-out"
                      animationBegin={400}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-500" />
                  Recent Activity
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Latest user registrations</p>
              </div>
              <button
                onClick={fetchRecentActivities}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-[350px] overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <UserPlusIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent activities</p>
              </div>
            ) : (
              recentActivities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.08, duration: 0.5, ease: 'easeOut' }}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserPlusIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          className="bg-gradient-to-br from-primary-600 to-emerald-700 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BoltIcon className="h-5 w-5 text-white/80" />
              <h3 className="text-white font-semibold text-base">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/admin/users')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-white/80" />
                  <span className="text-white text-sm font-medium">Manage Users</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin/courses')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-white/80" />
                  <span className="text-white text-sm font-medium">Manage Courses</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-4 w-4 text-white/80" />
                  <span className="text-white text-sm font-medium">View Reports</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/admin/categories')}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-white/80" />
                  <span className="text-white text-sm font-medium">Manage Categories</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-white/50 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-start gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-white/40 mt-0.5 flex-shrink-0" />
                <p className="text-white/50 text-xs">
                  Regular data review helps track platform growth and identify trends.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="text-center pt-4"
      >
        <p className="text-xs text-gray-400">
          Data reflects current system state • Last updated: {format(currentTime, 'h:mm a')}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;