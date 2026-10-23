// Types for the entire Califnco Water Purifier App

export type UserRole = 'customer' | 'dealer' | 'admin';
export type DealerStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ServiceBookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
export type ServiceType = 'installation' | 'maintenance' | 'repair' | 'inspection';
export type ProductCategory = 'water-purifiers' | 'dispensers' | 'pumps' | 'filters' | 'spare-parts';

export interface Address {
  id: string;
  label: string; // Home, Office, Other
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  photoURL?: string;
  addresses: Address[];
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DealerProfile extends User {
  role: 'dealer';
  dealerStatus: DealerStatus;
  businessName: string;
  gstNumber?: string;
  businessAddress: Address;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface ProductSpecification {
  [key: string]: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  description: string;
  retailPrice: number;
  dealerPrice: number;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  tags: string[];
  specifications: ProductSpecification;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number; // price at time of adding to cart
  subtotal: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PaymentDetails {
  provider: 'razorpay' | 'demo';
  orderId: string;
  paymentId?: string;
  signature?: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method?: string;
  failureReason?: string;
  paidAt?: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  payment: PaymentDetails;
  isDealer: boolean;
  notes?: string;
  trackingNumber?: string;
  placedAt: Date;
  updatedAt: Date;
}

export interface ServiceBooking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  serviceType: ServiceType;
  productBrand?: string;
  productModel?: string;
  description: string;
  preferredDate: Date;
  preferredTimeSlot: string;
  address: Address;
  status: ServiceBookingStatus;
  assignedTechnician?: string;
  technicianPhone?: string;
  estimatedCost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'service' | 'promotion' | 'dealer' | 'system';
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: ProductCategory;
  icon: string;
  description: string;
  productCount: number;
  isActive: boolean;
}

// Filter and Sort types
export interface ProductFilters {
  category?: ProductCategory;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  rating?: number;
}

export type ProductSortOption = 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'popular';

// API Response types
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  cursor?: unknown;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
