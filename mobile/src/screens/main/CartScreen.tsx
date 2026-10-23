import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { CartItem } from '../../types';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const FALLBACK_IMAGES: Record<string, string> = {
  'water-purifiers': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
  'dispensers': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=200&h=200&fit=crop',
  'pumps': 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=200&h=200&fit=crop',
  'filters': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=200&h=200&fit=crop',
  'spare-parts': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=200&h=200&fit=crop',
};

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { cart, updateQuantity, removeFromCart, isCartLoading, isAuthenticated } = useAppStore();

  const handleRemove = (item: CartItem) => {
    Alert.alert('Remove Item', `Remove ${item.product.name} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(item.productId) },
    ]);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) { Alert.alert('Sign In Required', 'Please sign in to proceed.'); return; }
    if (cart.items.length === 0) { Alert.alert('Empty Cart', 'Add items to cart first.'); return; }
    navigation.navigate('HomeTab', { screen: 'Checkout' });
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name='person-outline' size={72} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptySubtitle}>Please sign in to view your cart</Text>
      </View>
    );
  }

  if (isCartLoading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size='large' color={COLORS.primary} /></View>;
  }

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name='cart-outline' size={72} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Add products to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({cart.totalItems} items)</Text><Text style={styles.summaryValue}>{formatCurrency(cart.totalAmount)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Shipping</Text><Text style={styles.summaryValue}>₹99</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>GST (18%)</Text><Text style={styles.summaryValue}>{formatCurrency(Math.round(cart.totalAmount * 0.18))}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total Amount</Text><Text style={styles.totalValue}>{formatCurrency(cart.totalAmount + 99 + Math.round(cart.totalAmount * 0.18))}</Text></View>
          </View>
        }
        renderItem={({ item }) => {
          const imageUrl = item.product.images?.[0] && !item.product.images[0].includes('demo')
            ? item.product.images[0]
            : FALLBACK_IMAGES[item.product.category] ?? FALLBACK_IMAGES['water-purifiers'];
          return (
            <View style={styles.cartItem}>
              <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode='cover' />
              <View style={styles.itemContent}>
                <Text style={styles.itemBrand}>{item.product.brand}</Text>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)} each</Text>
                <View style={styles.itemFooter}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                      <Ionicons name='remove' size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                      <Ionicons name='add' size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.subtotal}>{formatCurrency(item.subtotal)}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
                <Ionicons name='trash-outline' size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <View style={styles.checkoutBar}>
        <View>
          <Text style={styles.checkoutTotal}>{formatCurrency(cart.totalAmount + 99 + Math.round(cart.totalAmount * 0.18))}</Text>
          <Text style={styles.checkoutItems}>{cart.totalItems} items</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name='arrow-forward' size={18} color='#fff' />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.background },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.surface },
  emptySubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.borderLight },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.md },
  shopBtnText: { color: COLORS.textOnPrimary, fontWeight: FONT_WEIGHT.bold },
  listContent: { padding: SPACING.base, paddingBottom: 120 },
  cartItem: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm, overflow: 'hidden', ...SHADOW.sm },
  itemImage: { width: 100, height: 100, backgroundColor: COLORS.surfaceAlt },
  itemContent: { flex: 1, padding: SPACING.sm },
  itemBrand: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textTransform: 'uppercase' },
  itemName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text, lineHeight: 18, marginBottom: 4 },
  itemPrice: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 6 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.sm, overflow: 'hidden' },
  qBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceAlt },
  quantityText: { paddingHorizontal: 10, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  subtotal: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  removeBtn: { padding: SPACING.sm, justifyContent: 'flex-start' },
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, marginTop: SPACING.sm, ...SHADOW.sm },
  summaryTitle: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  summaryValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  totalLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  totalValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extraBold, color: COLORS.primary },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, padding: SPACING.base, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.lg },
  checkoutTotal: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  checkoutItems: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.full, ...SHADOW.md },
  checkoutBtnText: { color: COLORS.textOnPrimary, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
});
