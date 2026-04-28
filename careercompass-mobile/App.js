import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar, Platform, View } from 'react-native';
import 'react-native-url-polyfill/auto';

// Enable layout animations on Android
if (Platform.OS === 'android' && require('react-native').UIManager.setLayoutAnimationEnabledExperimental) {
  require('react-native').UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={{ flex: 1 }}>
              <AppNavigator />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}