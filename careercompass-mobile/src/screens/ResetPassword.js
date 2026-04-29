// src/screens/ResetPassword.js – Modern alerts replacing Alert.alert
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Animated, Easing, StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import ModernAlert from '../components/ModernAlert';

export default function ResetPassword() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const token = route.params?.token || null;
  const emailFromParams = route.params?.email || '';

  const [step, setStep] = useState(token ? 'reset' : 'verify');
  const [email] = useState(emailFromParams);
  const [code, setCode] = useState('');
  const [verifiedToken, setVerifiedToken] = useState(token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const confirmPasswordRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600,
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    if (token) {
      setVerifiedToken(token);
      setStep('reset');
    }

    if (!token && !emailFromParams) {
      navigation.replace('ForgotPassword');
    }
  }, [token, emailFromParams]);

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setErrorMsg('Please enter the 6-digit code.');
      return;
    }
    setErrorMsg('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-reset-code', {
        email,
        code: code.trim(),
      });
      setVerifiedToken(res.data.token);
      setStep('reset');
      setMessage('Code verified! Enter your new password below.');
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      showModernAlert({
        title: 'Error',
        message: 'Passwords do not match',
        icon: 'alert-circle',
        iconColor: '#EF4444',
        buttons: [{ text: 'OK', onPress: hideModernAlert }],
        onDismiss: hideModernAlert,
      });
      return;
    }
    if (newPassword.length < 8) {
      showModernAlert({
        title: 'Error',
        message: 'Password must be at least 8 characters',
        icon: 'alert-circle',
        iconColor: '#EF4444',
        buttons: [{ text: 'OK', onPress: hideModernAlert }],
        onDismiss: hideModernAlert,
      });
      return;
    }
    setErrorMsg('');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        token: verifiedToken,
        newPassword,
      });
      showModernAlert({
        title: 'Success',
        message: 'Password reset successfully!',
        icon: 'check-circle',
        iconColor: '#10B981',
        buttons: [{
          text: 'OK',
          onPress: () => {
            hideModernAlert();
            navigation.navigate('Login');
          }
        }],
        onDismiss: hideModernAlert,
      });
    } catch (err) {
      showModernAlert({
        title: 'Error',
        message: err.response?.data?.msg || 'Reset failed',
        icon: 'alert-circle',
        iconColor: '#EF4444',
        buttons: [{ text: 'OK', onPress: hideModernAlert }],
        onDismiss: hideModernAlert,
      });
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
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>CareerCompass</Text>
            <Text style={styles.subtitle}>
              {step === 'verify' ? 'Verify your code' : 'Create new password'}
            </Text>

            {message ? (
              <View style={styles.successBanner}>
                <Icon name="check-circle-outline" size={16} color="#10b981" />
                <Text style={styles.successBannerText}>{message}</Text>
              </View>
            ) : null}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle-outline" size={16} color="#ef4444" />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {step === 'verify' ? (
              <>
                <View style={styles.emailPill}>
                  <Icon name="email-outline" size={18} color="#9CA3AF" style={styles.emailIcon} />
                  <Text style={styles.emailText} numberOfLines={1}>{email}</Text>
                </View>
                <Text style={styles.helpText}>
                  A 6-digit code was sent to this address.
                </Text>

                <CodeInput
                  value={code}
                  onChange={(t) => {
                    setErrorMsg('');
                    setCode(t.replace(/[^0-9]/g, '').slice(0, 6));
                  }}
                  onSubmit={handleVerifyCode}
                />

                <TouchableOpacity
                  style={[styles.button, (loading || code.length !== 6) && styles.disabled]}
                  onPress={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.replace('ForgotPassword')}
                  style={styles.resendLink}
                >
                  <Text style={styles.resendText}>Didn't receive the code? </Text>
                  <Text style={styles.resendAction}>Send again</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22} color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.passwordRow}>
                  <TextInput
                    ref={confirmPasswordRef}
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22} color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || !newPassword || !confirmPassword) && styles.disabled,
                  ]}
                  onPress={handleReset}
                  disabled={loading || !newPassword || !confirmPassword}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

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

// ─── Custom OTP-style code input ──────────────────────────────────────────────
function CodeInput({ value, onChange, onSubmit }) {
  const inputRef = useRef(null);
  const CELLS = 6;

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={codeStyles.wrapper}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        keyboardType="number-pad"
        maxLength={CELLS}
        returnKeyType="done"
        caretHidden
        style={codeStyles.hiddenInput}
        autoFocus={false}
      />
      <View style={codeStyles.cells} pointerEvents="none">
        {Array.from({ length: CELLS }).map((_, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <View
              key={i}
              style={[
                codeStyles.cell,
                filled && codeStyles.cellFilled,
                active && codeStyles.cellActive,
              ]}
            >
              {filled ? (
                <Text style={codeStyles.cellText}>{value[i]}</Text>
              ) : (
                <View style={codeStyles.dot} />
              )}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const codeStyles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  cells: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  cell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: '#4A6A3B',
    backgroundColor: '#F0F5EE',
  },
  cellActive: {
    borderColor: '#4A6A3B',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  cellText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
});

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logo: { width: 72, height: 72, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#4A6A3B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  successBannerText: { flex: 1, fontSize: 13, color: '#10b981' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#ef4444' },

  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 48,
    width: '100%',
    marginBottom: 8,
  },
  emailIcon: { marginRight: 10 },
  emailText: { flex: 1, fontSize: 15, color: '#6B7280' },

  helpText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: '#1F2937',
    width: '100%',
  },

  passwordRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eyeIcon: { position: 'absolute', right: 16, top: 14 },

  button: {
    backgroundColor: '#4A6A3B',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  resendLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: { fontSize: 13, color: '#9CA3AF' },
  resendAction: { fontSize: 13, color: '#4A6A3B', fontWeight: '600' },

  backLink: { flexDirection: 'row', alignItems: 'center' },
  backText: { color: '#4A6A3B', fontSize: 14, fontWeight: '500' },
});