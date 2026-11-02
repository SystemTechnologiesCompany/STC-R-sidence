import React, { useEffect, useId, useRef } from 'react';
import { Animated, AppState, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useReducedMotion } from './motion';

export function GreenCard({ children, style, large = false }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; large?: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    if (reduced) { progress.setValue(0); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 6500, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(progress, { toValue: 0, duration: 6500, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    const update = (state: string) => { animation.stop(); if (state === 'active') animation.start(); };
    if (AppState.currentState === 'active') animation.start();
    const listener = AppState.addEventListener('change', update);
    return () => { animation.stop(); listener.remove(); };
  }, [progress, reduced]);
  return <View style={[styles.card, style]}>
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`${id}base`} x1="0%" y1="100%" x2="100%" y2="0%"><Stop offset="0" stopColor="#083C30" /><Stop offset="0.55" stopColor="#12664A" /><Stop offset="1" stopColor="#25845C" /></LinearGradient>
          <RadialGradient id={`${id}glow`} cx="100%" cy="0%" rx="85%" ry="90%"><Stop offset="0" stopColor="#C4F38A" stopOpacity=".23" /><Stop offset="1" stopColor="#C4F38A" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id}base)`} /><Rect width="100%" height="100%" fill={`url(#${id}glow)`} />
      </Svg>
      <Animated.View style={[styles.orbit, large && styles.largeOrbit, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [.45, .85] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }, { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '8deg'] }) }] }]}><View style={styles.innerOrbit} /><View style={styles.lightDot} /></Animated.View>
      <View style={styles.edge} />
    </View>
    {children}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#12664A', overflow: 'hidden', borderRadius: 27, borderWidth: 1, borderColor: '#ffffff25' },
  orbit: { position: 'absolute', width: 220, height: 220, right: -100, top: -55, borderRadius: 110, borderWidth: 1, borderColor: '#D6F7AC55', backgroundColor: '#B9ED7708' },
  largeOrbit: { width: 340, height: 340, borderRadius: 170, right: -160, top: 70 },
  innerOrbit: { position: 'absolute', top: 24, left: 24, right: 24, bottom: 24, borderRadius: 180, borderWidth: 1, borderColor: '#D6F7AC28' },
  lightDot: { position: 'absolute', left: 30, top: 30, width: 7, height: 7, borderRadius: 4, backgroundColor: '#C4F38A', shadowColor: '#C4F38A', shadowOpacity: .7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  edge: { position: 'absolute', top: 0, left: 26, right: 26, height: 1, backgroundColor: '#D6F7AC55' },
});

