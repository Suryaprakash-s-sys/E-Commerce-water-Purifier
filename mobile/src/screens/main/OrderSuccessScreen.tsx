import { useAppTheme } from '../../context/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'OrderSuccess'>;
  route: RouteProp<HomeStackParamList, 'OrderSuccess'>;
};

export default function OrderSuccessScreen({
 navigation, route }: Props) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const { orderId } = route.params;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 6 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={[COLORS.primaryDark, COLORS.secondary]} style={styles.container}>
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name='checkmark' size={60} color='#fff' />
      </Animated.View>

      <Animated.View style={[styles.content, { opacity: opacityAnim }]}>
        <Text style={styles.title}>Payment successful</Text>
        <Text style={styles.subtitle}>Your payment is verified. Your order is awaiting processing.</Text>
        <View style={styles.orderIdCard}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderIdText}>{orderId.slice(-8).toUpperCase()}</Text>
        </View>

        <View style={styles.steps}>
          {[
            { icon: 'time', label: 'Pending', done: true },
            { icon: 'cube', label: 'Processing', done: false },
            { icon: 'car', label: 'Shipped', done: false },
            { icon: 'home', label: 'Delivered', done: false },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <Ionicons name={step.icon as any} size={24} color={step.done ? '#fff' : 'rgba(255,255,255,0.4)'} />
              <Text style={[styles.stepLabel, { color: step.done ? '#fff' : 'rgba(255,255,255,0.5)' }]}>{step.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.infoText}>You will receive an email and SMS confirmation shortly.</Text>

        <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.getParent()?.navigate('OrdersTab')}>
          <Ionicons name='receipt-outline' size={18} color={COLORS.success} />
          <Text style={styles.trackBtnText}>Track My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  checkCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  content: { alignItems: 'center', width: '100%' },
  title: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.extraBold, color: '#fff', textAlign: 'center', marginBottom: SPACING.sm },
  subtitle: { fontSize: FONT_SIZE.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: SPACING.xl },
  orderIdCard: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.xl, width: '100%' },
  orderIdLabel: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.7)' },
  orderIdText: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: '#fff', letterSpacing: 2 },
  steps: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: SPACING.xl },
  step: { alignItems: 'center', gap: 4 },
  stepLabel: { fontSize: 9, textAlign: 'center' },
  infoText: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: SPACING.xl },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, width: '100%', justifyContent: 'center', marginBottom: SPACING.md, ...SHADOW.md },
  trackBtnText: { color: COLORS.success, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },
  homeBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  homeBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semiBold },

  });
  return styles;
}
