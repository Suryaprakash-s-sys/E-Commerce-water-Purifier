import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Order, CartItem, OrderStatus } from '../types';

export const SHIPPING_FEE = 99;
export const TAX_RATE = 0.18; // 18% GST

export const orderService = {
  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('placedAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      placedAt: d.data().placedAt?.toDate?.() ?? new Date(),
      updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
    })) as Order[];
  },

  /**
   * Get single order
   */
  async getOrder(orderId: string): Promise<Order | null> {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) return null;
    return {
      id: snap.id,
      ...snap.data(),
      placedAt: snap.data().placedAt?.toDate?.() ?? new Date(),
      updatedAt: snap.data().updatedAt?.toDate?.() ?? new Date(),
    } as Order;
  },

  /**
   * Get all orders (admin)
   */
  async getAllOrders(statusFilter?: OrderStatus): Promise<Order[]> {
    const constraints = statusFilter
      ? [where('status', '==', statusFilter), orderBy('placedAt', 'desc')]
      : [orderBy('placedAt', 'desc')];

    const q = query(collection(db, 'orders'), ...constraints, limit(200));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      placedAt: d.data().placedAt?.toDate?.() ?? new Date(),
      updatedAt: d.data().updatedAt?.toDate?.() ?? new Date(),
    })) as Order[];
  },

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<void> {
    const updates: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
    if (trackingNumber) updates.trackingNumber = trackingNumber;
    await updateDoc(doc(db, 'orders', orderId), updates);
  },

  /**
   * Calculate order totals
   */
  calculateTotals(items: CartItem[]): {
    subtotal: number;
    shippingFee: number;
    tax: number;
    totalAmount: number;
  } {
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    return {
      subtotal,
      shippingFee: SHIPPING_FEE,
      tax,
      totalAmount: subtotal + SHIPPING_FEE + tax,
    };
  },
};
