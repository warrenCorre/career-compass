// App.js
import 'react-native-screens';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// --- Error Boundary to prevent total app crash ---
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    // Optional: re-initialize anything needed
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={this.handleRestart}>
            <Text style={styles.errorButtonText}>Try Again</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

// Enable layout animations on Android
if (Platform.OS === 'android' && require('react-native').UIManager.setLayoutAnimationEnabledExperimental) {
  require('react-native').UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ErrorBoundary>
            <NavigationContainer>
              <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
              <View style={{ flex: 1 }}>
                <AppNavigator />
              </View>
            </NavigationContainer>
          </ErrorBoundary>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#4A6A3B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});