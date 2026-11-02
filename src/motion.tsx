import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, type ViewStyle } from 'react-native';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}

export function ScreenTransition({ screen, rtl, children }: { screen: string; rtl: boolean; children: React.ReactNode }) {
  const progress = useRef(new Animated.Value(1)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const previous = useRef(screen);
  const reduced = useReducedMotion();
  useLayoutEffect(() => {
    const tabs = ['home', 'inbox', 'profile'];
    const from = tabs.indexOf(previous.current);
    const to = tabs.indexOf(screen);
    const changed = previous.current !== screen;
    previous.current = screen;
    if (!changed || reduced || from < 0 || to < 0) { progress.setValue(1); offset.setValue(0); return; }
    progress.setValue(0.35);
    offset.setValue((to > from ? 26 : -26) * (rtl ? -1 : 1));
    const animation = Animated.parallel([
      Animated.timing(progress, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(offset, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [screen, rtl, reduced, progress, offset]);
  return <Animated.View style={{ flex: 1, opacity: progress, transform: [{ translateX: offset }] }}>{children}</Animated.View>;
}

export function PopIn({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: reduced ? 0 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);
  return <Animated.View style={[style, { opacity: progress, transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>{children}</Animated.View>;
}
