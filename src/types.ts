export type Category = "Men's Wear" | "Women's Wear" | "Kids' Wear";

export type GarmentType =
  | 'Shirts'
  | 'T-Shirts'
  | 'Jeans'
  | 'Trousers'
  | 'Dresses'
  | 'Jackets';

export type PaymentMethod =
  | 'UPI'
  | 'Debit Card'
  | 'Credit Card'
  | 'Net Banking';

export type PaymentStatus = 'Paid' | 'Refunded';

export type OrderStatus =
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type ReturnStatus =
  | 'None'
  | 'Requested'
  | 'Approved'
  | 'Refunded'
  | 'Rejected';

export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const FIELD_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 120,
  DESC_MIN: 5,
  DESC_MAX: 1200,
  DISPLAY_NAME_MAX: 100,
  PHONE_MAX: 24,
  ADDRESS_MAX_COUNT: 5,
  REVIEW_MIN: 3,
  REVIEW_MAX: 800,
  RETURN_REASON_MAX: 500,
  MAX_CART_ITEMS: 30,
  MAX_QTY_PER_ITEM: 20,
} as const;

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  addresses: Address[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  garmentType: GarmentType;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string[];
  colors: string[];
  stock: number;
  featured: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentLast4: string;
  paymentTxnId: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  returnStatus: ReturnStatus;
  returnReason?: string;
  returnRequestedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt?: unknown;
}

export type AppView = 'home' | 'product' | 'account' | 'admin';
