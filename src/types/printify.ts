// Print-on-Demand Integration Types (Printful)

// ===================
// PRINTFUL API TYPES
// ===================

export interface PrintfulStore {
  id: string;
  name: string;
  type: string;
}

export interface PrintfulCatalogProduct {
  id: number;
  type: string;
  type_name: string;
  title: string;
  brand: string | null;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
}

export interface PrintfulCatalogVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  image: string;
  price: string;
  in_stock: boolean;
  availability_status: string;
}

export interface PrintfulSyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulSyncVariant {
  id: number;
  sync_product_id: number;
  external_id: string;
  name: string;
  synced: boolean;
  variant_id: number;
  retail_price: string;
  currency: string;
  is_ignored: boolean;
  sku: string | null;
}

// ===================
// STREAMER MERCH TYPES
// ===================

export type PODProvider = "printify" | "printful" | "gelato";

export interface StreamerPrintifyConnection {
  streamerId: string;
  provider: PODProvider; // Which POD service is connected
  // Printify fields
  printifyApiToken?: string;
  printifyShopId?: string;
  printifyShopName?: string;
  // Printful fields (legacy support)
  printfulApiToken?: string;
  storeId?: string;
  storeName?: string;
  // Common fields
  isConnected: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export interface MerchProduct {
  id: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar?: string; // Profile picture of the seller
  printifyProductId: string;
  title: string;
  description: string;
  category: MerchCategory;
  basePrice: number; // Printify cost
  markupPrice: number; // Streamer's markup
  platformFee: number; // Platform commission
  finalPrice: number; // What customer pays
  images: string[];
  variants: MerchVariant[];
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  unitsSold: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export interface MerchVariant {
  id: string;
  printifyVariantId: number;
  title: string;
  size?: string;
  color?: string;
  additionalPrice: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  isAvailable: boolean;
}

export type MerchCategory =
  | "apparel"
  | "accessories"
  | "home_decor"
  | "stickers"
  | "posters"
  | "mugs"
  | "phone_cases"
  | "bags"
  | "hats"
  | "other";

// ===================
// PROMOTION TYPES
// ===================

export type PromotionType =
  | "percentage_off"
  | "fixed_amount_off"
  | "free_shipping"
  | "bundle_deal";

export type PromotionStatus = "draft" | "scheduled" | "active" | "ended" | "cancelled";

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  value: number; // Percentage (0-100) or fixed amount in dollars
  code?: string; // Optional promo code
  minPurchase?: number;
  maxDiscount?: number; // Cap for percentage discounts

  // Duration
  startDate: string;
  endDate: string;
  duration: PromotionDuration;

  // Targeting
  targetAudience: "all" | "streamers_only" | "superfans_only" | "new_users";
  applicableStreamers?: string[]; // Specific streamer IDs, empty = all
  applicableCategories?: MerchCategory[];
  applicableProducts?: string[]; // Specific product IDs

  // Limits
  usageLimit?: number;
  usagePerUser?: number;
  usageCount: number;

  // Status
  status: PromotionStatus;
  isVisible: boolean; // Show in banners/notifications
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type PromotionDuration =
  | "30_minutes"
  | "1_hour"
  | "2_hours"
  | "6_hours"
  | "12_hours"
  | "24_hours"
  | "3_days"
  | "7_days"
  | "14_days"
  | "30_days"
  | "custom";

// ===================
// FEE STRUCTURE TYPES
// ===================

export interface FeeStructure {
  id: string;
  name: string;
  description: string;
  basePlatformFee: number; // Percentage (e.g., 15 = 15%)

  // Competitive pricing (20% less than TikTok/Instagram)
  competitorComparison: {
    tiktokRate: number;
    instagramRate: number;
    ourRate: number;
  };

  // Trial periods
  streamerTrialDays: number; // 60 days = 2 months
  superfanTrialDays: number;

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StreamerFeeStatus {
  streamerId: string;
  feeStructureId: string;
  isInTrialPeriod: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  currentFeePercentage: number;
  totalSaved: number; // Amount saved during trial
  createdAt: string;
}

export interface SuperfanFeeStatus {
  userId: string;
  streamerId: string;
  isInTrialPeriod: boolean;
  trialStartDate: string | null;
  trialEndDate: string | null;
  feeWaived: boolean;
  createdAt: string;
}

// ===================
// MERCH ORDER TYPES
// ===================

export type MerchOrderStatus =
  | "pending"
  | "payment_confirmed"
  | "sent_to_printify"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export interface MerchOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  variantId: string;
  variantTitle: string;
  size?: string;
  color?: string;
  quantity: number;
  basePrice: number;
  finalPrice: number;
  streamerId: string;
  streamerName: string;
}

export interface MerchOrder {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;

  items: MerchOrderItem[];

  // Pricing
  subtotal: number;
  promotionDiscount: number;
  promotionId?: string;
  promotionCode?: string;
  platformFee: number;
  shippingCost: number;
  tax: number;
  total: number;

  // Shipping
  shippingAddress: MerchShippingAddress;
  shippingMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;

  // Status
  status: MerchOrderStatus;
  printifyOrderId?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  sentToPrintifyAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface MerchShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone?: string;
}

// ===================
// ANALYTICS TYPES
// ===================

export interface MerchAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalUnitsSold: number;
  averageOrderValue: number;

  revenueByStreamer: {
    streamerId: string;
    streamerName: string;
    revenue: number;
    orders: number;
  }[];

  revenueByCategory: {
    category: MerchCategory;
    revenue: number;
    unitsSold: number;
  }[];

  topProducts: {
    productId: string;
    productTitle: string;
    streamerName: string;
    unitsSold: number;
    revenue: number;
  }[];

  promotionPerformance: {
    promotionId: string;
    promotionName: string;
    usageCount: number;
    revenueGenerated: number;
    discountGiven: number;
  }[];

  revenueByDay: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

// ===================
// FILTER TYPES
// ===================

export interface MerchProductFilter {
  streamerId?: string;
  category?: MerchCategory;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
  sortBy?: "newest" | "price_low" | "price_high" | "best_selling" | "featured";
}

export interface MerchOrderFilter {
  userId?: string;
  streamerId?: string;
  status?: MerchOrderStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface PromotionFilter {
  status?: PromotionStatus;
  targetAudience?: Promotion["targetAudience"];
  isVisible?: boolean;
}
