import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Cart, CartItem, Product } from '../types';

export const cartService = {
  /**
   * Get cart for user
   */
  async getCart(userId: string): Promise<Cart> {
    const snap = await getDocFromServer(doc(db, 'carts', userId)).catch((error: { code?: string }) => {
      if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
        return getDoc(doc(db, 'carts', userId));
      }
      throw error;
    });
    if (!snap.exists()) {
      return { userId, items: [], totalItems: 0, totalAmount: 0, updatedAt: new Date() };
    }
    const data = snap.data();
    const items = await Promise.all(((data.items ?? []) as CartItem[]).map(async (item) => {
      try {
        const productSnap = await getDocFromServer(doc(db, 'products', item.productId));
        if (!productSnap.exists()) return item;
        const productData = productSnap.data();
        const updatedAtValue = productData.updatedAt;
        const updatedAt = updatedAtValue && typeof updatedAtValue.toDate === 'function'
          ? updatedAtValue.toDate()
          : item.product.updatedAt;
        return {
          ...item,
          product: {
            ...item.product,
            images: Array.isArray(productData.images) ? productData.images as string[] : item.product.images,
            updatedAt,
          },
        };
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code !== 'unavailable' && code !== 'deadline-exceeded') throw error;
        return item;
      }
    }));
    return {
      userId,
      items,
      totalItems: data.totalItems ?? 0,
      totalAmount: data.totalAmount ?? 0,
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    };
  },

  /**
   * Add or update item in cart
   */
  async addToCart(
    userId: string,
    product: Product,
    quantity: number,
    isDealer: boolean,
    currentItems: CartItem[]
  ): Promise<Cart> {
    const price = isDealer ? product.dealerPrice : product.retailPrice;
    const existingIdx = currentItems.findIndex((i) => i.productId === product.id);
    
    let updatedItems: CartItem[];
    if (existingIdx >= 0) {
      const newQty = currentItems[existingIdx].quantity + quantity;
      updatedItems = currentItems.map((item, i) =>
        i === existingIdx
          ? { ...item, quantity: newQty, subtotal: price * newQty }
          : item
      );
    } else {
      const newItem: CartItem = {
        productId: product.id,
        product,
        quantity,
        price,
        subtotal: price * quantity,
      };
      updatedItems = [...currentItems, newItem];
    }

    const cart = cartService.calculateCart(userId, updatedItems);
    await setDoc(doc(db, 'carts', userId), {
      ...cart,
      updatedAt: serverTimestamp(),
    });
    return cart;
  },

  /**
   * Update quantity of item
   */
  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
    currentItems: CartItem[]
  ): Promise<Cart> {
    if (quantity <= 0) {
      return cartService.removeFromCart(userId, productId, currentItems);
    }
    const updatedItems = currentItems.map((item) =>
      item.productId === productId
        ? { ...item, quantity, subtotal: item.price * quantity }
        : item
    );
    const cart = cartService.calculateCart(userId, updatedItems);
    await updateDoc(doc(db, 'carts', userId), {
      items: cart.items,
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      updatedAt: serverTimestamp(),
    });
    return cart;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string, currentItems: CartItem[]): Promise<Cart> {
    const updatedItems = currentItems.filter((i) => i.productId !== productId);
    const cart = cartService.calculateCart(userId, updatedItems);
    await setDoc(doc(db, 'carts', userId), {
      ...cart,
      updatedAt: serverTimestamp(),
    });
    return cart;
  },

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    await setDoc(doc(db, 'carts', userId), {
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Calculate cart totals
   */
  calculateCart(userId: string, items: CartItem[]): Cart {
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
    return {
      userId,
      items,
      totalItems,
      totalAmount,
      updatedAt: new Date(),
    };
  },
};
