import { useAppTheme } from '../../context/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/useAppStore';
import { productService } from '../../services/productService';
import { Product, ProductCategory } from '../../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const width = Dimensions.get('window').width;
type Props = { navigation: NativeStackNavigationProp<HomeStackParamList, 'Home'> };
const CATEGORIES: { slug: ProductCategory; name: string; icon: string }[] = [
  { slug: 'water-purifiers', name: 'Purifiers', icon: 'water-outline' },
  { slug: 'dispensers', name: 'Dispensers', icon: 'water' },
  { slug: 'pumps', name: 'Pumps', icon: 'settings-outline' },
  { slug: 'filters', name: 'Filters', icon: 'options-outline' },
  { slug: 'spare-parts', name: 'Spares', icon: 'construct-outline' },
];
const BANNERS = [
  { id: '1', title: 'A clearer kind\nof everyday.', subtitle: 'Explore purifiers for your home', icon: 'water-outline', eyebrow: 'PURE WATER, SIMPLIFIED' },
  { id: '2', title: 'Care that comes\nto your door.', subtitle: 'Book installation and service', icon: 'construct-outline', eyebrow: 'CALIFNCO SERVICE' },
  { id: '3', title: 'Better value for\nyour business.', subtitle: 'Discover dealer pricing', icon: 'storefront-outline', eyebrow: 'FOR OUR DEALERS' },
];

