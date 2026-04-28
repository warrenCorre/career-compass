// src/navigation/AppNavigator.js – clean fade-in/fade-out transitions

import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppLoadingScreen from '../components/AppLoadingScreen';
import BottomTabNavigator from './BottomTabNavigator';

// Auth Screens
import Welcome from '../screens/Welcome';
import Login from '../screens/Login';
import Signup from '../screens/Signup';
import ForgotPassword from '../screens/ForgotPassword';
import ResetPassword from '../screens/ResetPassword';
import CategorySelection from '../screens/CategorySelection';

// Assessment Screens
import PersonalAssessment from '../screens/PersonalAssessment';
import RealAssessment from '../screens/RealAssessment';
import Results from '../screens/Results';

// Profile Screen
import Profile from '../screens/Profile';

const Stack = createStackNavigator();

// ─── Modern fade-only transition ──────────────────────────────────────────
// This interpolator creates a simple cross-fade effect:
// the new screen fades in while the old one fades out.
const forFadeTransition = ({ current, next }) => {
  const opacity = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0,
  );

  return {
    cardStyle: {
      opacity,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5],
        extrapolate: 'clamp',
      }),
    },
  };
};

// ─── Clean, fast timing for fade transitions ─────────────────────────────
const transitionSpec = {
  open: {
    animation: 'timing',
    config: {
      duration: 300,
    },
  },
  close: {
    animation: 'timing',
    config: {
      duration: 300,
    },
  },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsReady(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [loading]);

  if (loading || !isReady) {
    return <AppLoadingScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={user ? 'MainTabs' : 'Welcome'}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Modern fade transition (replaces the old scale/float)
        cardStyleInterpolator: forFadeTransition,
        transitionSpec,
      }}
    >
      {/* Auth Screens */}
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />

      {/* Main Bottom Tab Navigator */}
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

      {/* Category Selection */}
      <Stack.Screen name="CategorySelection" component={CategorySelection} />

      {/* Assessment Screens */}
      <Stack.Screen
        name="PersonalAssessment"
        component={PersonalAssessment}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="RealAssessment"
        component={RealAssessment}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Results" component={Results} />

      {/* Profile Screen */}
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}