import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { orderService } from '../../services/orderService';
import { useAppStore } from '../../store/useAppStore';
import { Order } from '../../types';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency, formatDate, STATUS_COLORS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const { user, isAuthenticated } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      orderService.getUserOrders(user.uid).then((o) => {
        setOrders(o);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (!isAuthenticated) {
    return <View style={styles.center}><Text style={styles.mutedText}>Please sign in to view orders</Text></View>;
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size='large' color={COLORS.primary} /></View>;
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name='receipt-outline' size={64} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>No Orders Yet</Text>
        <Text style={styles.mutedText}>Your order history will appear here</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={styles.shopBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: order }) => (
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'OrderDetail', params: { orderId: order.id } })}
        >
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>{formatDate(order.placedAt)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20' }]}>
              <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.orderItems}>
            {order.items.slice(0, 2).map((item) => (
              <Text key={item.productId} style={styles.itemText} numberOfLines={1}>
                {item.quantity}x {item.productName}
              </Text>
            ))}
            {order.items.length > 2 && (
              <Text style={styles.moreItems}>+{order.items.length - 2} more items</Text>
            )}
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>{formatCurrency(order.totalAmount)}</Text>
            <View style={styles.chevron}>
              <Text style={styles.viewDetails}>View Details</Text>
              <Ionicons name='chevron-forward' size={14} color={COLORS.primary} />
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.background },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  mutedText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  shopBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, marginTop: SPACING.sm },
  shopBtnText: { color: COLORS.textOnPrimary, fontWeight: FONT_WEIGHT.bold },
  listContent: { padding: SPACING.base },
  orderCard: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.sm, ...SHADOW.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  orderNumber: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.text },
  orderDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  orderItems: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: SPACING.sm, marginBottom: SPACING.sm },
  itemText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: 2 },
  moreItems: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontStyle: 'italic' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  chevron: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetails: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold },
});
