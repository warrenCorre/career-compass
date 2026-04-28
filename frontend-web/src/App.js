// frontend-web/src/App.js - FIXED: Removed key on Routes to prevent layout remounting

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CategorySelection from './pages/CategorySelection';
import PersonalAssessment from './pages/PersonalAssessment';
import RealAssessment from './pages/RealAssessment';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCategories from './pages/admin/ManageCategories';
import ManageCourses from './pages/admin/ManageCourses';
import ApiConfig from './pages/admin/ApiConfig';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/AdminProfile';
import AdminEditProfile from './pages/admin/AdminEditProfile';

import Sidebar from './components/Sidebar';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// AuthenticatedLayout with support for hideSidebar prop
const AuthenticatedLayout = ({ children, hideSidebar = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  const noSidebarPages = [
    '/welcome',
    '/categories',
    '/personal-assessment',
    '/real-assessment',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
  ];

  const shouldHideSidebar = hideSidebar || noSidebarPages.includes(location.pathname);
  const showSidebar = user && !shouldHideSidebar;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      {showSidebar && <Sidebar />}
      <main
        className={`
          min-h-screen w-full transition-all duration-300
          ${showSidebar ? 'lg:pl-72' : ''}
          flex items-center justify-center
        `}
      >
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
};

const UserLandingRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [userStatus, setUserStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setUserStatus('no_user');
        setChecking(false);
        return;
      }

      if (user.is_admin) {
        setUserStatus('admin');
        setChecking(false);
        return;
      }

      try {
        const response = await axios.get('/api/student/dashboard');
        setUserStatus(response.data.has_results ? 'has_results' : 'new_user');
      } catch (err) {
        setUserStatus('new_user');
      } finally {
        setChecking(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (authLoading || checking) return <LoadingSpinner />;
  if (userStatus === 'no_user') return <Navigate to="/login" replace />;
  if (userStatus === 'admin') return <Navigate to="/admin" replace />;
  if (userStatus === 'has_results') return <Navigate to="/dashboard" replace />;
  return children;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Auth Routes - accessible to everyone */}
        <Route
          path="/login"
          element={
            <AuthenticatedLayout hideSidebar={true}>
              <PageTransition><Login /></PageTransition>
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthenticatedLayout hideSidebar={true}>
              <PageTransition><Signup /></PageTransition>
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthenticatedLayout hideSidebar={true}>
              <PageTransition><ForgotPassword /></PageTransition>
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthenticatedLayout hideSidebar={true}>
              <PageTransition><ResetPassword /></PageTransition>
            </AuthenticatedLayout>
          }
        />

        {/* Landing Routes - user only */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserLandingRoute>
                <AuthenticatedLayout hideSidebar={true}>
                  <PageTransition><Welcome /></PageTransition>
                </AuthenticatedLayout>
              </UserLandingRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <UserLandingRoute>
                <AuthenticatedLayout hideSidebar={true}>
                  <PageTransition><Welcome /></PageTransition>
                </AuthenticatedLayout>
              </UserLandingRoute>
            </ProtectedRoute>
          }
        />

        {/* Assessment Routes - user only */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout hideSidebar={true}>
                <PageTransition><CategorySelection /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-assessment"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout hideSidebar={true}>
                <PageTransition><PersonalAssessment /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/real-assessment"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout hideSidebar={true}>
                <PageTransition><RealAssessment /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Results Route */}
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsWrapper />
            </ProtectedRoute>
          }
        />

        {/* User Panel Routes - user only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><Dashboard /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><Profile /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><EditProfile /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Panel Routes - Single AdminLayout with nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PageTransition><AdminDashboard /></PageTransition>} />
          <Route path="users" element={<PageTransition><ManageUsers /></PageTransition>} />
          <Route path="categories" element={<PageTransition><ManageCategories /></PageTransition>} />
          <Route path="courses" element={<PageTransition><ManageCourses /></PageTransition>} />
          <Route path="api-config" element={<PageTransition><ApiConfig /></PageTransition>} />
          <Route path="reports" element={<PageTransition><Reports /></PageTransition>} />
          <Route path="profile" element={<PageTransition><AdminProfile /></PageTransition>} />
          <Route path="profile/edit" element={<PageTransition><AdminEditProfile /></PageTransition>} />
        </Route>

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={
            user?.is_admin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Results wrapper component to determine if sidebar should be hidden
const ResultsWrapper = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (user?.is_admin) {
    return <Navigate to="/admin" replace />;
  }

  const isFirstTime = location.state?.isFirstTime === true;

  return (
    <AuthenticatedLayout hideSidebar={isFirstTime}>
      <PageTransition>
        <Results />
      </PageTransition>
    </AuthenticatedLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;