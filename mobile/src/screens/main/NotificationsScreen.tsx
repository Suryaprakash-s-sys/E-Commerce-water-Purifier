import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { registerForPushNotifications } from '../../services/pushNotificationService';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;


  const { user } = useAppStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('Enable notifications to receive order and service updates.');
  const [isRegistered, setIsRegistered] = useState(false);

  const enableNotifications = async () => {
    if (!user?.uid) {
      setMessage('Sign in to enable notifications for your account.');
      return;
    }
    setIsRegistering(true);
    setMessage('');
    try {
      const token = await registerForPushNotifications(user.uid);
      if (token) {
        setIsRegistered(true);
        setMessage('This device is registered. Send a test message to its fcmToken from Firebase Console.');
      } else {
        setMessage('Notification permission was not granted. Enable notifications in Android Settings and try again.');
      }
    } catch (error) {
      console.error('Push registration failed:', error);
      setMessage(error instanceof Error ? error.message : 'Could not register this device. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.icon}><Ionicons name="notifications-outline" size={34} color={COLORS.primary} /></View>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.text}>{message}</Text>
      {!isRegistered && (
        <TouchableOpacity style={styles.button} onPress={() => void enableNotifications()} disabled={isRegistering}>
          {isRegistering ? <ActivityIndicator color={COLORS.textOnPrimary} /> : <Text style={styles.buttonText}>Enable on this device</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, backgroundColor: COLORS.background },
  icon: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#DFF4F6', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.base },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.sm },
  text: { fontSize: FONT_SIZE.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 23 },
  button: { minHeight: 50, paddingHorizontal: SPACING.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, marginTop: SPACING.xl },
  buttonText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },

  });
  return styles;
}
