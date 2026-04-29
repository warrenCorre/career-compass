// src/screens/Login.js – Modern alerts replacing Alert.alert
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
  StatusBar, Animated, Easing,
} from 'react-native';
import { useNavigation, CommonActions, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AnimatedBackground from '../components/AnimatedBackground';
import ModernAlert from '../components/ModernAlert';

// ... (FadeSlide and LogoEntrance components unchanged) ...

function FadeSlide({ delay, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

function LogoEntrance({ delay, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>;
}

function AnimatedInputContainer({
  icon,
  children,
  iconComponent: IconComp,
  showPassword,
  onTogglePassword,
}) {
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
      <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
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

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const isMounted = useRef(true);
  const passwordRef = useRef(null);

  const pendingCategory = route.params?.pendingCategory || null;
  const isNewUser = route.params?.isNewUser || false;

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

  useEffect(() => { return () => { isMounted.current = false; }; }, []);

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      showModernAlert({
        title: 'Error',
        message: 'Please enter both username and password',
        icon: 'alert-circle',
        iconColor: '#EF4444',
        buttons: [{ text: 'OK', onPress: hideModernAlert }],
        onDismiss: hideModernAlert,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await login(username.trim(), password);

      if (!result.success) {
        if (isMounted.current) {
          showModernAlert({
            title: 'Login Failed',
            message: result.message || 'Invalid credentials',
            icon: 'close-circle',
            iconColor: '#EF4444',
            buttons: [{ text: 'OK', onPress: hideModernAlert }],
            onDismiss: hideModernAlert,
          });
        }
        return;
      }

      if (pendingCategory) {
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              { name: 'MainTabs' },
              { name: 'PersonalAssessment', params: { category: pendingCategory } },
            ],
          })
        );
        return;
      }

      if (isNewUser) {
        navigation.dispatch(
          CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] })
        );
        return;
      }

      try {
        const dashResponse = await api.get('/api/student/dashboard');
        const hasResults = dashResponse.data.has_results === true;

        if (!isMounted.current) return;

        if (hasResults) {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        } else {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Welcome' }] }));
        }
      } catch {
        if (isMounted.current) {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
        }
      }
    } catch {
      if (isMounted.current) {
        showModernAlert({
          title: 'Error',
          message: 'An unexpected error occurred',
          icon: 'alert-circle',
          iconColor: '#EF4444',
          buttons: [{ text: 'OK', onPress: hideModernAlert }],
          onDismiss: hideModernAlert,
        });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const D = [0, 80, 140, 210, 265, 320, 390, 450, 505, 550];

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
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={true}
        >
          <View style={styles.content}>

            {pendingCategory && (
              <FadeSlide delay={0} style={styles.pendingBanner}>
                <Icon name="information-outline" size={16} color="#4A6A3B" />
                <Text style={styles.pendingBannerText}>
                  Log in to start your <Text style={styles.pendingBannerBold}>{pendingCategory.name}</Text> assessment
                </Text>
              </FadeSlide>
            )}

            {isNewUser && !pendingCategory && (
              <FadeSlide delay={0} style={styles.newUserBanner}>
                <Icon name="party-popper" size={16} color="#4A6A3B" />
                <Text style={styles.pendingBannerText}>
                  Account created! Log in to begin your career journey.
                </Text>
              </FadeSlide>
            )}

            <LogoEntrance delay={D[0]}>
              <View style={styles.logoContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              </View>
            </LogoEntrance>
            <FadeSlide delay={D[1]}><Text style={styles.title}>CareerCompass</Text></FadeSlide>
            <FadeSlide delay={D[2]}>
              <Text style={styles.subtitle}>
                {pendingCategory ? 'Sign in to continue' : isNewUser ? 'Welcome aboard!' : 'Continue your career journey'}
              </Text>
            </FadeSlide>

            <View style={styles.form}>
              <FadeSlide delay={D[3]} style={styles.inputWrapper}>
                <AnimatedInputContainer icon="account-outline" iconComponent={Icon}>
                  <TextInput
                    style={styles.input}
                    placeholder="Username or Email"
                    placeholderTextColor="#9CA3AF"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </AnimatedInputContainer>
              </FadeSlide>

              <FadeSlide delay={D[4]} style={styles.inputWrapper}>
                <AnimatedInputContainer
                  icon="lock-outline"
                  iconComponent={Icon}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                >
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </AnimatedInputContainer>
              </FadeSlide>

              <FadeSlide delay={D[5]}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={styles.forgotLink}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </FadeSlide>

              <FadeSlide delay={D[6]}>
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#FFFFFF" size="small" />
                    : <Text style={styles.loginButtonText}>Sign In</Text>
                  }
                </TouchableOpacity>
              </FadeSlide>

              <FadeSlide delay={D[7]}>
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>
                    {pendingCategory ? 'No account yet?' : 'New to CareerCompass?'}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>
              </FadeSlide>

              <FadeSlide delay={D[8]}>
                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={() => navigation.navigate('Signup', { pendingCategory })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.signupButtonText}>Create your account</Text>
                </TouchableOpacity>
              </FadeSlide>

              <FadeSlide delay={D[9]}>
                <Text style={styles.termsText}>
                  By signing in, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </FadeSlide>
            </View>
          </View>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { alignItems: 'center', width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 24 },

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
    marginBottom: 20,
    width: '100%',
  },
  newUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F5EE',
    borderWidth: 1,
    borderColor: '#C6D9BF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    width: '100%',
  },
  pendingBannerText: { flex: 1, fontSize: 13, color: '#4A6A3B', lineHeight: 18 },
  pendingBannerBold: { fontWeight: '700' },

  // Logo circle – sharp border, no shadow
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F4F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  logo: { width: 65, height: 65 },
  title: { fontSize: 30, fontWeight: '800', color: '#4A6A3B', marginBottom: 6, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 36, textAlign: 'center' },
  form: { width: '100%' },
  inputWrapper: { marginBottom: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderRadius: 14, paddingHorizontal: 16, height: 54,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1F2937', paddingVertical: 0 },
  eyeIcon: { padding: 6 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 28, marginTop: -4 },
  forgotText: { color: '#4A6A3B', fontSize: 14, fontWeight: '600' },
  loginButton: {
    backgroundColor: '#4A6A3B', paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 14, color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  signupButton: {
    borderWidth: 1.5, borderColor: '#4A6A3B', paddingVertical: 15,
    borderRadius: 30, alignItems: 'center', marginBottom: 20, backgroundColor: '#FFFFFF',
  },
  signupButtonText: { color: '#4A6A3B', fontSize: 16, fontWeight: '600' },
  termsText: { textAlign: 'center', fontSize: 11, color: '#9CA3AF', lineHeight: 16 },
  termsLink: { color: '#4A6A3B', fontWeight: '500' },
});