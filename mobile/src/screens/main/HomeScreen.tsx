import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ImageBackground, Dimensions, RefreshControl, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/useAppStore';
import { productService } from '../../services/productService';
import { Product, ProductCategory } from '../../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW, formatCurrency } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ProductCard from '../../components/ProductCard';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'>;
};

const CATEGORIES: { slug: ProductCategory; name: string; icon: string; color: string }[] = [
  { slug: 'water-purifiers', name: 'Purifiers', icon: 'water', color: COLORS.accentDark },
  { slug: 'dispensers', name: 'Dispensers', icon: 'snow', color: COLORS.primary },
  { slug: 'pumps', name: 'Pumps', icon: 'settings', color: '#6997A2' },
  { slug: 'filters', name: 'Filters', icon: 'filter', color: '#27A98D' },
  { slug: 'spare-parts', name: 'Spares', icon: 'construct', color: '#F39C12' },
];

const BANNERS = [
  { id: '1', title: 'Pure Water\nfor Your Family', subtitle: 'Up to 30% off on RO Purifiers', gradient: [COLORS.accent, COLORS.primaryLight] as [string, string], icon: 'water' },
  { id: '2', title: 'Free Installation\nWith Every Order', subtitle: 'Professional installation service', gradient: [COLORS.primaryLight, COLORS.accent] as [string, string], icon: 'construct' },
  { id: '3', title: 'Dealer?\nGet Wholesale Prices', subtitle: 'Register for exclusive dealer pricing', gradient: ['#9CDEE5', '#77C9D7'] as [string, string], icon: 'business' },
];

export default function HomeScreen({ navigation }: Props) {
  const { user, isDealer, isDealerApproved, cart } = useAppStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);

  const loadData = async () => {
    try {
      const [featured, popular] = await Promise.all([
        productService.getFeaturedProducts(),
        productService.getProducts(undefined, 'popular', 1),
      ]);
      setFeaturedProducts(featured);
      setPopularProducts(popular.items.slice(0, 10));
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const displayName = user?.displayName?.split(' ')[0] ?? 'there';
  const isApprovedDealer = isDealer && isDealerApproved;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Header */}
      <LinearGradient colors={[COLORS.primaryDark, COLORS.secondary]} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName}! 👋</Text>
            <Text style={styles.headerSubtitle}>
              {isApprovedDealer ? '🏪 Dealer Account — Wholesale Pricing Active' : 'What do you need today?'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.getParent()?.navigate('SearchTab')}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <Text style={styles.searchPlaceholder}>Search water purifiers, filters...</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Hero Banner */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={styles.bannerScroll}
      >
        {BANNERS.map((banner) => (
          <LinearGradient key={banner.id} colors={banner.gradient} style={styles.bannerCard}>
            <Ionicons name={banner.icon as any} size={64} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('ProductList', { title: 'All Products' })}>
              <Text style={styles.bannerBtnText}>Shop Now</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.primaryDark} />
            </TouchableOpacity>
          </LinearGradient>
        ))}
      </ScrollView>
      {/* Banner dots */}
      <View style={styles.bannerDots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />
        ))}
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.slug}
              style={styles.categoryCard}
              onPress={() => navigation.navigate('ProductList', { category: cat.slug, title: cat.name })}
            >
              <View style={[styles.categoryIcon, { backgroundColor: cat.color + '18' }]}>
                <Ionicons name={cat.icon as any} size={28} color={cat.color} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Products</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList', { title: 'Featured', featured: true })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredProducts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productRow}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                isDealer={isApprovedDealer}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                style={{ width: 180, marginRight: SPACING.md }}
              />
            )}
          />
        </View>
      )}

      {/* Quick Service */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔧 Service & Support</Text>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServiceBooking')}>
          <LinearGradient colors={[COLORS.secondary, COLORS.primaryDark]} style={styles.serviceGradient}>
            <View>
              <Text style={styles.serviceTitle}>Book a Service</Text>
              <Text style={styles.serviceSubtitle}>Installation • Maintenance • Repair</Text>
            </View>
            <View style={styles.serviceIconBg}>
              <Ionicons name="construct" size={32} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Most Popular</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductList', { title: 'Popular', popular: true })}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {popularProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isDealer={isApprovedDealer}
              onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
              layout="horizontal"
              style={{ marginBottom: SPACING.sm }}
            />
          ))}
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.base },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  greeting: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: '#fff' },
  headerSubtitle: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  notifBtn: { padding: 8, position: 'relative' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.base, height: 44,
  },
  searchPlaceholder: { color: COLORS.textLight, fontSize: FONT_SIZE.sm },
  bannerScroll: { marginTop: SPACING.base },
  bannerCard: {
    width: width - 32, marginHorizontal: 16,
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl,
    minHeight: 160, justifyContent: 'center', overflow: 'hidden',
  },
  bannerIcon: { position: 'absolute', right: -10, top: -10 },
  bannerTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.extraBold, color: COLORS.text, marginBottom: 6, lineHeight: 30 },
  bannerSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.md },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.58)', alignSelf: 'flex-start', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.full },
  bannerBtnText: { color: COLORS.primaryDark, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semiBold },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: SPACING.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { width: 20, backgroundColor: COLORS.primary },
  section: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOW.sm,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  seeAll: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.semiBold },
  categoriesRow: { gap: SPACING.sm, paddingRight: SPACING.base },
  categoryCard: { alignItems: 'center', gap: 6, minWidth: 72 },
  categoryIcon: { width: 60, height: 60, borderRadius: BORDER_RADIUS.xl, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.textSecondary },
  productRow: { paddingRight: SPACING.base },
  serviceCard: { borderRadius: BORDER_RADIUS.xl, overflow: 'hidden', ...SHADOW.md },
  serviceGradient: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl },
  serviceTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: '#fff' },
  serviceSubtitle: { fontSize: FONT_SIZE.xs, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  serviceIconBg: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
