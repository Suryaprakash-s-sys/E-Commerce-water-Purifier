import { useAppTheme } from '../../context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { DocumentSnapshot } from 'firebase/firestore';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { productService } from '../../services/productService';
import { useAppStore } from '../../store/useAppStore';
import { Product, ProductCategory, ProductSortOption, ProductFilters } from '../../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'ProductList'>;
  route: RouteProp<HomeStackParamList, 'ProductList'>;
};

const SORT_OPTIONS: { label: string; value: ProductSortOption }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

export default function ProductListScreen({
 navigation, route }: Props) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const { width: screenWidth } = useWindowDimensions();
  const productCardWidth = screenWidth - SPACING.base * 2;
  const { isDealer, isDealerApproved } = useAppStore();
  const { category, title } = route.params ?? {};
  const featuredOnly = route.params?.featured ?? title?.toLowerCase() === 'featured';
  const popularOnly = route.params?.popular ?? title?.toLowerCase() === 'popular';
  const isApprovedDealer = isDealer && isDealerApproved;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<ProductSortOption>(popularOnly ? 'popular' : 'newest');
  const [showSort, setShowSort] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<DocumentSnapshot | undefined>();
  const [page, setPage] = useState(1);

  const { addToCart } = useAppStore();

  const loadProducts = useCallback(async (reset = true) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const filters: ProductFilters = {
        ...(category ? { category: category as ProductCategory } : {}),
        ...(featuredOnly ? { isFeatured: true } : {}),
      };
      const requestedPage = reset ? 1 : page + 1;
      const result = await productService.getProducts(filters, sort, requestedPage, reset ? undefined : cursor);
      if (reset) { setProducts(result.items); setCursor(result.cursor as DocumentSnapshot | undefined); setPage(1); }
      else { setProducts((prev) => [...prev, ...result.items]); setPage(requestedPage); }
      if (!reset) setCursor(result.cursor as DocumentSnapshot | undefined);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [category, cursor, featuredOnly, page, sort]);

  useEffect(() => {
    navigation.setOptions({ title: title ?? 'Products' });
    setCursor(undefined);
    loadProducts(true);
  }, [sort, category, featuredOnly]);

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.resultCount}>{products.length} products</Text>
        <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
          <Ionicons name='funnel-outline' size={16} color={COLORS.text} />
          <Text style={styles.sortBtnText}>{SORT_OPTIONS.find((s) => s.value === sort)?.label}</Text>
          <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortOption, sort === opt.value && styles.sortOptionActive]}
              onPress={() => { setSort(opt.value); setShowSort(false); }}
            >
              <Text style={[styles.sortOptionText, sort === opt.value && styles.sortOptionTextActive]}>
                {opt.label}
              </Text>
              {sort === opt.value && <Ionicons name='checkmark' size={16} color={COLORS.text} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loading}><ActivityIndicator size='large' color={COLORS.primary} /></View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name='cube-outline' size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => hasMore && !isLoadingMore && loadProducts(false)}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color={COLORS.primary} style={{ margin: 20 }} /> : undefined}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isDealer={isApprovedDealer}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              onAddToCart={() => handleAddToCart(item)}
              style={{ width: productCardWidth, marginBottom: SPACING.md }}
            />
          )}
        />
      )}
    </View>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  sortBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  resultCount: { fontFamily: FONTS.regular, fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BORDER_RADIUS.full },
  sortBtnText: { fontFamily: FONTS.medium, fontSize: FONT_SIZE.sm, color: COLORS.text, fontWeight: FONT_WEIGHT.semiBold },
  sortDropdown: { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, ...SHADOW.md },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  sortOptionActive: { backgroundColor: COLORS.primary + '10' },
  sortOptionText: { fontFamily: FONTS.regular, fontSize: FONT_SIZE.sm, color: COLORS.text },
  sortOptionTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  emptyText: { fontFamily: FONTS.regular, fontSize: FONT_SIZE.base, color: COLORS.textSecondary },
  listContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.xl },

  });
  return styles;
}
