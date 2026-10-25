import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { authService } from './authService';

/** Requests Android notification permission and saves the native FCM token. */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (Platform.OS !== 'android') return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Califnco updates',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8ADBE5',
  });

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  if (deviceToken.type !== 'android' || typeof deviceToken.data !== 'string') return null;
  await authService.updateFCMToken(userId, deviceToken.data);
  return deviceToken.data;
}

export async function saveRefreshedPushToken(userId: string, data: unknown): Promise<void> {
  if (Platform.OS === 'android' && typeof data === 'string') {
    await authService.updateFCMToken(userId, data);
  }
}
