import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, StatusBar, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function OfflineAlert() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isInternetReachable === null ? true : state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // Optionally handle status bar while offline (but we don't change it here because it's dynamic)
  // No need to force translucency because it's a temporary state.

  if (isConnected) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={!isConnected}
      statusBarTranslucent={true}
      onRequestClose={() => {}} // Prevent accidental dismiss (although this alert should stay until connection returns)
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Icon name="wifi-off" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.message}>
            Please check your connection and try again.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,       // FULL SCREEN coverage
    backgroundColor: 'rgba(0,0,0,0.65)',
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});