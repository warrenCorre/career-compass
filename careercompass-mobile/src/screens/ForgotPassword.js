// src/screens/ForgotPassword.js – Modern alerts replacing Alert.alert
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Animated, Easing, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import ModernAlert from '../components/ModernAlert';

// ---------- focus‑animation wrapper (same as Login) ----------
function AnimatedInputContainer({ icon, children, iconComponent: IconComp }) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderColor, {
      toValue: isFocused ? 1 : 0,
      duration: 230,
      useNativeDriver: false,
    }).start();
  }, [isFocused, borderColor]);

  const animatedBorder = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#4A6A3B'],
  });

  return (
    <Animated.View style={[styles.inputContainer, { borderColor: animatedBorder }]}>
      {IconComp && (
        <IconComp
          name={icon}
          size={20}
          color={isFocused ? '#4A6A3B' : '#9CA3AF'}
          style={styles.inputIcon}
        />
      )}
      <View style={{ flex: 1 }}>
        {React.Children.map(children, (child) =>
          child
            ? React.cloneElement(child, {
                onFocus: (e) => {
                  setIsFocused(true);
                  child.props.onFocus?.(e);
                },
                onBlur: (e) => {
                  setIsFocused(false);
                  child.props.onBlur?.(e);
                },
              })
            : null
        )}
      </View>
    </Animated.View>
  );
}

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Modern alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({});

  const showModernAlert = (config) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const hideModernAlert = () => {
    setAlertVisible(false);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600,
        easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!identifier.trim()) {
      setErrorMsg('Please enter your username or email.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', {
        identifier: identifier.trim(),
      });
      const email = res.data?.email || identifier.trim();
      showModernAlert({
        title: 'Code Sent',
        message: 'A 6-digit reset code has been sent to your registered email.',
        icon: 'email-check-outline',
        iconColor: '#4A6A3B',
        buttons: [{
          text: 'OK',
          onPress: () => {
            hideModernAlert();
            navigation.navigate('ResetPassword', { email });
          }
        }],
        onDismiss: hideModernAlert,
      });
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        setErrorMsg('No account found with that username or email.');
      } else {
        setErrorMsg(err.response?.data?.msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AnimatedBackground />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View
            style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.title}>CareerCompass</Text>
            <Text style={styles.subtitle}>Reset your password</Text>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            <AnimatedInputContainer icon="account-outline" iconComponent={Icon}>
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={(t) => {
                  setIdentifier(t);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </AnimatedInputContainer>

            <Text style={styles.helpText}>
              We'll send a 6-digit reset code to your registered email.
            </Text>

            <TouchableOpacity
              style={[styles.button, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.backLink}
            >
              <Icon name="arrow-left" size={16} color="#4A6A3B" />
              <Text style={styles.backText}> Back to login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ModernAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={alertConfig.buttons}
        onDismiss={alertConfig.onDismiss || hideModernAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: { alignItems: 'center', width: '100%', maxWidth: 400, alignSelf: 'center' },
  logo: { width: 72, height: 72, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#4A6A3B', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, width: '100%',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#ef4444' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 14, paddingHorizontal: 16, height: 52,
    borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 12, width: '100%',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  helpText: { fontSize: 12, color: '#9CA3AF', marginBottom: 28, textAlign: 'center', paddingHorizontal: 10 },
  button: {
    backgroundColor: '#4A6A3B', paddingVertical: 16, borderRadius: 30, alignItems: 'center',
    width: '100%', marginBottom: 20,
    shadowColor: '#4A6A3B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  disabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  backLink: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#4A6A3B', fontSize: 14, fontWeight: '500' },
});