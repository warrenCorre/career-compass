// src/components/ModernAlert.js – Enhanced animations & polish
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function ModernAlert({ visible, title, message, icon, iconColor = '#4A6A3B', buttons = [], onDismiss }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.82);
      translateY.setValue(30);
      iconBounce.setValue(0);
      iconRotate.setValue(0);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        Animated.parallel([
          Animated.sequence([
            Animated.spring(iconBounce, { toValue: -8, friction: 4, tension: 140, useNativeDriver: true }),
            Animated.spring(iconBounce, { toValue: 2, friction: 5, tension: 100, useNativeDriver: true }),
            Animated.spring(iconBounce, { toValue: 0, friction: 6, tension: 90, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(iconRotate, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
            Animated.timing(iconRotate, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        ]).start();
      });
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.82);
      translateY.setValue(30);
      iconBounce.setValue(0);
      iconRotate.setValue(0);
    }
  }, [visible]);

  const handleButtonPress = (pressFunc) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      pressFunc && pressFunc();
    });
  };

  const iconRotation = iconRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss} statusBarTranslucent>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY }] }]}>
          {icon && (
            <Animated.View style={[styles.iconCircle, { backgroundColor: iconColor + '15', transform: [{ translateY: iconBounce }, { rotate: iconRotation }] }]}>
              <View style={[styles.iconInner, { backgroundColor: iconColor + '25' }]}>
                <Icon name={icon} size={32} color={iconColor} />
              </View>
            </Animated.View>
          )}
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={[styles.buttonsRow, buttons.length === 1 && styles.buttonsRowCenter]}>
            {buttons.map((btn, index) => (
              <PressableButton key={index} btn={btn} index={index} total={buttons.length} onPress={() => handleButtonPress(btn.onPress)} />
            ))}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

function PressableButton({ btn, index, total, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.94, friction: 8, tension: 140, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, total === 1 && styles.btnFull, total > 1 && { flex: 1 }]}>
      <TouchableOpacity
        style={[styles.btn, btn.style === 'cancel' && styles.btnCancel, btn.style === 'destructive' && styles.btnDestructive]}
        onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}
      >
        <Text style={[styles.btnText, btn.style === 'cancel' && styles.btnTextCancel, btn.style === 'destructive' && styles.btnTextDestructive]}>
          {btn.text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: {
    width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 26, paddingVertical: 32, paddingHorizontal: 26,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.16, shadowRadius: 28, elevation: 14,
  },
  iconCircle: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  iconInner: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8, letterSpacing: 0.3 },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  buttonsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, width: '100%' },
  buttonsRowCenter: { justifyContent: 'center' },
  btn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 30, backgroundColor: '#4A6A3B', alignItems: 'center', justifyContent: 'center' },
  btnCancel: { backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: '#E5E7EB' },
  btnDestructive: { backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#FECACA' },
  btnFull: { minWidth: 140 },
  btnText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  btnTextCancel: { color: '#1F2937' },
  btnTextDestructive: { color: '#EF4444' },
});