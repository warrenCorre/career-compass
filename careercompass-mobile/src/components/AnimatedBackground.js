// src/components/AnimatedBackground.js – Enhanced: richer orbs, crisp shapes, smoother animations
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const SCREEN = Dimensions.get('screen');

const ORB_CONFIGS = [
  { size: 0.90, color: '#4A6A3B', opacity: 0.11, duration: 20000, top: -0.30, right: -0.30, phase: 0 },
  { size: 0.75, color: '#A3C9A8', opacity: 0.13, duration: 26000, bottom: -0.30, left: -0.30, phase: 0.35 },
  { size: 0.55, color: '#F4E3C6', opacity: 0.11, duration: 22000, top: 0.36, left: 0.10, phase: 0.6 },
  { size: 0.34, color: '#7FB069', opacity: 0.09, duration: 17000, top: 0.10, left: -0.20, phase: 0.2 },
  { size: 0.24, color: '#C6D9BF', opacity: 0.08, duration: 24000, bottom: 0.16, right: -0.10, phase: 0.75 },
  { size: 0.19, color: '#4A6A3B', opacity: 0.07, duration: 15000, top: 0.53, right: 0.04, phase: 0.5 },
  { size: 0.14, color: '#A3C9A8', opacity: 0.06, duration: 19000, top: 0.72, left: 0.30, phase: 0.9 },
];

// Crisp floating accent shapes
const SHAPE_CONFIGS = [
  { size: 16, opacity: 0.07, top: 0.18, right: 0.08, duration: 11000, phase: 0.1, type: 'diamond' },
  { size: 11, opacity: 0.06, top: 0.63, left: 0.07, duration: 14000, phase: 0.6, type: 'diamond' },
  { size: 8,  opacity: 0.05, bottom: 0.22, right: 0.13, duration: 17000, phase: 0.4, type: 'circle' },
  { size: 12, opacity: 0.05, top: 0.40, right: 0.20, duration: 21000, phase: 0.8, type: 'circle' },
  { size: 7,  opacity: 0.04, bottom: 0.45, left: 0.18, duration: 13000, phase: 0.3, type: 'diamond' },
];

function FloatingOrb({ config, index }) {
  const moveX = useRef(new Animated.Value(0)).current;
  const moveY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  const { size, color, opacity, duration, top, right, bottom, left, phase } = config;

  useEffect(() => {
    const startDelay = phase * duration;

    const xTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveX, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(moveX, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, startDelay);

    const yTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveY, { toValue: 1, duration: duration * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(moveY, { toValue: 0, duration: duration * 1.3, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, startDelay + 600);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 4800 + index * 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 4800 + index * 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    return () => { clearTimeout(xTimer); clearTimeout(yTimer); };
  }, []);

  const translateX = moveX.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 === 0 ? 42 : -34] });
  const translateY = moveY.interpolate({ inputRange: [0, 1], outputRange: [0, index % 2 === 0 ? 28 : -36] });

  const s = SCREEN.width * size;
  const positionStyle = {};
  if (top !== undefined) positionStyle.top = top < 0 ? -s * Math.abs(top) : SCREEN.height * top;
  if (right !== undefined) positionStyle.right = right < 0 ? -s * Math.abs(right) : SCREEN.width * right;
  if (bottom !== undefined) positionStyle.bottom = bottom < 0 ? -s * Math.abs(bottom) : SCREEN.height * bottom;
  if (left !== undefined) positionStyle.left = left < 0 ? -s * Math.abs(left) : SCREEN.width * left;

  return (
    <Animated.View
      style={[
        styles.orb,
        { width: s, height: s, backgroundColor: color, opacity, ...positionStyle },
        { transform: [{ translateX }, { translateY }, { scale: pulse }] },
      ]}
    />
  );
}

function FloatingShape({ config, index }) {
  const moveY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { size, opacity, top, right, bottom, left, duration, phase, type } = config;

  useEffect(() => {
    const delay = phase * duration;
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveY, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(moveY, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }, delay);

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: duration * 3.5, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // subtle pulse for circles
    if (type === 'circle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: duration * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: duration * 0.5, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    }
  }, []);

  const translateY = moveY.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const positionStyle = {};
  if (top !== undefined) positionStyle.top = SCREEN.height * top;
  if (right !== undefined) positionStyle.right = SCREEN.width * right;
  if (bottom !== undefined) positionStyle.bottom = SCREEN.height * bottom;
  if (left !== undefined) positionStyle.left = SCREEN.width * left;

  const shapeStyle = type === 'circle'
    ? [styles.circle, { width: size, height: size, borderRadius: size / 2 }]
    : [styles.diamond, { width: size, height: size }];

  return (
    <Animated.View
      style={[
        ...shapeStyle,
        {
          opacity,
          ...positionStyle,
          transform: [{ translateY }, { rotate: spin }, { scale: scaleAnim }],
        },
      ]}
    />
  );
}

const MemoOrb = React.memo(FloatingOrb);
const MemoShape = React.memo(FloatingShape);

export default function AnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ORB_CONFIGS.map((config, idx) => (
        <MemoOrb key={idx} config={config} index={idx} />
      ))}
      {SHAPE_CONFIGS.map((config, idx) => (
        <MemoShape key={`s${idx}`} config={config} index={idx} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  diamond: {
    position: 'absolute',
    backgroundColor: '#4A6A3B',
    borderRadius: 3,
  },
  circle: {
    position: 'absolute',
    backgroundColor: '#A3C9A8',
    borderRadius: 9999,
  },
});