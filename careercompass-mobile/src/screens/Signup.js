// src/screens/Signup.js – Modern alerts replacing Alert.alert
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  Dimensions, StatusBar, Animated, Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import ModernAlert from '../components/ModernAlert';

const { width } = Dimensions.get('window');

// ─── Focus-animation input wrapper (unchanged) ──────────
function AnimatedInputContainer({ children, showPassword, onTogglePassword }) {
  const [isFocused, setIsFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 230,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#4A6A3B'],
  });

  return (
    <Animated.View style={[styles.inputContainer, { borderColor: animatedBorderColor }]}>
      <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
        {React.Children.map(children, (child) =>
          child
            ? React.cloneElement(child, {
                onFocus: (e) => { setIsFocused(true); child.props.onFocus?.(e); },
                onBlur:  (e) => { setIsFocused(false); child.props.onBlur?.(e); },
              })
            : null
        )}
      </View>
      {onTogglePassword && (
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeIcon}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={isFocused ? '#4A6A3B' : '#9CA3AF'}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameTimeout, setUsernameTimeout] = useState(null);
  const [errors, setErrors] = useState({});

  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const pendingCategory = route.params?.pendingCategory || null;

  // Refs for keyboard focus-chaining
  const lastNameRef        = useRef(null);
  const ageRef             = useRef(null);
  const usernameRef        = useRef(null);
  const emailRef           = useRef(null);
  const passwordRef        = useRef(null);
  const confirmPasswordRef = useRef(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
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
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    return () => { if (usernameTimeout) clearTimeout(usernameTimeout); };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleUsernameChange = (value) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData((prev) => ({ ...prev, username: clean }));
    if (usernameTimeout) clearTimeout(usernameTimeout);
    const timeout = setTimeout(() => checkAvailability(clean), 500);
    setUsernameTimeout(timeout);
  };

  const checkAvailability = async (uname) => {
    if (!uname || uname.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await api.post('/api/auth/check-username', { username: uname });
      setUsernameAvailable(res.data.available);
      setErrors((prev) => ({ ...prev, username: res.data.available ? null : 'Username already taken' }));
    } catch (err) {
      console.error('Check username error:', err);
    } finally {
      setCheckingUsername(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = 'Required';
    if (!formData.lastName.trim())  e.lastName  = 'Required';
    if (!formData.username.trim())  e.username  = 'Required';
    else if (formData.username.length < 3)                    e.username = 'At least 3 characters';
    else if (!/^[a-z0-9_]+$/.test(formData.username))        e.username = 'Only letters, numbers, underscores';
    else if (usernameAvailable === false)                     e.username = 'Username already taken';
    const age = parseInt(formData.age, 10);
    if (!formData.age)               e.age = 'Required';
    else if (isNaN(age) || age < 17) e.age = 'Must be at least 17';
    else if (age > 100)              e.age = 'Invalid age';
    if (!formData.email) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.password)                e.password = 'Required';
    else if (formData.password.length < 8) e.password = 'Min 8 characters';
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        age:       parseInt(formData.age, 10),
        username:  formData.username.trim(),
        email:     formData.email.trim().toLowerCase(),
        password:  formData.password,
      });
      showModernAlert({
        title: 'Account Created!',
        message: 'Please log in to begin your journey.',
        icon: 'party-popper',
        iconColor: '#10B981',
        buttons: [{
          text: 'Log In',
          onPress: () => {
            hideModernAlert();
            navigation.navigate('Login', { pendingCategory, isNewUser: true });
          }
        }],
        onDismiss: hideModernAlert,
      });
    } catch (err) {
      const msg = err.response?.data?.msg || 'Registration failed';
      showModernAlert({
        title: 'Error',
        message: msg,
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={true}
        >
          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />

            {pendingCategory && (
              <View style={styles.pendingBanner}>
                <Icon name="information-outline" size={16} color="#4A6A3B" />
                <Text style={styles.pendingBannerText}>
                  Create an account to start your{' '}
                  <Text style={styles.pendingBannerBold}>{pendingCategory.name}</Text> assessment
                </Text>
              </View>
            )}

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join CareerCompass</Text>

            {/* Row: First Name + Last Name */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <AnimatedInputContainer>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.firstName}
                    onChangeText={(t) => handleChange('firstName', t)}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </AnimatedInputContainer>
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>
              <View style={styles.halfInput}>
                <AnimatedInputContainer>
                  <TextInput
                    ref={lastNameRef}
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.lastName}
                    onChangeText={(t) => handleChange('lastName', t)}
                    returnKeyType="next"
                    onSubmitEditing={() => ageRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </AnimatedInputContainer>
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            {/* Row: Age + Username */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <AnimatedInputContainer>
                  <TextInput
                    ref={ageRef}
                    style={styles.input}
                    placeholder="Age"
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    value={formData.age}
                    onChangeText={(t) => handleChange('age', t)}
                    maxLength={3}
                    returnKeyType="next"
                    onSubmitEditing={() => usernameRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </AnimatedInputContainer>
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>
              <View style={styles.halfInput}>
                <AnimatedInputContainer>
                  <View style={styles.usernameWrapper}>
                    <TextInput
                      ref={usernameRef}
                      style={styles.usernameInput}
                      placeholder="Username"
                      placeholderTextColor="#9CA3AF"
                      value={formData.username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    {checkingUsername && (
                      <ActivityIndicator size="small" color="#4A6A3B" style={styles.usernameStatusIcon} />
                    )}
                    {!checkingUsername && usernameAvailable === true && formData.username.length >= 3 && (
                      <Icon name="check-circle" size={20} color="#10b981" style={styles.usernameStatusIcon} />
                    )}
                    {!checkingUsername && usernameAvailable === false && formData.username.length >= 3 && (
                      <Icon name="close-circle" size={20} color="#ef4444" style={styles.usernameStatusIcon} />
                    )}
                  </View>
                </AnimatedInputContainer>
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : usernameAvailable === true && formData.username.length >= 3 ? (
                  <Text style={styles.successText}>Available</Text>
                ) : null}
              </View>
            </View>

            {/* Email */}
            <AnimatedInputContainer>
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(t) => handleChange('email', t)}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </AnimatedInputContainer>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password */}
            <AnimatedInputContainer
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            >
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Password (min. 8 characters)"
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(t) => handleChange('password', t)}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
            </AnimatedInputContainer>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Confirm Password */}
            <AnimatedInputContainer
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <TextInput
                ref={confirmPasswordRef}
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry={!showConfirmPassword}
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(t) => handleChange('confirmPassword', t)}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </AnimatedInputContainer>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading || usernameAvailable === false}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginAction}>Log in</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logo: { width: 72, height: 72, marginBottom: 12 },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F5EE',
    borderWidth: 1,
    borderColor: '#C6D9BF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    width: '100%',
  },
  pendingBannerText: { flex: 1, fontSize: 13, color: '#4A6A3B', lineHeight: 18 },
  pendingBannerBold: { fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#4A6A3B', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 28 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12, width: '100%' },
  halfInput: { flex: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    marginBottom: 4,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  usernameWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  usernameStatusIcon: {
    marginLeft: 6,
  },
  eyeIcon: {
    paddingLeft: 8,
  },
  errorText: { fontSize: 11, color: '#ef4444', marginBottom: 8, alignSelf: 'flex-start' },
  successText: { fontSize: 11, color: '#10b981', marginBottom: 8, alignSelf: 'flex-start' },
  signupButton: {
    backgroundColor: '#4A6A3B',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    shadowColor: '#4A6A3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  disabled: { opacity: 0.7 },
  signupButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  loginLink: { flexDirection: 'row', marginTop: 20, alignItems: 'center', marginBottom: 10 },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginAction: { color: '#4A6A3B', fontSize: 14, fontWeight: '600' },
});