export default function HomeScreen({
 navigation }: Props) {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;

  const insets = useSafeAreaInsets();
  const { user, isDealer, isDealerApproved } = useAppStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeBanner, setActiveBanner] = useState(0);
  const loadData = async () => {
    try {
      const [featured, popular] = await Promise.all([productService.getFeaturedProducts(), productService.getProducts(undefined, 'popular', 1)]);
      setFeaturedProducts(featured);
      setPopularProducts(popular.items.slice(0, 10));
    } catch (err) { console.error('Error loading home data:', err); }
    finally { setIsLoading(false); setRefreshing(false); }
  };
  useEffect(() => { loadData(); }, []);
  const isApprovedDealer = isDealer && isDealerApproved;
  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
          <Text style={styles.avatarText}>{(user?.displayName?.[0] || 'C').toUpperCase()}</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>CALIFNCO</Text>
          <Text style={styles.welcome}>Welcome, {user?.displayName?.split(' ')[0] || 'there'}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={21} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      {isApprovedDealer && <Text style={styles.dealerNote}>Dealer pricing is active on your account</Text>}
      <TouchableOpacity style={styles.searchBar} onPress={() => navigation.getParent()?.navigate('SearchTab')}>
        <Ionicons name="search-outline" size={20} color={COLORS.text} />
        <Text style={styles.searchPlaceholder}>Search purifiers, filters...</Text>
        <Ionicons name="options-outline" size={19} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {BANNERS.map((banner, index) => (
          <View key={banner.id} style={[styles.bannerCard, { backgroundColor: index === 1 ? '#24272A' : '#151619' }]}>
            <View style={styles.bannerText}>
              <Text style={styles.bannerEyebrow}>{banner.eyebrow}</Text>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => index === 1 ? navigation.navigate('ServiceBooking') : navigation.navigate('ProductList', { title: 'All Products' })}>
                <Text style={styles.bannerBtnText}>{index === 1 ? 'Book a service' : 'Shop now'}</Text>
                <Ionicons name="arrow-forward" size={15} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.bannerArt}><Ionicons name={banner.icon as any} size={58} color={COLORS.accent} /></View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.bannerDots}>{BANNERS.map((_, i) => <View key={i} style={[styles.dot, i === activeBanner && styles.dotActive]} />)}</View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Categories</Text><TouchableOpacity onPress={() => navigation.navigate('ProductList', { title: 'All Products' })}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {CATEGORIES.map((cat, index) => <TouchableOpacity key={cat.slug} style={[styles.categoryPill, index === 0 && styles.categoryPillActive]} onPress={() => navigation.navigate('ProductList', { category: cat.slug, title: cat.name })}>
            <Ionicons name={cat.icon as any} size={17} color={index === 0 ? '#fff' : COLORS.text} /><Text style={[styles.categoryName, index === 0 && styles.categoryNameActive]}>{cat.name}</Text>
          </TouchableOpacity>)}
        </ScrollView>
      </View>

      {featuredProducts.length > 0 && <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Featured products</Text><TouchableOpacity onPress={() => navigation.navigate('ProductList', { title: 'Featured', featured: true })}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
        <FlatList data={featuredProducts} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}
          renderItem={({ item }) => <ProductCard product={item} isDealer={isApprovedDealer} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} style={{ width: 180, marginRight: SPACING.md }} />} />
      </View>}

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Service & support</Text><Text style={styles.supportCaption}>Here when you need us</Text></View>
        <TouchableOpacity style={styles.serviceCard} onPress={() => navigation.navigate('ServiceBooking')}>
          <View style={styles.serviceIcon}><Ionicons name="construct-outline" size={24} color={COLORS.primary} /></View>
          <View style={styles.serviceCopy}><Text style={styles.serviceTitle}>Book a service</Text><Text style={styles.serviceSubtitle}>Installation · Maintenance · Repair</Text></View>
          <View style={styles.serviceArrow}><Ionicons name="arrow-forward" size={17} color="#fff" /></View>
        </TouchableOpacity>
      </View>

      {popularProducts.length > 0 && <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Popular right now</Text><TouchableOpacity onPress={() => navigation.navigate('ProductList', { title: 'Popular', popular: true })}><Text style={styles.seeAll}>See all</Text></TouchableOpacity></View>
        {popularProducts.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} isDealer={isApprovedDealer} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} layout="horizontal" style={{ marginBottom: SPACING.sm }} />)}
      </View>}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function createStyles() {
  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, content: { paddingTop: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingBottom: SPACING.md, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D9F2F5' },
  avatarText: { fontFamily: FONTS.heading, fontSize: 21, color: COLORS.primary }, headerCopy: { flex: 1 },
  eyebrow: { fontSize: 9, letterSpacing: 1.5, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold },
  welcome: { fontSize: FONT_SIZE.base, color: COLORS.text, fontWeight: FONT_WEIGHT.semiBold, marginTop: 2 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOW.sm },
  dealerNote: { marginHorizontal: SPACING.base, marginBottom: SPACING.sm, color: COLORS.accentDark, fontSize: FONT_SIZE.xs },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: SPACING.base, marginBottom: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 18, height: 52, ...SHADOW.sm },
  searchPlaceholder: { flex: 1, color: COLORS.textMuted, fontSize: FONT_SIZE.sm },
  bannerCard: { width: width - 32, minHeight: 206, marginHorizontal: 16, borderRadius: 26, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  bannerText: { flex: 1, zIndex: 1 }, bannerEyebrow: { fontSize: 9, letterSpacing: 1.5, color: COLORS.accent, fontWeight: FONT_WEIGHT.bold, marginBottom: 8 },
  bannerTitle: { fontFamily: FONTS.heading, fontSize: 28, color: '#fff', lineHeight: 33 },
  bannerSubtitle: { color: '#D2D2D7', fontSize: FONT_SIZE.xs, marginTop: 6, marginBottom: 14 },
  bannerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 15, paddingVertical: 9, borderRadius: BORDER_RADIUS.full },
  bannerBtnText: { color: COLORS.text, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
  bannerArt: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(138,219,229,0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border }, dotActive: { width: 19, backgroundColor: COLORS.primary },
  section: { marginTop: 24 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.base, marginBottom: 13 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 21, color: COLORS.text }, seeAll: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary }, supportCaption: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  categoriesRow: { gap: 8, paddingHorizontal: SPACING.base }, categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 11, borderRadius: BORDER_RADIUS.full },
  categoryPillActive: { backgroundColor: COLORS.primary }, categoryName: { fontSize: FONT_SIZE.xs, color: COLORS.text, fontWeight: FONT_WEIGHT.semiBold }, categoryNameActive: { color: '#fff' },
  productRow: { paddingHorizontal: SPACING.base }, serviceCard: { marginHorizontal: SPACING.base, padding: 15, borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', ...SHADOW.sm },
  serviceIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#DFF4F6', alignItems: 'center', justifyContent: 'center' }, serviceCopy: { flex: 1, marginLeft: 12 },
  serviceTitle: { color: COLORS.text, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold }, serviceSubtitle: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  serviceArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  });
  return styles;
}
