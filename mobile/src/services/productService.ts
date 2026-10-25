import {
  collection,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  Query,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { Product, ProductCategory, ProductFilters, ProductSortOption, PaginatedResult } from '../types';

const PAGE_SIZE = 20;
let dealerPriceCache: { uid: string; expiresAt: number; prices: Map<string, number> } | null = null;

function isOfflineReadError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'unavailable' || code === 'deadline-exceeded';
}

async function getFreshDocs(q: Query<DocumentData>): Promise<QuerySnapshot<DocumentData>> {
  try {
    return await getDocsFromServer(q);
  } catch (error) {
    if (!isOfflineReadError(error)) throw error;
    return getDocs(q);
  }
}

async function getFreshDoc(ref: DocumentReference<DocumentData>): Promise<DocumentSnapshot<DocumentData>> {
  try {
    return await getDocFromServer(ref);
  } catch (error) {
    if (!isOfflineReadError(error)) throw error;
    return getDoc(ref);
  }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const parsed = value.toDate();
    if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) return parsed;
  }
  // Stable fallback for legacy documents. Use the admin repair action to add
  // real Firestore timestamps so these products participate in ordered queries.
  return new Date(0);
}

function mapProduct(id: string, data: Record<string, unknown>, dealerPrice?: number): Product {
  return {
    id,
    name: data.name as string,
    category: data.category as ProductCategory,
    brand: data.brand as string,
    description: data.description as string,
    retailPrice: data.retailPrice as number,
    // Wholesale prices live in dealerPrices/{productId}; never expose them on public product documents.
    dealerPrice: dealerPrice ?? (data.retailPrice as number),
    stock: data.stock as number,
    rating: data.rating as number,
    reviewCount: data.reviewCount as number,
    images: (data.images as string[]) ?? [],
    tags: (data.tags as string[]) ?? [],
    specifications: (data.specifications as Record<string, string>) ?? {},
    isActive: data.isActive as boolean,
    isFeatured: data.isFeatured as boolean,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

async function attachDealerPrices<T extends Product>(products: T[]): Promise<T[]> {
  const user = auth.currentUser;
  if (!user || products.length === 0) return products;
  const now = Date.now();
  let cache = dealerPriceCache;
  if (!cache || cache.uid !== user.uid || cache.expiresAt <= now) {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const profile = userSnap.data();
    if (profile?.role !== 'dealer' || profile?.dealerStatus !== 'approved') {
      dealerPriceCache = { uid: user.uid, expiresAt: now + 30_000, prices: new Map() };
      return products;
    }
    const pricesSnap = await getDocs(query(collection(db, 'dealerPrices'), limit(500)));
    const prices = new Map(pricesSnap.docs.map((price) => [price.id, Number(price.data().price)]));
    cache = { uid: user.uid, expiresAt: now + 60_000, prices };
    dealerPriceCache = cache;
  }
  return products.map((product) => ({ ...product, dealerPrice: cache!.prices.get(product.id) ?? product.retailPrice }));
}

export const productService = {
  /**
   * Get all products with optional filters
   */
  async getProducts(
    filters?: ProductFilters,
    sort: ProductSortOption = 'newest',
    page = 1,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginatedResult<Product>> {
    const constraints: QueryConstraint[] = [where('isActive', '==', true)];

    if (filters?.category) {
      constraints.push(where('category', '==', filters.category));
    }

    if (filters?.isFeatured !== undefined) {
      constraints.push(where('isFeatured', '==', filters.isFeatured));
    }

    if (filters?.inStock) {
      constraints.push(where('stock', '>', 0));
    }

    const newestSort = sort === 'newest';

    // Newest results are sorted locally so legacy documents without createdAt
    // are still visible. This catalogue currently contains fewer than 500 items;
    // backfill timestamps with the admin repair action before it grows beyond that.
    switch (sort) {
      case 'newest':
        break;
      case 'price-asc':
        constraints.push(orderBy('retailPrice', 'asc'));
        break;
      case 'price-desc':
        constraints.push(orderBy('retailPrice', 'desc'));
        break;
      case 'rating':
        constraints.push(orderBy('rating', 'desc'));
        break;
      case 'popular':
        constraints.push(orderBy('reviewCount', 'desc'));
        break;
      default:
        break;
    }

    constraints.push(limit(newestSort ? 500 : PAGE_SIZE + 1));

    if (lastDoc && !newestSort) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, 'products'), ...constraints);
    const snap = await getFreshDocs(q);

    let items = await attachDealerPrices(snap.docs.map((d) => mapProduct(d.id, d.data())));
    let hasMore = snap.docs.length > PAGE_SIZE;

    if (newestSort) {
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name));
    } else {
      items = items.slice(0, PAGE_SIZE);
    }

    // Client-side price filtering (Firestore doesn't support range on non-indexed fields easily)
    const filtered = items.filter((p) => {
      if (filters?.minPrice && p.retailPrice < filters.minPrice) return false;
      if (filters?.maxPrice && p.retailPrice > filters.maxPrice) return false;
      if (filters?.brands && filters.brands.length > 0 && !filters.brands.includes(p.brand)) return false;
      if (filters?.rating && p.rating < filters.rating) return false;
      return true;
    });

    if (newestSort) {
      const start = (page - 1) * PAGE_SIZE;
      hasMore = start + PAGE_SIZE < filtered.length;
      return {
        items: filtered.slice(start, start + PAGE_SIZE),
        total: filtered.length,
        page,
        pageSize: PAGE_SIZE,
        hasMore,
      };
    }

    return {
      items: filtered,
      total: filtered.length,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
      cursor: hasMore ? snap.docs[PAGE_SIZE - 1] : undefined,
    };
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      where('isFeatured', '==', true),
      limit(10)
    );
    const snap = await getFreshDocs(q);
    return attachDealerPrices(snap.docs.map((d) => mapProduct(d.id, d.data())));
  },

  /**
   * Get single product
   */
  async getProduct(id: string): Promise<Product | null> {
    const snap = await getFreshDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    const [product] = await attachDealerPrices([mapProduct(snap.id, snap.data() as Record<string, unknown>)]);
    return product;
  },

  /**
   * Search products by name or brand
   */
  async searchProducts(searchTerm: string, isDealer = false): Promise<Product[]> {
    // Firestore doesn't support full-text search natively
    // We fetch all active products and filter client-side (acceptable for <=500 products)
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      orderBy('name'),
      limit(200)
    );
    const snap = await getFreshDocs(q);
    const term = searchTerm.toLowerCase();
    const products = await attachDealerPrices(snap.docs.map((d) => mapProduct(d.id, d.data())));
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    const q = query(
      collection(db, 'products'),
      where('isActive', '==', true),
      where('category', '==', category),
      orderBy('rating', 'desc'),
      limit(50)
    );
    const snap = await getFreshDocs(q);
    return attachDealerPrices(snap.docs.map((d) => mapProduct(d.id, d.data())));
  },

  /**
   * Get price for user role
   */
  getPrice(product: Product, isDealer: boolean): number {
    return isDealer ? product.dealerPrice : product.retailPrice;
  },

  /**
   * Get unique brands from products
   */
  async getBrands(): Promise<string[]> {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const snap = await getDocs(q);
    const brands = new Set(snap.docs.map((d) => d.data().brand as string));
    return Array.from(brands).sort();
  },
};
