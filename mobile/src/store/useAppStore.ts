import { create } from 'zustand';
import { User, DealerProfile, Cart, CartItem, Product, Notification } from '../types';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | DealerProfile | null;
  firebaseUser: import('firebase/auth').User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDealer: boolean;
  isAdmin: boolean;
  isDealerApproved: boolean;
}

interface CartState {
  cart: Cart;
  isCartLoading: boolean;
}

interface UIState {
  notifications: Notification[];
  unreadCount: number;
}

interface AppStore extends AuthState, CartState, UIState {
  // Auth actions
  initAuth: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  // Cart actions
  loadCart: (userId: string) => Promise<void>;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Notification actions
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial auth state
  user: null,
  firebaseUser: null,
  isLoading: true,
  isAuthenticated: false,
  isDealer: false,
  isAdmin: false,
  isDealerApproved: false,

  // Initial cart state
  cart: { userId: '', items: [], totalItems: 0, totalAmount: 0, updatedAt: new Date() },
  isCartLoading: false,

  // Initial UI state
  notifications: [],
  unreadCount: 0,

  // --- Auth ---
  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.getUserProfile(firebaseUser.uid);
          const isDealer = profile?.role === 'dealer';
          const isAdmin = profile?.role === 'admin';
          const isDealerApproved =
            isDealer && (profile as DealerProfile)?.dealerStatus === 'approved';

          set({
            firebaseUser,
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            isDealer,
            isAdmin,
            isDealerApproved,
          });

          // Load cart
          await get().loadCart(firebaseUser.uid);
        } catch (err) {
          console.error('Error loading user profile:', err);
          set({ isLoading: false, isAuthenticated: false });
        }
      } else {
        set({
          firebaseUser: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isDealer: false,
          isAdmin: false,
          isDealerApproved: false,
          cart: { userId: '', items: [], totalItems: 0, totalAmount: 0, updatedAt: new Date() },
        });
      }
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    const { user: fbUser } = await authService.signIn(email, password);
    const profile = await authService.getUserProfile(fbUser.uid);
    const isDealer = profile?.role === 'dealer';
    const isDealerApproved =
      isDealer && (profile as DealerProfile)?.dealerStatus === 'approved';

    set({
      firebaseUser: fbUser,
      user: profile,
      isAuthenticated: true,
      isDealer,
      isAdmin: profile?.role === 'admin',
      isDealerApproved,
    });

    await get().loadCart(fbUser.uid);
  },

  signOut: async () => {
    await authService.signOut();
    set({
      user: null,
      firebaseUser: null,
      isAuthenticated: false,
      isDealer: false,
      isAdmin: false,
      isDealerApproved: false,
      cart: { userId: '', items: [], totalItems: 0, totalAmount: 0, updatedAt: new Date() },
    });
  },

  refreshProfile: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    const profile = await authService.getUserProfile(firebaseUser.uid);
    const isDealer = profile?.role === 'dealer';
    const isDealerApproved =
      isDealer && (profile as DealerProfile)?.dealerStatus === 'approved';
    set({ user: profile, isDealer, isDealerApproved });
  },

  // --- Cart ---
  loadCart: async (userId) => {
    set({ isCartLoading: true });
    try {
      const cart = await cartService.getCart(userId);
      set({ cart });
    } catch (err) {
      console.error('Error loading cart:', err);
    } finally {
      set({ isCartLoading: false });
    }
  },

  addToCart: async (product, quantity) => {
    const { user, cart, isDealer, isDealerApproved } = get();
    if (!user) throw new Error('Please sign in to add items to cart');

    const effectiveIsDealer = isDealer && isDealerApproved;
    const updatedCart = await cartService.addToCart(
      user.uid,
      product,
      quantity,
      effectiveIsDealer,
      cart.items
    );
    set({ cart: updatedCart });
  },

  updateQuantity: async (productId, quantity) => {
    const { user, cart } = get();
    if (!user) return;
    const updatedCart = await cartService.updateQuantity(user.uid, productId, quantity, cart.items);
    set({ cart: updatedCart });
  },

  removeFromCart: async (productId) => {
    const { user, cart } = get();
    if (!user) return;
    const updatedCart = await cartService.removeFromCart(user.uid, productId, cart.items);
    set({ cart: updatedCart });
  },

  clearCart: async () => {
    const { user } = get();
    if (!user) return;
    await cartService.clearCart(user.uid);
    set({
      cart: { userId: user.uid, items: [], totalItems: 0, totalAmount: 0, updatedAt: new Date() },
    });
  },

  // --- Notifications ---
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount });
  },

  markNotificationRead: (id) => {
    const { notifications } = get();
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    set({ notifications: updated, unreadCount: updated.filter((n) => !n.isRead).length });
  },
}));
