import { useAppTheme } from '../../context/ThemeContext';
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { productService } from '../../services/productService';
import { useAppStore } from '../../store/useAppStore';
import { Product } from '../../types';
import { COLORS, FONTS, FONT_SIZE, FONT_WEIGHT, SPACING, BORDER_RADIUS, SHADOW } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../../components/ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const POPULAR_SEARCHES = ['RO Purifier', 'UV Purifier', 'Filter Cartridge', 'Water Dispenser', 'Booster Pump', 'TDS Meter'];

export default function SearchScreen() {
  const styles = createStyles();
  const { isDark } = useAppTheme();
  void isDark;


  const navigation = useNavigation<any>();
  const { width: screenWidth } = useWindowDimensions();
  const productCardWidth = screenWidth - SPACING.base * 2;
  const insets = useSafeAreaInsets();
  const { isDealer, isDealerApproved } = useAppStore();
  const isApprovedDealer = isDealer && isDealerApproved;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) { setResults([]); setHasSearched(false); return; }
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await productService.searchProducts(term);
      setResults(res);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name='search-outline' size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder='Search products, brands...'
            placeholderTextColor={COLORS.textLight}
            value={query}
            onChangeText={(t) => { setQuery(t); if (t.length > 2) doSearch(t); }}
            onSubmitEditing={() => doSearch(query)}
            returnKeyType='search'
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}>
              <Ionicons name='close-circle' size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!hasSearched && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.chips}>
            {POPULAR_SEARCHES.map((s) => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => { setQuery(s); doSearch(s); }}>
                <Ionicons name='trending-up-outline' size={14} color={COLORS.primary} />
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isLoading && <View style={styles.loading}><ActivityIndicator size='large' color={COLORS.primary} /></View>}

      {hasSearched && !isLoading && results.length === 0 && (
        <View style={styles.noResults}>
          <Ionicons name='search-outline' size={56} color={COLORS.textLight} />
          <Text style={styles.noResultsText}>No results for "{query}"</Text>
          <Text style={styles.noResultsSub}>Try a different search term</Text>
        </View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isDealer={isApprovedDealer}
              onPress={() => navigation.navigate('HomeTab', { screen: 'ProductDetail', params: { productId: item.id } })}
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
  searchBarContainer: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.base, paddingBottom: SPACING.base, paddingTop: SPACING.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderWidth: 0, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.base, height: 52, ...SHADOW.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.text },
  suggestionsSection: { padding: SPACING.base },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.text, marginBottom: SPACING.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.full, paddingHorizontal: 14, paddingVertical: 10, ...SHADOW.sm },
  chipText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noResults: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.sm },
  noResultsText: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semiBold, color: COLORS.text },
  noResultsSub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  listContent: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.xl },

  });
  return styles;
}
