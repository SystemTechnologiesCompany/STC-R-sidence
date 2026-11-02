import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { Text, useLanguage } from './i18n';
import { useReducedMotion } from './motion';

export function BottomNavigation({ items, selected, onSelect }: {
  items: readonly { label: string; icon: React.ComponentType<SvgProps> }[];
  selected: string;
  onSelect: (index: number) => void;
}) {
  const { rtl } = useLanguage();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);
  const index = Math.max(0, items.findIndex(item => item.label === selected));
  const cell = Math.max(0, (width - 14) / items.length);
  useEffect(() => {
    const destination = (rtl ? items.length - 1 - index : index) * cell;
    if (!initialized.current || reduced) { position.setValue(destination); initialized.current = width > 0; return; }
    const animation = Animated.spring(position, { toValue: destination, damping: 23, stiffness: 230, mass: .8, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [index, cell, rtl, reduced, position, width, items.length]);
  return <View style={styles.wrap}><View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.bar}>
    {width > 0 && <Animated.View pointerEvents="none" style={[styles.indicator, { width: cell, transform: [{ translateX: position }] }]} />}
    {items.map(({ label, icon: Icon }, itemIndex) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: itemIndex === index }} key={label} onPress={() => onSelect(itemIndex)} style={styles.item}><Icon width={19} height={19} /><Text style={[styles.label, itemIndex === index && styles.active]}>{label}</Text></Pressable>)}
  </View></View>;
}
const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 22, right: 22, bottom: 13 },
  bar: { height: 64, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.97)', borderWidth: 1, borderColor: '#E2EBE4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, shadowColor: '#183A29', shadowOpacity: .12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  indicator: { position: 'absolute', left: 7, top: 7, height: 49, borderRadius: 18, backgroundColor: '#EAF7F0' },
  item: { flex: 1, height: 49, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  label: { fontSize: 10, color: '#98A69D', marginTop: 2 },
  active: { color: '#16845A', fontWeight: '800' },
});
