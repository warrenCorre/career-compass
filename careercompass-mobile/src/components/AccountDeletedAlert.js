import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function AccountDeletedAlert() {
  const { accountDeleted, clearAccountDeleted } = useAuth();
  const navigation = useNavigation();

  // Make the status bar translucent so the overlay covers it on Android
  useEffect(() => {
    if (accountDeleted) {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }
    } else {
      StatusBar.setBarStyle('dark-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#ffffff');
        StatusBar.setTranslucent(false);
      }
    }
  }, [accountDeleted]);

  if (!accountDeleted) return null;

  const handleClose = () => {
    clearAccountDeleted();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={accountDeleted}
      statusBarTranslucent={true}
      onRequestClose={() => {}} // Prevent back button dismissal
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Icon name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={styles.title}>Account No Longer Available</Text>
          <Text style={styles.message}>
            Your account has been deleted or deactivated. You will be redirected to the login screen.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,       // FULL SCREEN coverage
    backgroundColor: 'rgba(0,0,0,0.65)',    // Slightly stronger tint for emphasis
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#4A6A3B',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});