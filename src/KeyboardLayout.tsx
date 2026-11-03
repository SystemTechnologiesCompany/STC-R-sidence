import { createContext, useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Platform, ScrollView as NativeScrollView, type ScrollViewProps, type TextInput } from 'react-native';

type InputInstance = ComponentRef<typeof TextInput>;
export const KeyboardFocusContext = createContext<((input: InputInstance) => void) | null>(null);

export function useKeyboardVisible() {
  const [visible, setVisible] = useState(Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return visible;
}

// Keep the focused input visible both when opening the keyboard and when
// moving between fields while the keyboard is already open.
export function KeyboardScrollView({ children, ...props }: ScrollViewProps) {
  const scroll = useRef<ComponentRef<typeof NativeScrollView>>(null);
  const focused = useRef<InputInstance | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reveal = useCallback(() => {
    const input = focused.current;
    if (!input?.isFocused()) return;
    scroll.current?.scrollResponderScrollNativeHandleToKeyboard(input, 24, true);
  }, []);
  const onFocus = useCallback((input: InputInstance) => {
    focused.current = input;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(reveal, 180);
  }, [reveal]);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', reveal);
    return () => { show.remove(); if (timer.current) clearTimeout(timer.current); };
  }, [reveal]);
  return <KeyboardFocusContext.Provider value={onFocus}><NativeScrollView
    ref={scroll}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    {...props}
    onLayout={event => { props.onLayout?.(event); if (Keyboard.isVisible()) reveal(); }}
  >{children}</NativeScrollView></KeyboardFocusContext.Provider>;
}
