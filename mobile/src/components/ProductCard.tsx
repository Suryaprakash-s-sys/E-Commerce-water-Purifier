import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle,
} from 'react-native';
import { Product } from '../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

// Cloudinary placeholder images for water products
const FALLBACK_IMAGES: Record<string, string> = {
  'water-purifiers': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
  'dispensers': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop',
  'pumps': 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=400&h=400&fit=crop',
  'filters': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop',
  'spare-parts': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=400&fit=crop',
};

interface ProductCardProps {
  product: Product;
  isDealer?: boolean;
  onPress: () => void;
  onAddToCart?: () => void;
  style?: ViewStyle;
  layout?: 'vertical' | 'horizontal';
}

export default function ProductCard({
  product,
  isDealer = false,
  onPress,
  onAddToCart,
  style,
  layout = 'vertical',
}: ProductCardProps) {
  const displayPrice = isDealer ? product.dealerPrice : product.retailPrice;
  const originalPrice = product.retailPrice;
  const discount = isDealer
    ? Math.round(((originalPrice - product.dealerPrice) / originalPrice) * 100)
    : 0;

  const imageUrl =
    product.images?.[0] && !product.images[0].includes('demo')
      ? product.images[0]
      : FALLBACK_IMAGES[product.category] ?? FALLBACK_IMAGES['water-purifiers'];

  if (layout === 'horizontal') {
    return (
      <TouchableOpacity style={[styles.hCard, style, SHADOW.sm]} onPress={onPress} activeOpacity={0.8}>
        <Image source={{ uri: imageUrl }} style={styles.hImage} resizeMode="cover" />
        <View style={styles.hContent}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.hName} numberOfLines={2}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F39C12" />
            <Text style={styles.rating}>{product.rating}</Text>
            <Text style={styles.reviewCount}>({product.reviewCount})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
            {isDealer && discount > 0 && (
              <View style={styles.dealerBadge}>
                <Text style={styles.dealerBadgeText}>{discount}% OFF</Text>
              </View>
            )}
          </View>
          {product.stock <= 5 && product.stock > 0 && (
            <Text style={styles.lowStock}>Only {product.stock} left!</Text>
          )}
        </View>
        {onAddToCart && (
          <TouchableOpacity style={styles.hCartBtn} onPress={onAddToCart}>
            <Ionicons name="add" size={20} color={COLORS.textOnPrimary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.vCard, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.vImage} resizeMode="cover" />
        {isDealer && discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
        {product.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.vContent}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.vName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11} color="#F39C12" />
          <Text style={styles.rating}>{product.rating}</Text>
          <Text style={styles.reviewCount}>({product.reviewCount})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
          {isDealer && <Text style={styles.originalPrice}>{formatCurrency(originalPrice)}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Vertical Card
  vCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  imageContainer: { position: 'relative' },
  vImage: { width: '100%', height: 140, backgroundColor: COLORS.surfaceAlt },
  discountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: COLORS.error, borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: FONT_WEIGHT.bold },
  featuredBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#F39C12', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  vContent: { padding: SPACING.sm },
  vName: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text, lineHeight: 16, marginBottom: 4 },

  // Horizontal Card
  hCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg, overflow: 'hidden',
  },
  hImage: { width: 100, height: 100, backgroundColor: COLORS.surfaceAlt },
  hContent: { flex: 1, padding: SPACING.sm, justifyContent: 'center' },
  hName: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text, lineHeight: 18, marginBottom: 4 },
  hCartBtn: {
    backgroundColor: COLORS.primary, width: 36,
    alignItems: 'center', justifyContent: 'center',
  },

  // Shared
  brand: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
  rating: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  reviewCount: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  price: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  originalPrice: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  dealerBadge: { backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 6, paddingVertical: 2 },
  dealerBadgeText: { color: '#fff', fontSize: 10, fontWeight: FONT_WEIGHT.bold },
  lowStock: { fontSize: FONT_SIZE.xs, color: COLORS.error, marginTop: 2 },
});
