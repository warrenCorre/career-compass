// frontend-web/src/components/AdminLayout.js
// Modernized — refined sidebar, typography, spacing; NO top bar.
// Uses <Outlet /> for nested routes; user card has visible arrow.
// Improved brand area: no green logo background, slightly larger.
// FIX: profile picture now uses full backend URL.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import {
  HomeIcon,
  UserGroupIcon,
  FolderIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../pages/logo.png';

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatBadge = (n) => (n > 99 ? '99+' : String(n));

// ─── Dual-badge component (new users + inactive) ──────────────────────────────
const DualBadge = ({ newCount, inactiveCount, isActive }) => {
  const hasNew = newCount > 0;
  const hasInactive = inactiveCount > 0;
  if (!hasNew && !hasInactive) return null;

  return (
    <div className="flex flex-col items-end gap-0.5 ml-auto">
      <AnimatePresence>
        {hasNew && (
          <motion.span
            key="new"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full
              text-[10px] font-bold leading-none shadow-sm whitespace-nowrap
              ${isActive
                ? 'bg-white/25 text-white border border-white/40'
                : 'bg-emerald-500 text-white'}`}
            title={`${newCount} new registered user${newCount !== 1 ? 's' : ''}`}
          >
            <UserPlusIcon className="w-2.5 h-2.5 shrink-0" />
            {formatBadge(newCount)}
          </motion.span>
        )}
        {hasInactive && (
          <motion.span
            key="inactive"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.06 }}
            className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full
              text-[10px] font-bold leading-none shadow-sm whitespace-nowrap
              ${isActive
                ? 'bg-white/25 text-white border border-white/40'
                : 'bg-amber-400 text-amber-900'}`}
            title={`${inactiveCount} inactive user${inactiveCount !== 1 ? 's' : ''}`}
          >
            <ClockIcon className="w-2.5 h-2.5 shrink-0" />
            {formatBadge(inactiveCount)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Badge legend (shown at bottom of sidebar) ────────────────────────────────
const BadgeLegend = ({ newCount, inactiveCount }) => {
  if (newCount === 0 && inactiveCount === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mb-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2"
    >
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Alerts</p>
      {newCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full
                           bg-emerald-500 text-white text-[10px] font-bold shrink-0">
            <UserPlusIcon className="w-2.5 h-2.5" />
            {formatBadge(newCount)}
          </span>
          <span className="text-xs text-gray-500">New {newCount === 1 ? 'user' : 'users'} registered</span>
        </div>
      )}
      {inactiveCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full
                           bg-amber-400 text-amber-900 text-[10px] font-bold shrink-0">
            <ClockIcon className="w-2.5 h-2.5" />
            {formatBadge(inactiveCount)}
          </span>
          <span className="text-xs text-gray-500">{inactiveCount === 1 ? 'User' : 'Users'} inactive</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Individual navigation item ───────────────────────────────────────────────
const NavItem = ({ item, isActive, newCount = 0, inactiveCount = 0 }) => {
  const Icon = item.icon;
  const hasBadge = newCount > 0 || inactiveCount > 0;

  return (
    <Link
      to={item.path}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5
        transition-all duration-200
        ${isActive
          ? 'bg-gradient-to-r from-primary-500 to-emerald-500 text-white shadow-md shadow-primary-200/50'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      {/* Active left accent */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white/50 rounded-r-full" />
      )}

      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors
        ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary-500'}`}
      />

      <div className={`flex-1 min-w-0 ${hasBadge ? 'pr-2' : ''}`}>
        <span className={`text-sm font-medium block leading-tight ${isActive ? 'text-white' : ''}`}>
          {item.label}
        </span>
        <span className={`text-[11px] leading-tight block truncate
          ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
          {item.description}
        </span>
      </div>

      {hasBadge ? (
        <DualBadge newCount={newCount} inactiveCount={inactiveCount} isActive={isActive} />
      ) : isActive ? (
        <ChevronRightIcon className="w-3.5 h-3.5 text-white/60 shrink-0" />
      ) : null}
    </Link>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);

  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const pollingRef = useRef(null);

  const LAST_VISIT_KEY = 'careercompass_admin_last_visit';

  const getLastVisit = useCallback(() => {
    const v = localStorage.getItem(LAST_VISIT_KEY);
    return v ? new Date(v) : null;
  }, []);

  const saveCurrentVisit = useCallback(() => {
    localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      let lastVisit = getLastVisit();
      if (!lastVisit) {
        lastVisit = new Date();
        localStorage.setItem(LAST_VISIT_KEY, lastVisit.toISOString());
      }
      const [newRes, inactiveRes] = await Promise.all([
        axios.get('/api/admin/users/new-count', { params: { since: lastVisit.toISOString() } }),
        axios.get('/api/admin/users/inactive-count'),
      ]);
      setNewUsersCount(newRes.data.new_count ?? 0);
      setInactiveCount(inactiveRes.data.inactive_count ?? 0);
    } catch (err) {
      console.error('AdminLayout: error fetching counts', err);
    }
  }, [getLastVisit]);

  const fetchProfilePicture = useCallback(async () => {
    try {
      const res = await axios.get('/api/student/profile');
      const pic = res.data.profile_picture || null;
      // FIX: construct full URL if pic is relative
      if (pic && pic.startsWith('/')) {
        const base = process.env.REACT_APP_API_URL || 'https://career-compass-production-5a2e.up.railway.app';
        setProfilePicture(`${base}${pic}`);
      } else {
        setProfilePicture(pic);
      }
    } catch (err) {
      setProfilePicture(null);
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin/users') {
      saveCurrentVisit();
      setNewUsersCount(0);
    }
  }, [location.pathname, saveCurrentVisit]);

  useEffect(() => {
    fetchCounts();
    fetchProfilePicture();
    pollingRef.current = setInterval(fetchCounts, 15_000);
    return () => clearInterval(pollingRef.current);
  }, [fetchCounts, fetchProfilePicture]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '';
    return ((user.first_name?.[0] ?? '') + (user.last_name?.[0] ?? '')).toUpperCase();
  };

  const totalNotifications = newUsersCount + inactiveCount;
  const SIDEBAR_W = 260;

  const menuItems = [
    { path: '/admin', icon: HomeIcon, label: 'Dashboard', description: 'Overview & metrics' },
    {
      path: '/admin/users', icon: UserGroupIcon, label: 'Users', description: 'Manage accounts',
      newCount: newUsersCount, inactiveCount,
    },
    { path: '/admin/categories', icon: FolderIcon, label: 'Categories', description: 'Career categories' },
    { path: '/admin/courses', icon: AcademicCapIcon, label: 'Courses', description: 'Programs offered' },
    { path: '/admin/reports', icon: ChartBarIcon, label: 'Reports', description: 'Analytics & insights' },
    { path: '/admin/api-config', icon: Cog6ToothIcon, label: 'API Settings', description: 'Integration config' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg
                     border border-gray-200/80 hover:shadow-xl transition-all duration-200"
        >
          {sidebarOpen
            ? <XMarkIcon className="w-5 h-5 text-gray-600" />
            : <Bars3Icon className="w-5 h-5 text-gray-600" />}
          {!sidebarOpen && totalNotifications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1
                             rounded-full bg-red-500 border-2 border-white
                             flex items-center justify-center text-[9px] font-bold text-white leading-none">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </button>
      )}

      {/* ── Mobile backdrop ── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-50 flex flex-col
          bg-white border-r border-gray-100/80
          shadow-[4px_0_24px_rgba(0,0,0,0.04)]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ width: SIDEBAR_W }}
      >
        {/* ── Brand ── */}
        <div className="px-5 pt-6 pb-5 shrink-0">
          <Link to="/admin" className="flex items-center gap-3.5 group">
            <div className="relative shrink-0">
              <img
                src={logo}
                alt="CareerCompass"
                className="h-10 w-10 object-contain drop-shadow-sm"
              />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-base text-gray-900 leading-tight tracking-tight">
                Admin Panel
              </p>
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                CareerCompass
              </p>
            </div>
          </Link>
        </div>

        {/* ── User card (clickable) with profile picture and always-visible arrow ── */}
        {user && (
          <Link
            to="/admin/profile"
            className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-primary-50 to-emerald-50 border border-primary-100/60 shrink-0
                       hover:shadow-md hover:scale-[1.01] transition-all duration-200 group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-400
                              flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0 overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[13px] text-gray-800 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[11px] text-primary-600 flex items-center gap-1">
                  <ShieldCheckIcon className="w-3 h-3" />
                  Administrator
                </p>
              </div>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-primary-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        )}

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
          {menuItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              newCount={item.newCount}
              inactiveCount={item.inactiveCount}
            />
          ))}
        </nav>

        {/* ── Alerts legend ── */}
        <BadgeLegend newCount={newUsersCount} inactiveCount={inactiveCount} />

        {/* ── Bottom ── */}
        <div className="shrink-0 px-3 pb-5">
          <div className="h-px bg-gray-100 mb-3" />
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-xl
                       text-red-500 hover:bg-red-50 transition-all duration-200 group"
          >
            <ArrowRightOnRectangleIcon className="w-[18px] h-[18px] shrink-0 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Sign out</span>
          </button>
          <p className="text-[11px] text-gray-300 text-center mt-3">© 2026 CareerCompass</p>
        </div>
      </aside>

      {/* ── Main content ── (no top bar) */}
      <main
        className="transition-all duration-300 ease-in-out min-h-screen"
        style={{ marginLeft: !isMobile && sidebarOpen ? SIDEBAR_W : 0 }}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;