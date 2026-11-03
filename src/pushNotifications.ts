import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

type NotificationsModule = typeof ExpoNotifications;
let Notifications: NotificationsModule | null = null;
try {
  if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  Notifications = require('expo-notifications') as NotificationsModule;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  }
} catch {
  // Expo Go or an older installed native client may not include this module.
}

export function getLastNotificationResponse(): ExpoNotifications.NotificationResponse | null {
  try { return Notifications?.getLastNotificationResponse() ?? null; }
  catch { return null; }
}

export function addNotificationResponseListener(
  listener: (response: ExpoNotifications.NotificationResponse) => void,
): { remove(): void } | null {
  try { return Notifications?.addNotificationResponseReceivedListener(listener) ?? null; }
  catch { return null; }
}

/** Register this installation for pushes after the user signs in. */
export async function registerPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('stc-reports', {
      name: 'Signalements et réponses',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: '#16845A',
    });
    await Notifications.setNotificationChannelAsync('stc-updates', {
      name: 'Mises à jour importantes',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#16845A',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted
    ? current
    : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('EAS project ID is missing from app configuration.');

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' },
  );
  if (error) throw error;
}
