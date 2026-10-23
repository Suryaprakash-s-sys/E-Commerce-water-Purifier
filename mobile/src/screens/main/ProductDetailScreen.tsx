import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { productService } from '../../services/productService';
import { useAppStore } from '../../store/useAppStore';
import { Product } from '../../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>;
  route: RouteProp<HomeStackParamList, 'ProductDetail'>;
};

const FALLBACK_IMAGES: Record<string, string> = {
  'water-purifiers': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  'dispensers': 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=400&fit=crop',
  'pumps': 'https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?w=600&h=400&fit=crop',
  'filters': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=400&fit=crop',
  'spare-parts': 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&h=400&fit=crop',
};

export default function ProductDetailScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const { isDealer, isDealerApproved, addToCart } = useAppStore();
  const isApprovedDealer = isDealer && isDealerApproved;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');

  useEffect(() => {
    productService.getProduct(productId).then((p) => {
      setProduct(p);
      setIsLoading(false);
    });
  }, [productId]);

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size='large' color={COLORS.primary} /></View>;
  }

  if (!product) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const displayPrice = isApprovedDealer ? product.dealerPrice : product.retailPrice;
  const originalPrice = product.retailPrice;
  const discount = isApprovedDealer ? Math.round(((originalPrice - product.dealerPrice) / originalPrice) * 100) : 0;

  const imageUrl = product.images?.[0] && !product.images[0].includes('demo')
    ? product.images[0]
    : FALLBACK_IMAGES[product.category] ?? FALLBACK_IMAGES['water-purifiers'];

  const handleAddToCart = async () => {
    if (product.stock === 0) { Alert.alert('Out of Stock', 'This product is currently unavailable.'); return; }
    setAddingToCart(true);
    try {
      await addToCart(product, quantity);
      Alert.alert('Added to Cart', `${product.name} x${quantity} added to your cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => navigation.getParent()?.navigate('CartTab') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode='cover' />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name='arrow-back' size={22} color={COLORS.text} />
          </TouchableOpacity>
          {product.isFeatured && (
            <View style={styles.featuredBadge}><Text style={styles.featuredText}>⭐ Featured</Text></View>
          )}
          {isApprovedDealer && discount > 0 && (
            <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}% Dealer Discount</Text></View>
          )}
        </View>

        <View style={styles.content}>
          {/* Brand and Name */}
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map((s) => (
              <Ionicons key={s} name={product.rating >= s ? 'star' : product.rating >= s - 0.5 ? 'star-half' : 'star-outline'} size={16} color='#F39C12' />
            ))}
            <Text style={styles.ratingText}>{product.rating} ({product.reviewCount} reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>{formatCurrency(displayPrice)}</Text>
            {isApprovedDealer && (
              <View>
                <Text style={styles.originalPrice}>MRP: {formatCurrency(originalPrice)}</Text>
                <Text style={styles.dealerSavings}>Dealer saves: {formatCurrency(originalPrice - product.dealerPrice)}</Text>
              </View>
            )}
          </View>

          {isApprovedDealer && (
            <View style={styles.dealerNote}>
              <Ionicons name='business-outline' size={14} color={COLORS.warning} />
              <Text style={styles.dealerNoteText}>Dealer price applied. Minimum order qty: 1</Text>
            </View>
          )}

          {/* Stock */}
          <Text style={[styles.stockStatus, { color: product.stock > 0 ? COLORS.success : COLORS.error }]}>
            {product.stock > 10 ? '✓ In Stock' : product.stock > 0 ? `Only ${product.stock} left!` : '✗ Out of Stock'}
          </Text>

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                <Ionicons name='remove' size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity style={styles.qBtn} onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                <Ionicons name='add' size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
            {product.tags.map((tag) => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'desc' && styles.tabActive]} onPress={() => setActiveTab('desc')}>
              <Text style={[styles.tabText, activeTab === 'desc' && styles.tabTextActive]}>Description</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'specs' && styles.tabActive]} onPress={() => setActiveTab('specs')}>
              <Text style={[styles.tabText, activeTab === 'specs' && styles.tabTextActive]}>Specifications</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'desc' ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <View style={styles.specsTable}>
              {Object.entries(product.specifications).map(([key, value], i) => (
                <View key={key} style={[styles.specRow, i % 2 === 0 && styles.specRowAlt]}>
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Total</Text>
          <Text style={styles.bottomPriceValue}>{formatCurrency(displayPrice * quantity)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, (product.stock === 0 || addingToCart) && styles.btnDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
        >
          {addingToCart ? <ActivityIndicator color='#fff' /> : (
            <><Ionicons name='cart' size={20} color='#fff' />
            <Text style={styles.addToCartText}>Add to Cart</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.textMuted, fontSize: FONT_SIZE.base },
  imageSection: { position: 'relative', backgroundColor: '#fff' },
  productImage: { width: width, height: 300 },
  backBtn: { position: 'absolute', top: 44, left: 16, backgroundColor: '#fff', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  featuredBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#F39C12', borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  featuredText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  discountBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: COLORS.error, borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  discountText: { color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  content: { padding: SPACING.base, backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, marginTop: -16 },
  brand: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  productName: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, lineHeight: 28, marginBottom: SPACING.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  ratingText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginLeft: 4 },
  priceSection: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.sm },
  price: { fontSize: 28, fontWeight: FONT_WEIGHT.extraBold, color: COLORS.primary },
  originalPrice: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  dealerSavings: { fontSize: FONT_SIZE.sm, color: COLORS.success, fontWeight: FONT_WEIGHT.semiBold },
  dealerNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF9E7', padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.sm },
  dealerNoteText: { fontSize: FONT_SIZE.xs, color: COLORS.warning },
  stockStatus: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, marginBottom: SPACING.md },
  quantitySection: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  quantityLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  qBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceAlt },
  quantityText: { paddingHorizontal: SPACING.lg, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  tagsRow: { marginBottom: SPACING.md },
  tag: { backgroundColor: COLORS.primary + '15', borderRadius: BORDER_RADIUS.full, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  tagText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold },
  tabs: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: COLORS.border, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary, marginBottom: -2 },
  tabText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  description: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 22 },
  specsTable: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  specRow: { flexDirection: 'row', padding: SPACING.sm },
  specRowAlt: { backgroundColor: COLORS.surfaceAlt },
  specKey: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary },
  specValue: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.text },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.base, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.border, ...SHADOW.lg },
  bottomPrice: { flex: 1 },
  bottomPriceLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  bottomPriceValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  addToCartBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, height: 52, borderRadius: BORDER_RADIUS.full, ...SHADOW.md },
  btnDisabled: { opacity: 0.6 },
  addToCartText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
