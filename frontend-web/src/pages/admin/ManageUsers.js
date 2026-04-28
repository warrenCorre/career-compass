// frontend-web/src/pages/admin/ManageUsers.js - ALL USERS TAB SHOWS EVERYONE (inactive at bottom)

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  ChevronUpDownIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  CalendarIcon,
  AtSymbolIcon,
  UserIcon,
  ClockIcon,
  UsersIcon,
  BellAlertIcon,
  ArrowDownIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import ConfirmModal from '../../components/admin/ConfirmModal';
import LoadingSpinner from '../../components/LoadingSpinner';

// ─── UTC-safe activity helpers ────────────────────────────────────────────────
const toUtcDate = (str) => {
  if (!str) return null;
  if (!str.endsWith('Z') && !str.includes('+')) return new Date(str + 'Z');
  return new Date(str);
};

const daysSinceActivity = (user) => {
  const dt = toUtcDate(user?.last_activity);
  if (!dt) return Infinity;
  return Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
};

const getActivityStage = (user) => {
  const days = daysSinceActivity(user);
  if (days < 7) return 'active';
  if (days < 30) return 'not_active';
  return 'inactive';
};

const inactivityLabel = (days) => {
  if (days === Infinity) return 'Never active';
  if (days < 1) return 'Today';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

const isAdminAccount = (u) =>
  u.username === 'admin' ||
  u.username === 'admin_carcom' ||
  (u.is_admin === true && u.username?.toLowerCase().includes('admin'));

const stripAdmins = (list) => (list || []).filter((u) => !isAdminAccount(u));

// ─── Component ────────────────────────────────────────────────────────────────
const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activeTab, setActiveTab] = useState('all');
  const [inactiveStage, setInactiveStage] = useState('all');
  
  const [users,             setUsers]           = useState([]);
  const [loading,           setLoading]         = useState(true);
  const [refreshing,        setRefreshing]      = useState(false);
  const [error,             setError]           = useState('');
  const [success,           setSuccess]         = useState('');
  const [searchTerm,        setSearchTerm]      = useState(searchParams.get('search') || '');
  const [sortBy,            setSortBy]          = useState('created_at');
  const [sortOrder,         setSortOrder]       = useState('desc');
  const [showViewModal,     setShowViewModal]   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser,      setSelectedUser]    = useState(null);
  const [currentPage,       setCurrentPage]     = useState(1);
  const [totalPages,        setTotalPages]      = useState(1);
  const [totalUsers,        setTotalUsers]      = useState(0);
  const [currentTime,       setCurrentTime]     = useState(new Date());

  const [userCounts, setUserCounts] = useState({
    total: 0, active: 0, not_active_7d: 0, inactive_30d: 0
  });
  const [inactiveBadgeCount, setInactiveBadgeCount] = useState(0);

  const [showEmailModal,       setShowEmailModal]       = useState(false);
  const [emailPreviewData,     setEmailPreviewData]     = useState(null);
  const [loadingEmailPreview,  setLoadingEmailPreview]  = useState(false);
  const [sendingEmails,        setSendingEmails]        = useState(false);
  const [emailResult,          setEmailResult]          = useState(null);

  const [tick, setTick] = useState(0);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchUsers(true);
    fetchCounts();
    pollingIntervalRef.current = setInterval(() => {
      fetchUsers(true);
      fetchCounts();
    }, 5000);
    return () => clearInterval(pollingIntervalRef.current);
  }, [currentPage, searchTerm, activeTab, inactiveStage, sortBy, sortOrder]);

  const fetchUsers = async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        per_page: 10,
        search: searchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
        tab: activeTab,
      };
      
      if (activeTab === 'inactive') {
        params.inactive_stage = inactiveStage;
      }

      const usersRes = await axios.get('/api/admin/users', { params });

      const cleanMain = stripAdmins(usersRes.data.users);
      setUsers(cleanMain);
      setTotalPages(usersRes.data.pages || 1);
      setTotalUsers(usersRes.data.total || cleanMain.length);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (!silent) setError(err.response?.data?.msg || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const [countsRes, badgeRes] = await Promise.all([
        axios.get('/api/admin/users/counts'),
        axios.get('/api/admin/users/inactive-count'),
      ]);
      setUserCounts(countsRes.data);
      setInactiveBadgeCount(badgeRes.data.inactive_count || 0);
    } catch (err) {
      console.error('Error fetching counts:', err);
    }
  };

  // ── Sorting ──────────────────────────────────────────────────
  const sortedUsers = [...users].sort((a, b) => {
    if (activeTab === 'inactive') {
      // Sort by inactivity (longest first)
      return daysSinceActivity(b) - daysSinceActivity(a);
    }
    // All Users tab: sort by registration date (newest first),
    // then push inactive users to the very bottom
    const aStage = getActivityStage(a);
    const bStage = getActivityStage(b);
    
    // Active users come first, then not_active, then inactive
    const stageOrder = { active: 0, not_active: 1, inactive: 2 };
    const stageDiff = stageOrder[aStage] - stageOrder[bStage];
    if (stageDiff !== 0) return stageDiff;
    
    // Within same stage, sort by registration date (newest first)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const handleRefresh = () => { setRefreshing(true); fetchUsers(false); fetchCounts(); };
  const handleView = (user) => { setSelectedUser(user); setShowViewModal(true); };

  const handleDeleteClick = (user) => {
    if (isAdminAccount(user)) {
      setError('Cannot delete an admin account');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      setError('');
      await axios.delete(`/api/admin/users/${selectedUser.id}`);
      setSuccess('User deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      await fetchUsers(false);
      await fetchCounts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting user. Please try again.');
    }
  };

  const handleOpenEmailModal = async () => {
    setShowEmailModal(true);
    setEmailResult(null);
    setLoadingEmailPreview(true);
    try {
      const response = await axios.get('/api/admin/users/inactive-preview', { params: { days: 30 } });
      setEmailPreviewData(response.data);
    } catch (err) {
      setError('Failed to load inactive users preview');
      setShowEmailModal(false);
    } finally {
      setLoadingEmailPreview(false);
    }
  };

  const handleSendEmails = async () => {
    setSendingEmails(true);
    setEmailResult(null);
    try {
      const response = await axios.post('/api/admin/users/email-inactive', { days: 30, dry_run: false });
      setEmailResult(response.data);
      setSuccess(response.data.msg);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const handleDryRunEmails = async () => {
    setSendingEmails(true);
    setEmailResult(null);
    try {
      const response = await axios.post('/api/admin/users/email-inactive', { days: 30, dry_run: true });
      setEmailResult(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to preview');
    } finally {
      setSendingEmails(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setInactiveStage('all');
  };

  const switchInactiveStage = (stage) => {
    setInactiveStage(stage);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder(prev => (sortBy === field && prev === 'asc') ? 'desc' : 'asc');
  };

  const getInitials = (u) =>
    ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase();

  const getProfileImageUrl = (pic) => {
    if (!pic) return null;
    if (pic.startsWith('/'))
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${pic}`;
    return pic;
  };

  const formatDate = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (s) => {
    if (!s) return 'N/A';
    return new Date(s).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'active':     return { text: 'Active',             bg: 'bg-green-100 text-green-700 border-green-200'   };
      case 'not_active': return { text: 'Not Active (7d+)',   bg: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
      case 'inactive':   return { text: 'Inactive (30d+)',    bg: 'bg-red-100 text-red-700 border-red-200'         };
      default:           return { text: 'Unknown',            bg: 'bg-gray-100 text-gray-700 border-gray-200'      };
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Manage Users
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {format(currentTime, 'EEEE, MMMM d, yyyy • h:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {inactiveBadgeCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <BellAlertIcon className="h-4 w-4 text-amber-600 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                {inactiveBadgeCount} inactive (30d+)
              </span>
            </motion.div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
            <span className="text-xs text-primary-600 font-medium">System Online</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg
                       text-gray-600 hover:bg-gray-50 transition-all text-sm"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleOpenEmailModal}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span>Email Inactive</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Alerts ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border-l-4 border-red-400 p-3 rounded-lg flex">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
            <p className="ml-2 text-sm text-red-700">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-50 border-l-4 border-green-400 p-3 rounded-lg flex">
            <CheckCircleIcon className="h-4 w-4 text-green-400 shrink-0" />
            <p className="ml-2 text-sm text-green-700">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',       value: userCounts.total,          icon: UsersIcon,      iconBg: 'bg-gray-50',    iconColor: 'text-gray-400',    valueColor: 'text-gray-800' },
          { label: 'Active',            value: userCounts.active,         icon: UserGroupIcon,  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500', valueColor: 'text-emerald-600' },
          { label: 'Not Active (7d+)',  value: userCounts.not_active_7d, icon: ClockIcon,      iconBg: 'bg-yellow-50',  iconColor: 'text-yellow-500',  valueColor: 'text-yellow-600' },
          { label: 'Inactive (30d+)',   value: userCounts.inactive_30d,  icon: BellAlertIcon,  iconBg: 'bg-red-50',     iconColor: 'text-red-500',     valueColor: 'text-red-600' },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
              </div>
              <div className={`p-2 ${iconBg} rounded-lg`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-sm">
        <button
          onClick={() => switchTab('all')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          All Users
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
            {userCounts.total}
          </span>
        </button>
        <button
          onClick={() => switchTab('inactive')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'inactive' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          Inactive
          <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
            {userCounts.not_active_7d + userCounts.inactive_30d}
          </span>
        </button>
      </div>

      {/* ── Inactive sub-filter ── */}
      {activeTab === 'inactive' && (
        <div className="flex gap-2">
          <button onClick={() => switchInactiveStage('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              inactiveStage === 'all' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'
            }`}>
            All Inactive ({userCounts.not_active_7d + userCounts.inactive_30d})
          </button>
          <button onClick={() => switchInactiveStage('7d')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              inactiveStage === '7d' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
            }`}>
            Not Active (7d+) ({userCounts.not_active_7d})
          </button>
          <button onClick={() => switchInactiveStage('30d')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              inactiveStage === '30d' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
            }`}>
            Inactive (30d+) ({userCounts.inactive_30d})
          </button>
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search users by name, email, or username..."
          value={searchTerm} onChange={handleSearch}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm shadow-sm" />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'all' && sortedUsers.some(u => getActivityStage(u) !== 'active') && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-100">
            <ArrowDownIcon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 font-medium">
              Active users shown first — inactive users pushed to the bottom
            </p>
          </div>
        )}
        {activeTab === 'inactive' && sortedUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
            <ArrowDownIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Showing {inactiveStage === 'all' ? 'all inactive' : inactiveStage === '7d' ? 'not active (7-29 days)' : 'inactive (30+ days)'} users — sorted by longest inactivity first
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  { label: 'User',     field: 'first_name' },
                  { label: 'Email',    field: 'email' },
                  { label: 'Activity', field: null },
                  { label: 'Role',     field: 'is_admin' },
                  { label: 'Joined',   field: 'created_at' },
                  { label: 'Actions',  field: null },
                ].map(({ label, field }) => (
                  <th key={label}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600
                      ${field ? 'cursor-pointer hover:text-primary-600' : ''}`}
                    onClick={() => field && handleSort(field)}>
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <ChevronUpDownIcon className="h-3 w-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-sm">
                    {activeTab === 'all' ? 'No users found' : 'No inactive users found — everyone is active!'}
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => {
                  if (isAdminAccount(user)) return null;

                  const profileImage = getProfileImageUrl(user.profile_picture);
                  const initials     = getInitials(user);
                  const stage        = getActivityStage(user);
                  const daysAgo      = daysSinceActivity(user);
                  const stageBadge   = getStageBadge(stage);
                  void tick;

                  return (
                    <tr key={user.id}
                      className={`transition-colors ${
                        stage === 'inactive'   ? 'bg-red-50/60 hover:bg-red-50 border-l-2 border-red-400' :
                        stage === 'not_active' ? 'bg-yellow-50/60 hover:bg-yellow-50 border-l-2 border-yellow-400' :
                        'hover:bg-gray-50'
                      }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500">
                              {profileImage ? (
                                <img src={profileImage} alt={user.first_name} className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML =
                                      `<div class="w-full h-full flex items-center justify-center text-white font-semibold text-xs">${initials}</div>`;
                                  }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">{initials}</div>
                              )}
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              stage === 'active' ? 'bg-green-500' : stage === 'not_active' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{user.first_name} {user.last_name}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit border ${stageBadge.bg}`}>
                            {stageBadge.text}
                          </span>
                          {stage !== 'active' && (
                            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-0.5">
                              <ClockIcon className="h-2.5 w-2.5" />{inactivityLabel(daysAgo)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.is_admin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                        }`}>{user.is_admin ? 'Admin' : 'User'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleView(user)}
                            className="p-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors" title="View Details">
                            <EyeIcon className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteClick(user)}
                            className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors" title="Delete">
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          Total: {userCounts.total} users • Active: {userCounts.active} • Not Active (7d+): {userCounts.not_active_7d} • Inactive (30d+): {userCounts.inactive_30d} • Last updated: {format(currentTime, 'h:mm a')}
        </p>
      </div>

      {/* ── View Modal ── */}
      <AnimatePresence>
        {showViewModal && selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-xl max-w-md w-full pointer-events-auto shadow-xl">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1.5 text-primary-500" />User Details</h3>
                    <button onClick={() => setShowViewModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                      <XMarkIcon className="h-4 w-4 text-gray-500" /></button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex justify-center">
                    {(() => {
                      const pi = getProfileImageUrl(selectedUser.profile_picture);
                      const ini = getInitials(selectedUser);
                      const st = getActivityStage(selectedUser);
                      return (
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-secondary-500 shadow-md">
                            {pi ? <img src={pi} alt="" className="w-full h-full object-cover" /> :
                              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{ini}</div>}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            st === 'active' ? 'bg-green-500' : st === 'not_active' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: UserIcon, label: 'Full Name', value: `${selectedUser.first_name} ${selectedUser.last_name}` },
                      { icon: AtSymbolIcon, label: 'Username', value: `@${selectedUser.username}` },
                      { icon: EnvelopeIcon, label: 'Email', value: selectedUser.email },
                      { icon: CalendarIcon, label: 'Joined', value: formatDateTime(selectedUser.created_at) },
                    ].map(({ icon: I, label, value }) => (
                      <div key={label} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <I className="h-4 w-4 text-primary-500 shrink-0" />
                        <div><p className="text-[10px] text-gray-400">{label}</p><p className="text-sm font-medium text-gray-800">{value}</p></div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <ShieldCheckIcon className="h-4 w-4 text-primary-500 shrink-0" />
                      <div><p className="text-[10px] text-gray-400">Role</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.is_admin ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                          {selectedUser.is_admin ? 'Administrator' : 'User'}</span></div>
                    </div>
                    {(() => {
                      const st = getActivityStage(selectedUser);
                      const sb = getStageBadge(st);
                      return (
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${st === 'active' ? 'bg-gray-50' : 'bg-amber-50 border border-amber-200'}`}>
                          <ClockIcon className={`h-4 w-4 shrink-0 ${st === 'active' ? 'text-primary-500' : 'text-amber-500'}`} />
                          <div><p className="text-[10px] text-gray-400">Activity Status</p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sb.bg}`}>{sb.text}</span>
                            {selectedUser.last_activity && <p className="text-[10px] text-gray-400 mt-0.5">Last active: {formatDateTime(selectedUser.last_activity)}</p>}
                            {st !== 'active' && <p className="text-[10px] text-amber-600 font-medium mt-0.5">{inactivityLabel(daysSinceActivity(selectedUser))}</p>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end">
                  <button onClick={() => setShowViewModal(false)}
                    className="px-4 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all">Close</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Email Inactive Modal ── */}
      <AnimatePresence>
        {showEmailModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEmailModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto pointer-events-auto shadow-xl">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800 flex items-center">
                      <PaperAirplaneIcon className="h-5 w-5 mr-2 text-amber-600" />Email Inactive Users</h3>
                    <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                      <XMarkIcon className="h-4 w-4 text-gray-500" /></button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {loadingEmailPreview ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
                      <p className="ml-3 text-sm text-gray-500">Loading inactive users...</p>
                    </div>
                  ) : emailPreviewData ? (
                    <>
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-sm font-medium text-amber-800">Found {emailPreviewData.count} inactive user{emailPreviewData.count !== 1 ? 's' : ''} (inactive for 30+ days)</p>
                        <p className="text-xs text-amber-600 mt-1">These users will receive a "We Miss You" email.</p>
                      </div>
                      {emailPreviewData.users?.length > 0 && (
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {emailPreviewData.users.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                              <div><span className="font-medium text-gray-800">{u.first_name} {u.last_name}</span><span className="text-gray-400 ml-2">@{u.username}</span></div>
                              <span className="text-xs text-gray-400">{u.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {emailResult && (
                        <div className={`p-4 rounded-lg border ${emailResult.failed_count === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                          <p className="text-sm font-medium">{emailResult.dry_run ? 'Dry Run Results:' : 'Results:'}</p>
                          <p className="text-sm mt-1">{emailResult.dry_run ? 'Would have sent' : 'Sent'} {emailResult.sent_count} email{emailResult.sent_count !== 1 ? 's' : ''}{emailResult.failed_count > 0 && ` (${emailResult.failed_count} failed)`}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No data available</p>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                  <button onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all">Close</button>
                  <button onClick={handleDryRunEmails} disabled={sendingEmails || loadingEmailPreview}
                    className="px-4 py-2 rounded-lg border border-amber-500 text-amber-600 text-sm font-medium hover:bg-amber-50 transition-all disabled:opacity-50">
                    {sendingEmails ? 'Running...' : 'Dry Run'}</button>
                  <button onClick={handleSendEmails} disabled={sendingEmails || loadingEmailPreview || (emailPreviewData && emailPreviewData.count === 0)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-all disabled:opacity-50">
                    {sendingEmails ? 'Sending...' : 'Send Emails'}</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteConfirm}
        title="Delete User" type="danger"
        message={`Are you sure you want to delete ${selectedUser?.first_name} ${selectedUser?.last_name}? This action cannot be undone.`}
        confirmText="Delete" cancelText="Cancel" />
    </motion.div>
  );
};

export default ManageUsers;