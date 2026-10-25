import { useAppTheme } from '../../context/ThemeContext';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Platform,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/useAppStore';
import { orderService, SHIPPING_FEE } from '../../services/orderService';
import { createRazorpayOrder, verifyRazorpayPayment } from '../../services/razorpayService';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Checkout'>;
};

export default function CheckoutScreen({
 navigation }: Props) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const { user, cart, clearCart, isDealer, isDealerApproved } = useAppStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses?.find((a) => a.isDefault)?.id ?? user?.addresses?.[0]?.id ?? ''
  );
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const addresses = user?.addresses ?? [];
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const totals = orderService.calculateTotals(cart.items);

  const handleRazorpayCheckout = async () => {
    if (!selectedAddress) {
      Alert.alert('No Address', 'Please add a delivery address before checkout.');
      return;
    }
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in again before paying.');
      return;
    }
    if (Platform.OS === 'web') {
      Alert.alert('Mobile app required', 'Razorpay checkout is available in the installed Android or iOS app.');
      return;
    }

    setIsProcessing(true);
    let paymentSubmitted = false;
    let verifiedOrderId: string | null = null;
    let razorpayOrderId = '';
    try {
      const checkoutOrder = await createRazorpayOrder({
        addressId: selectedAddress.id,
        items: cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
        notes,
      });
      razorpayOrderId = checkoutOrder.orderId;

      if (checkoutOrder.amount !== totals.totalAmount * 100) {
        Alert.alert(
          'Price updated',
          `The current server total is ${formatCurrency(checkoutOrder.totalAmount)}. Please review your cart and try again.`,
        );
        return;
      }

      const phoneDigits = (selectedAddress.phone || user.phone || '').replace(/\D/g, '');
      const contact = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
      const result = await RazorpayCheckout.open({
        key: checkoutOrder.keyId,
        amount: String(checkoutOrder.amount),
        currency: checkoutOrder.currency,
        name: 'Califnco',
        description: 'Water purifier order',
        order_id: checkoutOrder.orderId,
        prefill: {
          name: selectedAddress.fullName || user.displayName,
          email: user.email,
          ...(contact ? { contact } : {}),
        },
        theme: { color: COLORS.primaryDark },
      });
      paymentSubmitted = true;

      if (result.razorpay_order_id !== checkoutOrder.orderId) {
        throw new Error('The payment response did not match the checkout order.');
      }

      const verifiedOrder = await verifyRazorpayPayment({
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });
      verifiedOrderId = verifiedOrder.orderId;

      await clearCart();
      navigation.replace('OrderSuccess', { orderId: verifiedOrder.orderId });
    } catch (err: any) {
      const message = err?.description ?? err?.message ?? 'Please try again.';
      if (verifiedOrderId) {
        navigation.replace('OrderSuccess', { orderId: verifiedOrderId });
      } else if (paymentSubmitted) {
        Alert.alert(
          'Payment needs confirmation',
          `Razorpay returned a payment, but the app could not confirm the order. Do not pay again yet. Contact support with payment reference ${razorpayOrderId}. ${message}`,
        );
      } else if (err?.code === 0 || /cancel/i.test(message)) {
        // The customer closed Razorpay before completing checkout.
      } else {
        Alert.alert('Unable to start payment', message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Payment Provider */}
      <View style={styles.testBanner}>
        <Ionicons name='shield-checkmark-outline' size={16} color={COLORS.success} />
        <Text style={styles.testBannerText}>Secure checkout powered by Razorpay</Text>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
        {addresses.length === 0 ? (
          <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddAddress')}>
            <Ionicons name='add-circle-outline' size={20} color={COLORS.primary} />
            <Text style={styles.addAddressText}>Add Delivery Address</Text>
          </TouchableOpacity>
        ) : (
          addresses.map((addr) => (
            <TouchableOpacity
              key={addr.id}
              style={[styles.addressCard, selectedAddressId === addr.id && styles.addressCardSelected]}
              onPress={() => setSelectedAddressId(addr.id)}
            >
              <View style={styles.addressRadio}>
                <View style={[styles.radio, selectedAddressId === addr.id && styles.radioSelected]} />
              </View>
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>{addr.label} — {addr.fullName}</Text>
                <Text style={styles.addressText}>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</Text>
                <Text style={styles.addressText}>{addr.city}, {addr.state} — {addr.pincode}</Text>
                <Text style={styles.addressPhone}>📞 {addr.phone}</Text>
              </View>
              {selectedAddressId === addr.id && <Ionicons name='checkmark-circle' size={22} color={COLORS.success} />}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 Items ({cart.totalItems})</Text>
        {cart.items.map((item) => (
          <View key={item.productId} style={styles.orderItem}>
            <View style={styles.orderItemLeft}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.product.name}</Text>
              <Text style={styles.orderItemMeta}>Qty: {item.quantity} × {formatCurrency(item.price)}</Text>
            </View>
            <Text style={styles.orderItemSubtotal}>{formatCurrency(item.subtotal)}</Text>
          </View>
        ))}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Order Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder='Special instructions, preferred delivery time...'
          placeholderTextColor={COLORS.textLight}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Price Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Price Breakdown</Text>
        <View style={styles.priceCard}>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>{formatCurrency(totals.subtotal)}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Shipping</Text><Text style={styles.priceValue}>{formatCurrency(SHIPPING_FEE)}</Text></View>
          <View style={styles.priceRow}><Text style={styles.priceLabel}>GST (18%)</Text><Text style={styles.priceValue}>{formatCurrency(totals.tax)}</Text></View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.totalAmount)}</Text>
          </View>
          {isDealer && isDealerApproved && (
            <Text style={styles.dealerSavings}>🏪 Dealer pricing applied on all items</Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, (isProcessing || !selectedAddress) && styles.payBtnDisabled]}
        onPress={() => void handleRazorpayCheckout()}
        disabled={isProcessing || !selectedAddress}
      >
        {isProcessing ? <ActivityIndicator color={COLORS.textOnPrimary} /> : (
          <><Ionicons name='card' size={20} color={COLORS.textOnPrimary} />
          <Text style={styles.payBtnText}>Pay securely · {formatCurrency(totals.totalAmount)}</Text></>
        )}
      </TouchableOpacity>

      <Text style={styles.secureNote}>You will be redirected to Razorpay to complete your payment.</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.base },
  testBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.success + '15', borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.base, borderLeftWidth: 3, borderLeftColor: COLORS.success },
  testBannerText: { fontSize: FONT_SIZE.sm, color: COLORS.success, fontWeight: FONT_WEIGHT.semiBold },
  section: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.md, ...SHADOW.sm },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', borderRadius: BORDER_RADIUS.md },
  addAddressText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: SPACING.sm },
  addressCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  addressRadio: { paddingTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  addressContent: { flex: 1 },
  addressLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: 2 },
  addressText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 18 },
  addressPhone: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  orderItemLeft: { flex: 1, marginRight: SPACING.sm },
  orderItemName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  orderItemMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  orderItemSubtotal: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  notesInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, padding: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.text, textAlignVertical: 'top', minHeight: 80 },
  priceCard: { gap: SPACING.sm },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  priceValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.xs },
  totalLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  totalValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extraBold, color: COLORS.primary },
  dealerSavings: { fontSize: FONT_SIZE.xs, color: COLORS.success, marginTop: 4 },
  payBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, height: 56, borderRadius: BORDER_RADIUS.full, ...SHADOW.md, marginBottom: SPACING.sm },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  secureNote: { textAlign: 'center', fontSize: FONT_SIZE.xs, color: COLORS.textMuted },

  });
  return styles;
}
