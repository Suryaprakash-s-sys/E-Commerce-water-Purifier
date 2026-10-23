import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut, isDealer, isDealerApproved } = useAppStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon') },
    { icon: 'location-outline', label: 'Saved Addresses', onPress: () => navigation.navigate('Address') },
    { icon: 'receipt-outline', label: 'My Orders', onPress: () => navigation.navigate('OrderHistory') },
    { icon: 'construct-outline', label: 'Service Bookings', onPress: () => Alert.alert('Coming Soon') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Coming Soon') },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => Alert.alert('Support', 'Email: support@califnco.com\nPhone: 1800-XXX-XXXX') },
    { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => Alert.alert('Privacy Policy', 'Your data is safe with us.') },
  ];

  if (isDealer) {
    menuItems.splice(2, 0, {
      icon: 'business-outline',
      label: `Dealer Account ${isDealerApproved ? '✓ Active' : '⏳ Pending'}`,
      onPress: () => Alert.alert('Dealer Status', isDealerApproved ? 'Your dealer account is active. Enjoy wholesale pricing!' : 'Your application is under review.'),
    });
  }

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient colors={[COLORS.primaryDark, COLORS.secondary]} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {isDealer && isDealerApproved && (
            <View style={styles.dealerBadge}>
              <Text style={styles.dealerBadgeText}>DEALER</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{user?.addresses?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Addresses</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{isDealer ? 'Dealer' : 'Customer'}</Text>
          <Text style={styles.statLabel}>Account Type</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity key={idx} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuIconBg}>
              <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <ActivityIndicator color={COLORS.error} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>Califnco v1.0.0 — Water Purifier Store</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 60, paddingBottom: SPACING.xl, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { fontSize: 32, fontWeight: FONT_WEIGHT.bold, color: '#fff' },
  dealerBadge: { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#F39C12', borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  dealerBadgeText: { color: '#fff', fontSize: 8, fontWeight: FONT_WEIGHT.extraBold, letterSpacing: 0.5 },
  name: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: '#fff', marginBottom: 4 },
  email: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' },
  phone: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.surface, marginHorizontal: SPACING.base, marginTop: -16, borderRadius: BORDER_RADIUS.xl, ...SHADOW.md, overflow: 'hidden' },
  statCard: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  menu: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.base, marginTop: SPACING.base, borderRadius: BORDER_RADIUS.xl, ...SHADOW.sm, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  menuIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  menuLabel: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.text },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: SPACING.base, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.error },
  signOutText: { color: COLORS.error, fontWeight: FONT_WEIGHT.semiBold },
  version: { textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
