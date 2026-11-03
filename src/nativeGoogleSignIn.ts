import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as GoogleSignInModule from '@react-native-google-signin/google-signin';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Loading this library in Expo Go throws before the router can render a screen.
export const nativeGoogleSignIn: typeof GoogleSignInModule | null = (() => {
  if (isExpoGo) return null;
  try {
    return require('@react-native-google-signin/google-signin') as typeof GoogleSignInModule;
  } catch {
    return null;
  }
})();
