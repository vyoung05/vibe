// Merchant Marketplace Types

// ===================
// MERCHANT TYPES
// ===================

export type MerchantCategory =
  | "restaurant"
  | "cafe"
  | "grocery"
  | "retail"
  | "pharmacy"
  | "electronics"
  | "fashion"
  | "beauty"
  | "services"
  | "other";

export interface MerchantHours {
  day: string; // "monday", "tuesday", etc.
  open: string; // "09:00"
  close: string; // "21:00"
  isClosed: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  description: string;
  category: MerchantCategory;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  bannerUrl?: string;
  hours: MerchantHours[];
  rating: number; // 0-5
  reviewCount: number;
  isActive: boolean;
  isOpen: boolean; // Computed or manual override
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryTime?: string; // "20-30 min"
  supportsDelivery: boolean;
  supportsPickup: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===================
// ITEM/PRODUCT TYPES
// ===================

export type ItemOptionSelectionType = "single" | "multiple";

export interface ItemOptionChoice {
  id: string;
  name: string;
  priceDelta: number; // Price adjustment (can be 0, positive, or negative)
  isDefault?: boolean;
  isAvailable: boolean;
}

export interface ItemOptionGroup {
  id: string;
  name: string; // "Size", "Color", "Style"
  selectionType: ItemOptionSelectionType;
  required: boolean;
  minSelect?: number; // For multiple selection
  maxSelect?: number; // For multiple selection
  choices: ItemOptionChoice[];
}

// Product image for carousel
export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface MerchantItem {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string; // Primary image (thumbnail)
  images: ProductImage[]; // Multiple images for carousel
  category: string; // Product category: "Shirts", "Hats", "Accessories", etc.
  optionGroups: ItemOptionGroup[];
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  unitsSold: number; // For top seller tracking
  revenue: number; // For analytics
  sku?: string; // Stock Keeping Unit
  stockQuantity?: number; // Available stock
  createdAt: string;
  updatedAt: string;
}

// ===================
// CART TYPES
// ===================

export interface SelectedOption {
  groupId: string;
  groupName: string;
  choiceId: string;
  choiceName: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  basePrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  lineTotal: number; // Computed: (basePrice + sum of option deltas) * quantity
}

export type CartStatus = "active" | "abandoned" | "converted";

export interface Cart {
  id: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  status: CartStatus;
  items: CartItem[];
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

// ===================
// ORDER TYPES
// ===================

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded";

export type DeliveryType = "delivery" | "pickup";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  id: string;
  orderId: string;
  itemId: string;
  itemName: string;
  itemImageUrl?: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  notes?: string;
  lineTotal: number;
}

export interface DeliveryAddress {
  id: string;
  userId: string;
  label: string; // "Home", "Work", etc.
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // User-friendly order number like "ORD-001234"
  userId: string;
  userName: string;
  userPhone?: string;
  merchantId: string;
  merchantName: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  deliveryAddress?: DeliveryAddress;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  estimatedTime?: string; // "20-30 min"
  actualDeliveryTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

// ===================
// DISCOUNT TYPES
// ===================

export type DiscountType = "percentage" | "fixed";

export type DiscountScope =
  | "item"
  | "category"
  | "merchant"
  | "order";

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // Percentage (0-100) or fixed amount
  scope: DiscountScope;
  scopeIds?: string[]; // Item IDs, Category names, or Merchant IDs
  code?: string; // Coupon code if applicable
  minOrderAmount?: number;
  maxDiscount?: number; // Cap for percentage discounts
  usageLimit?: number;
  usageCount: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===================
// ANALYTICS TYPES
// ===================

export interface MerchantAnalytics {
  merchantId: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topItems: {
    itemId: string;
    itemName: string;
    unitsSold: number;
    revenue: number;
  }[];
  ordersByStatus: Record<OrderStatus, number>;
  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface AdminDashboardStats {
  totalGMV: number; // Gross Merchandise Value
  totalNetSales: number;
  totalFees: number;
  totalOrders: number;
  activeMerchants: number;
  topMerchants: {
    merchantId: string;
    merchantName: string;
    revenue: number;
    orders: number;
  }[];
  topItems: {
    itemId: string;
    itemName: string;
    merchantName: string;
    unitsSold: number;
    revenue: number;
  }[];
  ordersByDay: {
    date: string;
    orders: number;
    revenue: number;
  }[];
}

// ===================
// HELPER TYPES
// ===================

export interface MerchantFilter {
  category?: MerchantCategory;
  isOpen?: boolean;
  minRating?: number;
  supportsDelivery?: boolean;
  supportsPickup?: boolean;
  searchQuery?: string;
}

export interface ItemFilter {
  merchantId?: string;
  category?: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  sortBy?: "name" | "price" | "unitsSold" | "sortOrder";
  sortOrder?: "asc" | "desc";
}

export interface OrderFilter {
  userId?: string;
  merchantId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
}
