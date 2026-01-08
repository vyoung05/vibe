import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  syncProductsFromPrintful,
  createPrintfulOrder,
  confirmPrintfulOrder,
  validatePrintfulConnection,
} from "../utils/printfulSync";
import type {
  MerchProduct,
  MerchVariant,
  MerchOrder,
  MerchOrderItem,
  MerchOrderStatus,
  MerchShippingAddress,
  Promotion,
  PromotionStatus,
  FeeStructure,
  StreamerFeeStatus,
  SuperfanFeeStatus,
  StreamerPrintifyConnection,
  MerchProductFilter,
  MerchOrderFilter,
  PromotionFilter,
  MerchAnalytics,
  MerchCategory,
  PromotionDuration,
} from "../types/printify";
import type {
  ProviderRoutingRule,
  ProviderConnectionAccess,
  MarkupRule,
} from "../utils/providerRouting";
import {
  createDefaultRoutingRules,
  createDefaultMarkupRules,
  determineProductProvider,
  calculateProductMarkup,
} from "../utils/providerRouting";

// Generate unique IDs
const generateId = () => "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
const generateOrderNumber = () => "MERCH-" + Date.now().toString().slice(-8);

// Duration to milliseconds mapping
const durationToMs: Record<PromotionDuration, number> = {
  "30_minutes": 30 * 60 * 1000,
  "1_hour": 60 * 60 * 1000,
  "2_hours": 2 * 60 * 60 * 1000,
  "6_hours": 6 * 60 * 60 * 1000,
  "12_hours": 12 * 60 * 60 * 1000,
  "24_hours": 24 * 60 * 60 * 1000,
  "3_days": 3 * 24 * 60 * 60 * 1000,
  "7_days": 7 * 24 * 60 * 60 * 1000,
  "14_days": 14 * 24 * 60 * 60 * 1000,
  "30_days": 30 * 24 * 60 * 60 * 1000,
  custom: 0,
};

interface MerchStoreState {
  // Data
  products: MerchProduct[];
  orders: MerchOrder[];
  promotions: Promotion[];
  feeStructures: FeeStructure[];
  streamerFeeStatus: StreamerFeeStatus[];
  superfanFeeStatus: SuperfanFeeStatus[];
  printifyConnections: StreamerPrintifyConnection[];
  cart: MerchCartItem[];

  // NEW: Provider routing and access control
  providerRoutingRules: ProviderRoutingRule[];
  providerConnectionAccess: ProviderConnectionAccess[];
  markupRules: MarkupRule[];

  // Product Actions
  addProduct: (product: Omit<MerchProduct, "id" | "createdAt" | "updatedAt" | "lastSyncAt" | "unitsSold" | "revenue">) => string;
  updateProduct: (id: string, data: Partial<MerchProduct>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => MerchProduct | undefined;
  getProducts: (filter?: MerchProductFilter) => MerchProduct[];
  getStreamerProducts: (streamerId: string) => MerchProduct[];
  bulkUpdateProducts: (productIds: string[], data: Partial<MerchProduct>) => void;
  syncProductFromPrintify: (streamerId: string, printifyProduct: any) => string;

  // Cart Actions
  addToCart: (product: MerchProduct, variant: MerchVariant, quantity: number) => void;
  updateCartItem: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; itemCount: number };

  // Order Actions
  createOrder: (
    userId: string,
    userName: string,
    userEmail: string,
    shippingAddress: MerchShippingAddress,
    shippingMethod: string,
    promotionCode?: string
  ) => MerchOrder | null;
  updateOrderStatus: (orderId: string, status: MerchOrderStatus) => void;
  getOrder: (id: string) => MerchOrder | undefined;
  getOrders: (filter?: MerchOrderFilter) => MerchOrder[];
  getUserOrders: (userId: string) => MerchOrder[];

  // Promotion Actions
  addPromotion: (promotion: Omit<Promotion, "id" | "usageCount" | "createdAt" | "updatedAt">) => string;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  getPromotion: (id: string) => Promotion | undefined;
  getPromotionByCode: (code: string) => Promotion | undefined;
  getPromotions: (filter?: PromotionFilter) => Promotion[];
  getActivePromotions: () => Promotion[];
  getStreamerVisiblePromotions: () => Promotion[];
  applyPromotion: (code: string, subtotal: number, userId: string, userTier: string) => { valid: boolean; discount: number; message: string; promotionId?: string };
  createQuickPromotion: (
    name: string,
    type: Promotion["type"],
    value: number,
    duration: PromotionDuration,
    targetAudience: Promotion["targetAudience"]
  ) => string;

  // Fee Structure Actions
  addFeeStructure: (fee: Omit<FeeStructure, "id" | "createdAt" | "updatedAt">) => string;
  updateFeeStructure: (id: string, data: Partial<FeeStructure>) => void;
  getActiveFeeStructure: () => FeeStructure | undefined;
  initializeDefaultFeeStructure: () => void;

  // Streamer Fee Status
  initializeStreamerFee: (streamerId: string) => void;
  getStreamerFeeStatus: (streamerId: string) => StreamerFeeStatus | undefined;
  isStreamerInTrial: (streamerId: string) => boolean;
  getStreamerCurrentFee: (streamerId: string) => number;

  // Superfan Fee Status
  initializeSuperfanFee: (userId: string, streamerId: string) => void;
  isSuperfanFeeWaived: (userId: string, streamerId: string) => boolean;

  // Printify Connection Actions
  addPrintifyConnection: (connection: Omit<StreamerPrintifyConnection, "createdAt">) => void;
  updatePrintifyConnection: (streamerId: string, data: Partial<StreamerPrintifyConnection>) => void;
  getPrintifyConnection: (streamerId: string) => StreamerPrintifyConnection | undefined;
  disconnectPrintify: (streamerId: string) => void;
  validateAndConnectPrintful: (streamerId: string, apiToken: string, storeId?: string) => Promise<{ success: boolean; error?: string }>;
  syncPrintfulProducts: (streamerId: string, streamerName: string) => Promise<{ success: boolean; syncedCount: number; error?: string }>;
  sendOrderToPrintful: (orderId: string) => Promise<{ success: boolean; error?: string }>;

  // Provider Routing Rules
  addProviderRoutingRule: (rule: Omit<ProviderRoutingRule, "id" | "createdAt" | "updatedAt">) => string;
  updateProviderRoutingRule: (id: string, data: Partial<ProviderRoutingRule>) => void;
  deleteProviderRoutingRule: (id: string) => void;
  getProviderRoutingRules: () => ProviderRoutingRule[];
  initializeDefaultRoutingRules: () => void;

  // Provider Connection Access (RBAC)
  setProviderAccess: (streamerId: string, streamerName: string, allowedProviders: string[]) => void;
  getProviderAccess: (streamerId: string) => ProviderConnectionAccess | undefined;
  checkProviderAccess: (streamerId: string, provider: string) => boolean;

  // Markup Rules
  addMarkupRule: (rule: Omit<MarkupRule, "id" | "createdAt" | "updatedAt">) => string;
  updateMarkupRule: (id: string, data: Partial<MarkupRule>) => void;
  deleteMarkupRule: (id: string) => void;
  getMarkupRules: () => MarkupRule[];
  initializeDefaultMarkupRules: () => void;

  // Analytics
  getMerchAnalytics: (days?: number) => MerchAnalytics;
  getTopSellingProducts: (limit?: number) => MerchProduct[];

  // Seed Data
  seedSampleMerchData: () => void;

  // Connect products to streamer
  connectProductsToStreamer: (streamerId: string, streamerName: string) => void;
}

interface MerchCartItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  variantId: string;
  variantTitle: string;
  size?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  streamerId: string;
  streamerName: string;
}

export const useMerchStore = create<MerchStoreState>()(
  persist(
    (set, get) => ({
      products: [],
      orders: [],
      promotions: [],
      feeStructures: [],
      streamerFeeStatus: [],
      superfanFeeStatus: [],
      printifyConnections: [],
      cart: [],

      // Provider routing and access control
      providerRoutingRules: [],
      providerConnectionAccess: [],
      markupRules: [],

      // ==================
      // PRODUCT ACTIONS
      // ==================

      addProduct: (productData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const product: MerchProduct = {
          ...productData,
          id,
          unitsSold: 0,
          revenue: 0,
          createdAt: now,
          updatedAt: now,
          lastSyncAt: now,
        };
        set((state) => ({ products: [...state.products, product] }));
        return id;
      },

      updateProduct: (id, data) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },

      getProduct: (id) => get().products.find((p) => p.id === id),

      getProducts: (filter) => {
        let result = get().products;

        if (filter) {
          if (filter.streamerId) {
            result = result.filter((p) => p.streamerId === filter.streamerId);
          }
          if (filter.category) {
            result = result.filter((p) => p.category === filter.category);
          }
          if (filter.minPrice !== undefined) {
            result = result.filter((p) => p.finalPrice >= filter.minPrice!);
          }
          if (filter.maxPrice !== undefined) {
            result = result.filter((p) => p.finalPrice <= filter.maxPrice!);
          }
          if (filter.isActive !== undefined) {
            result = result.filter((p) => p.isActive === filter.isActive);
          }
          if (filter.isFeatured !== undefined) {
            result = result.filter((p) => p.isFeatured === filter.isFeatured);
          }
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            result = result.filter(
              (p) =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.streamerName.toLowerCase().includes(query)
            );
          }

          // Sorting
          if (filter.sortBy) {
            result = [...result].sort((a, b) => {
              switch (filter.sortBy) {
                case "newest":
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "price_low":
                  return a.finalPrice - b.finalPrice;
                case "price_high":
                  return b.finalPrice - a.finalPrice;
                case "best_selling":
                  return b.unitsSold - a.unitsSold;
                case "featured":
                  return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
                default:
                  return 0;
              }
            });
          }
        }

        return result.filter((p) => p.isActive);
      },

      getStreamerProducts: (streamerId) => {
        return get().products.filter((p) => p.streamerId === streamerId);
      },

      bulkUpdateProducts: (productIds, data) => {
        set((state) => ({
          products: state.products.map((p) =>
            productIds.includes(p.id)
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      syncProductFromPrintify: (streamerId, printifyProduct) => {
        // This would normally call Printify API - mock for now
        const id = generateId();
        const now = new Date().toISOString();
        const product: MerchProduct = {
          id,
          streamerId,
          streamerName: "Streamer", // Would be populated from actual data
          printifyProductId: printifyProduct.id,
          title: printifyProduct.title,
          description: printifyProduct.description,
          category: "apparel",
          basePrice: 15.00,
          markupPrice: 10.00,
          platformFee: 2.50,
          finalPrice: 27.50,
          images: printifyProduct.images?.map((i: any) => i.src) || [],
          variants: [],
          isActive: true,
          isFeatured: false,
          tags: printifyProduct.tags || [],
          unitsSold: 0,
          revenue: 0,
          createdAt: now,
          updatedAt: now,
          lastSyncAt: now,
        };
        set((state) => ({ products: [...state.products, product] }));
        return id;
      },

      // ==================
      // CART ACTIONS
      // ==================

      addToCart: (product, variant, quantity) => {
        const cartItem: MerchCartItem = {
          id: generateId(),
          productId: product.id,
          productTitle: product.title,
          productImage: product.images[0] || "",
          variantId: variant.id,
          variantTitle: variant.title,
          size: variant.size,
          color: variant.color,
          quantity,
          unitPrice: product.finalPrice + variant.additionalPrice,
          streamerId: product.streamerId,
          streamerName: product.streamerName,
        };

        set((state) => {
          // Check if same product + variant already in cart
          const existingIndex = state.cart.findIndex(
            (item) => item.productId === product.id && item.variantId === variant.id
          );

          if (existingIndex >= 0) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += quantity;
            return { cart: newCart };
          }

          return { cart: [...state.cart, cartItem] };
        });
      },

      updateCartItem: (cartItemId, quantity) => {
        set((state) => ({
          cart: quantity > 0
            ? state.cart.map((item) =>
                item.id === cartItemId ? { ...item, quantity } : item
              )
            : state.cart.filter((item) => item.id !== cartItemId),
        }));
      },

      removeFromCart: (cartItemId) => {
        set((state) => ({ cart: state.cart.filter((item) => item.id !== cartItemId) }));
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        const cart = get().cart;
        const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        return { subtotal, itemCount };
      },

      // ==================
      // ORDER ACTIONS
      // ==================

      createOrder: (userId, userName, userEmail, shippingAddress, shippingMethod, promotionCode) => {
        const state = get();
        const cart = state.cart;

        if (cart.length === 0) return null;

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        // Apply promotion if provided
        let promotionDiscount = 0;
        let appliedPromotionId: string | undefined;
        if (promotionCode) {
          const promoResult = state.applyPromotion(promotionCode, subtotal, userId, "user");
          if (promoResult.valid) {
            promotionDiscount = promoResult.discount;
            appliedPromotionId = promoResult.promotionId;
          }
        }

        const platformFee = (subtotal - promotionDiscount) * 0.15; // 15% platform fee
        const shippingCost = shippingMethod === "express" ? 9.99 : 4.99;
        const tax = (subtotal - promotionDiscount) * 0.0875;
        const total = subtotal - promotionDiscount + platformFee + shippingCost + tax;

        const orderId = generateId();
        const orderItems: MerchOrderItem[] = cart.map((item) => ({
          id: generateId(),
          orderId,
          productId: item.productId,
          productTitle: item.productTitle,
          productImage: item.productImage,
          variantId: item.variantId,
          variantTitle: item.variantTitle,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          basePrice: item.unitPrice,
          finalPrice: item.unitPrice * item.quantity,
          streamerId: item.streamerId,
          streamerName: item.streamerName,
        }));

        const order: MerchOrder = {
          id: orderId,
          orderNumber: generateOrderNumber(),
          userId,
          userName,
          userEmail,
          items: orderItems,
          subtotal,
          promotionDiscount,
          promotionId: appliedPromotionId,
          promotionCode,
          platformFee,
          shippingCost,
          tax,
          total,
          shippingAddress,
          shippingMethod,
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update product sales stats
        const updatedProducts = state.products.map((product) => {
          const orderItem = orderItems.find((oi) => oi.productId === product.id);
          if (orderItem) {
            return {
              ...product,
              unitsSold: product.unitsSold + orderItem.quantity,
              revenue: product.revenue + orderItem.finalPrice,
            };
          }
          return product;
        });

        set({
          orders: [...state.orders, order],
          cart: [],
          products: updatedProducts,
        });

        return order;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;

            const updates: Partial<MerchOrder> = {
              status,
              updatedAt: new Date().toISOString(),
            };

            if (status === "payment_confirmed") {
              updates.paidAt = new Date().toISOString();
            } else if (status === "sent_to_printify") {
              updates.sentToPrintifyAt = new Date().toISOString();
            } else if (status === "shipped") {
              updates.shippedAt = new Date().toISOString();
            } else if (status === "delivered") {
              updates.deliveredAt = new Date().toISOString();
            }

            return { ...o, ...updates };
          }),
        }));
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),

      getOrders: (filter) => {
        let result = get().orders;

        if (filter) {
          if (filter.userId) {
            result = result.filter((o) => o.userId === filter.userId);
          }
          if (filter.streamerId) {
            result = result.filter((o) => o.items.some((i) => i.streamerId === filter.streamerId));
          }
          if (filter.status) {
            result = result.filter((o) => o.status === filter.status);
          }
          if (filter.dateFrom) {
            result = result.filter((o) => o.createdAt >= filter.dateFrom!);
          }
          if (filter.dateTo) {
            result = result.filter((o) => o.createdAt <= filter.dateTo!);
          }
        }

        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getUserOrders: (userId) => {
        return get()
          .orders.filter((o) => o.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      // ==================
      // PROMOTION ACTIONS
      // ==================

      addPromotion: (promotionData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const promotion: Promotion = {
          ...promotionData,
          id,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ promotions: [...state.promotions, promotion] }));
        return id;
      },

      updatePromotion: (id, data) => {
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePromotion: (id) => {
        set((state) => ({ promotions: state.promotions.filter((p) => p.id !== id) }));
      },

      getPromotion: (id) => get().promotions.find((p) => p.id === id),

      getPromotionByCode: (code) =>
        get().promotions.find((p) => p.code?.toUpperCase() === code.toUpperCase()),

      getPromotions: (filter) => {
        let result = get().promotions;

        if (filter) {
          if (filter.status) {
            result = result.filter((p) => p.status === filter.status);
          }
          if (filter.targetAudience) {
            result = result.filter((p) => p.targetAudience === filter.targetAudience);
          }
          if (filter.isVisible !== undefined) {
            result = result.filter((p) => p.isVisible === filter.isVisible);
          }
        }

        return result;
      },

      getActivePromotions: () => {
        const now = new Date();
        return get().promotions.filter((p) => {
          if (p.status !== "active") return false;
          if (new Date(p.startDate) > now) return false;
          if (new Date(p.endDate) < now) return false;
          if (p.usageLimit && p.usageCount >= p.usageLimit) return false;
          return true;
        });
      },

      getStreamerVisiblePromotions: () => {
        const now = new Date();
        return get().promotions.filter((p) => {
          if (!p.isVisible) return false;
          if (p.status !== "active" && p.status !== "scheduled") return false;
          if (new Date(p.endDate) < now) return false;
          return p.targetAudience === "streamers_only" || p.targetAudience === "all";
        });
      },

      applyPromotion: (code, subtotal, userId, userTier) => {
        const promotion = get().promotions.find(
          (p) => p.code?.toUpperCase() === code.toUpperCase()
        );

        if (!promotion) {
          return { valid: false, discount: 0, message: "Invalid promotion code" };
        }

        if (promotion.status !== "active") {
          return { valid: false, discount: 0, message: "This promotion is not currently active" };
        }

        const now = new Date();
        if (new Date(promotion.startDate) > now) {
          return { valid: false, discount: 0, message: "This promotion has not started yet" };
        }

        if (new Date(promotion.endDate) < now) {
          return { valid: false, discount: 0, message: "This promotion has expired" };
        }

        if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
          return { valid: false, discount: 0, message: "This promotion has reached its usage limit" };
        }

        if (promotion.minPurchase && subtotal < promotion.minPurchase) {
          return {
            valid: false,
            discount: 0,
            message: `Minimum purchase of $${promotion.minPurchase.toFixed(2)} required`,
          };
        }

        // Check target audience
        if (promotion.targetAudience === "superfans_only" && userTier !== "superfan") {
          return { valid: false, discount: 0, message: "This promotion is for Super Fans only" };
        }
        if (promotion.targetAudience === "streamers_only" && userTier !== "streamer") {
          return { valid: false, discount: 0, message: "This promotion is for streamers only" };
        }

        let discountAmount = 0;
        switch (promotion.type) {
          case "percentage_off":
            discountAmount = subtotal * (promotion.value / 100);
            if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
              discountAmount = promotion.maxDiscount;
            }
            break;
          case "fixed_amount_off":
            discountAmount = promotion.value;
            break;
          case "free_shipping":
            discountAmount = 4.99; // Standard shipping cost
            break;
          case "bundle_deal":
            discountAmount = subtotal * (promotion.value / 100);
            break;
        }

        // Increment usage count
        set((state) => ({
          promotions: state.promotions.map((p) =>
            p.id === promotion.id ? { ...p, usageCount: p.usageCount + 1 } : p
          ),
        }));

        return {
          valid: true,
          discount: discountAmount,
          message: `Promotion applied: -$${discountAmount.toFixed(2)}`,
          promotionId: promotion.id,
        };
      },

      createQuickPromotion: (name, type, value, duration, targetAudience) => {
        const now = new Date();
        const endDate = new Date(now.getTime() + durationToMs[duration]);

        const promotion: Omit<Promotion, "id" | "usageCount" | "createdAt" | "updatedAt"> = {
          name,
          description: `Quick promotion: ${value}${type === "percentage_off" ? "%" : "$"} off`,
          type,
          value,
          code: "QUICK" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          duration,
          targetAudience,
          status: "active",
          isVisible: true,
          createdBy: "admin",
        };

        return get().addPromotion(promotion);
      },

      // ==================
      // FEE STRUCTURE ACTIONS
      // ==================

      addFeeStructure: (feeData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const fee: FeeStructure = {
          ...feeData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ feeStructures: [...state.feeStructures, fee] }));
        return id;
      },

      updateFeeStructure: (id, data) => {
        set((state) => ({
          feeStructures: state.feeStructures.map((f) =>
            f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f
          ),
        }));
      },

      getActiveFeeStructure: () => get().feeStructures.find((f) => f.isActive),

      initializeDefaultFeeStructure: () => {
        const existing = get().feeStructures.find((f) => f.isActive);
        if (existing) return;

        const defaultFee: Omit<FeeStructure, "id" | "createdAt" | "updatedAt"> = {
          name: "Standard Fee Structure",
          description: "20% lower than TikTok and Instagram",
          basePlatformFee: 12, // 12% vs TikTok's ~15% and Instagram's ~15%
          competitorComparison: {
            tiktokRate: 15,
            instagramRate: 15,
            ourRate: 12,
          },
          streamerTrialDays: 60, // 2 months
          superfanTrialDays: 60, // 2 months
          isActive: true,
        };

        get().addFeeStructure(defaultFee);
      },

      // ==================
      // STREAMER FEE STATUS
      // ==================

      initializeStreamerFee: (streamerId) => {
        const existing = get().streamerFeeStatus.find((s) => s.streamerId === streamerId);
        if (existing) return;

        const feeStructure = get().getActiveFeeStructure();
        if (!feeStructure) return;

        const now = new Date();
        const trialEnd = new Date(now.getTime() + feeStructure.streamerTrialDays * 24 * 60 * 60 * 1000);

        const status: StreamerFeeStatus = {
          streamerId,
          feeStructureId: feeStructure.id,
          isInTrialPeriod: true,
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          currentFeePercentage: 0, // 0% during trial
          totalSaved: 0,
          createdAt: now.toISOString(),
        };

        set((state) => ({ streamerFeeStatus: [...state.streamerFeeStatus, status] }));
      },

      getStreamerFeeStatus: (streamerId) =>
        get().streamerFeeStatus.find((s) => s.streamerId === streamerId),

      isStreamerInTrial: (streamerId) => {
        const status = get().streamerFeeStatus.find((s) => s.streamerId === streamerId);
        if (!status || !status.trialEndDate) return false;
        return new Date(status.trialEndDate) > new Date();
      },

      getStreamerCurrentFee: (streamerId) => {
        const status = get().streamerFeeStatus.find((s) => s.streamerId === streamerId);
        if (!status) {
          const feeStructure = get().getActiveFeeStructure();
          return feeStructure?.basePlatformFee || 12;
        }

        if (status.isInTrialPeriod && status.trialEndDate && new Date(status.trialEndDate) > new Date()) {
          return 0;
        }

        return status.currentFeePercentage;
      },

      // ==================
      // SUPERFAN FEE STATUS
      // ==================

      initializeSuperfanFee: (userId, streamerId) => {
        const existing = get().superfanFeeStatus.find(
          (s) => s.userId === userId && s.streamerId === streamerId
        );
        if (existing) return;

        const feeStructure = get().getActiveFeeStructure();
        if (!feeStructure) return;

        const now = new Date();
        const trialEnd = new Date(now.getTime() + feeStructure.superfanTrialDays * 24 * 60 * 60 * 1000);

        const status: SuperfanFeeStatus = {
          userId,
          streamerId,
          isInTrialPeriod: true,
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          feeWaived: true,
          createdAt: now.toISOString(),
        };

        set((state) => ({ superfanFeeStatus: [...state.superfanFeeStatus, status] }));
      },

      isSuperfanFeeWaived: (userId, streamerId) => {
        const status = get().superfanFeeStatus.find(
          (s) => s.userId === userId && s.streamerId === streamerId
        );
        if (!status) return false;
        if (!status.trialEndDate) return false;
        return status.feeWaived && new Date(status.trialEndDate) > new Date();
      },

      // ==================
      // PRINTIFY CONNECTION
      // ==================

      addPrintifyConnection: (connectionData) => {
        const connection: StreamerPrintifyConnection = {
          ...connectionData,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          printifyConnections: [
            ...state.printifyConnections.filter((c) => c.streamerId !== connectionData.streamerId),
            connection,
          ],
        }));
      },

      updatePrintifyConnection: (streamerId, data) => {
        set((state) => ({
          printifyConnections: state.printifyConnections.map((c) =>
            c.streamerId === streamerId ? { ...c, ...data } : c
          ),
        }));
      },

      getPrintifyConnection: (streamerId) =>
        get().printifyConnections.find((c) => c.streamerId === streamerId),

      disconnectPrintify: (streamerId) => {
        set((state) => ({
          printifyConnections: state.printifyConnections.filter((c) => c.streamerId !== streamerId),
        }));
      },

      validateAndConnectPrintful: async (streamerId, apiToken, storeId) => {
        try {
          console.log("[MerchStore] Validating Printful connection...");

          // Validate the API token
          const validation = await validatePrintfulConnection(apiToken);

          if (!validation.valid) {
            return {
              success: false,
              error: validation.error || "Invalid API token",
            };
          }

          // Save connection
          get().addPrintifyConnection({
            streamerId,
            printfulApiToken: apiToken,
            storeId,
            storeName: "Printful Store",
            isConnected: true,
            lastSyncAt: null,
          });

          console.log("[MerchStore] Printful connection successful");

          return { success: true };
        } catch (error) {
          console.error("[MerchStore] Printful connection failed:", error);
          return {
            success: false,
            error: String(error),
          };
        }
      },

      syncPrintfulProducts: async (streamerId, streamerName) => {
        try {
          console.log("[MerchStore] Starting Printful product sync...");

          const connection = get().getPrintifyConnection(streamerId);

          if (!connection || !connection.isConnected) {
            return {
              success: false,
              syncedCount: 0,
              error: "No Printful connection found. Please connect your Printful account first.",
            };
          }

          // Sync products from Printful
          const result = await syncProductsFromPrintful(connection, streamerId, streamerName);

          if (!result.success) {
            return {
              success: false,
              syncedCount: 0,
              error: result.error,
            };
          }

          // Add synced products to store
          let syncedCount = 0;
          for (const productData of result.products) {
            try {
              get().addProduct({
                streamerId,
                streamerName,
                ...productData,
              } as any);
              syncedCount++;
            } catch (error) {
              console.error("[MerchStore] Error adding product:", error);
            }
          }

          // Update last sync time
          get().updatePrintifyConnection(streamerId, {
            lastSyncAt: new Date().toISOString(),
          });

          console.log(`[MerchStore] Synced ${syncedCount} products from Printful`);

          return {
            success: true,
            syncedCount,
          };
        } catch (error) {
          console.error("[MerchStore] Product sync failed:", error);
          return {
            success: false,
            syncedCount: 0,
            error: String(error),
          };
        }
      },

      sendOrderToPrintful: async (orderId) => {
        try {
          console.log(`[MerchStore] Sending order ${orderId} to Printful...`);

          const order = get().getOrder(orderId);

          if (!order) {
            return {
              success: false,
              error: "Order not found",
            };
          }

          // Get streamer connection (use first item's streamer)
          const streamerId = order.items[0]?.streamerId;
          if (!streamerId) {
            return {
              success: false,
              error: "No streamer found for order",
            };
          }

          const connection = get().getPrintifyConnection(streamerId);

          if (!connection || !connection.isConnected) {
            return {
              success: false,
              error: "No Printful connection found for this streamer",
            };
          }

          // Create order in Printful
          const result = await createPrintfulOrder(connection, order);

          if (!result.success) {
            return {
              success: false,
              error: result.error,
            };
          }

          // Update order with Printful order ID and status
          get().updateOrderStatus(orderId, "sent_to_printify");

          // Store Printful order ID in the order
          set((state) => ({
            orders: state.orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    printifyOrderId: result.printfulOrderId?.toString(),
                    sentToPrintifyAt: new Date().toISOString(),
                  }
                : o
            ),
          }));

          // Confirm order for production
          if (result.printfulOrderId) {
            await confirmPrintfulOrder(connection, result.printfulOrderId);
            get().updateOrderStatus(orderId, "in_production");
          }

          console.log("[MerchStore] Order sent to Printful successfully");

          return { success: true };
        } catch (error) {
          console.error("[MerchStore] Failed to send order to Printful:", error);
          return {
            success: false,
            error: String(error),
          };
        }
      },

      // ==================
      // PROVIDER ROUTING RULES
      // ==================

      addProviderRoutingRule: (ruleData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const rule: ProviderRoutingRule = {
          ...ruleData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ providerRoutingRules: [...state.providerRoutingRules, rule] }));
        return id;
      },

      updateProviderRoutingRule: (id, data) => {
        set((state) => ({
          providerRoutingRules: state.providerRoutingRules.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteProviderRoutingRule: (id) => {
        set((state) => ({
          providerRoutingRules: state.providerRoutingRules.filter((r) => r.id !== id),
        }));
      },

      getProviderRoutingRules: () => get().providerRoutingRules,

      initializeDefaultRoutingRules: () => {
        const existing = get().providerRoutingRules;
        if (existing.length > 0) return;

        const defaultRules = createDefaultRoutingRules();
        set({ providerRoutingRules: defaultRules });
      },

      // ==================
      // PROVIDER ACCESS (RBAC)
      // ==================

      setProviderAccess: (streamerId, streamerName, allowedProviders) => {
        const now = new Date().toISOString();
        const access: ProviderConnectionAccess = {
          streamerId,
          streamerName,
          allowedProviders: allowedProviders as any[],
          canConnectPrintful: allowedProviders.includes("printful"),
          canConnectPrintify: allowedProviders.includes("printify"),
          canConnectGelato: allowedProviders.includes("gelato"),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          providerConnectionAccess: [
            ...state.providerConnectionAccess.filter((a) => a.streamerId !== streamerId),
            access,
          ],
        }));
      },

      getProviderAccess: (streamerId) =>
        get().providerConnectionAccess.find((a) => a.streamerId === streamerId),

      checkProviderAccess: (streamerId, provider) => {
        const access = get().providerConnectionAccess.find((a) => a.streamerId === streamerId);
        if (!access) return true; // No restrictions = full access
        return access.allowedProviders.includes(provider as any);
      },

      // ==================
      // MARKUP RULES
      // ==================

      addMarkupRule: (ruleData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const rule: MarkupRule = {
          ...ruleData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ markupRules: [...state.markupRules, rule] }));
        return id;
      },

      updateMarkupRule: (id, data) => {
        set((state) => ({
          markupRules: state.markupRules.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        }));
      },

      deleteMarkupRule: (id) => {
        set((state) => ({
          markupRules: state.markupRules.filter((r) => r.id !== id),
        }));
      },

      getMarkupRules: () => get().markupRules,

      initializeDefaultMarkupRules: () => {
        const existing = get().markupRules;
        if (existing.length > 0) return;

        const defaultRules = createDefaultMarkupRules();
        set({ markupRules: defaultRules });
      },

      // ==================
      // ANALYTICS
      // ==================

      getMerchAnalytics: (days = 30) => {
        const state = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentOrders = state.orders.filter(
          (o) => new Date(o.createdAt) >= cutoffDate && o.status !== "cancelled" && o.status !== "refunded"
        );

        const totalRevenue = recentOrders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = recentOrders.length;
        const totalUnitsSold = recentOrders.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
          0
        );
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Revenue by streamer
        const streamerRevenue: Record<string, { revenue: number; orders: number; name: string }> = {};
        recentOrders.forEach((o) => {
          o.items.forEach((item) => {
            if (!streamerRevenue[item.streamerId]) {
              streamerRevenue[item.streamerId] = { revenue: 0, orders: 0, name: item.streamerName };
            }
            streamerRevenue[item.streamerId].revenue += item.finalPrice;
            streamerRevenue[item.streamerId].orders += 1;
          });
        });

        const revenueByStreamer = Object.entries(streamerRevenue)
          .map(([streamerId, stats]) => ({
            streamerId,
            streamerName: stats.name,
            revenue: stats.revenue,
            orders: stats.orders,
          }))
          .sort((a, b) => b.revenue - a.revenue);

        // Revenue by category
        const categoryRevenue: Record<string, { revenue: number; unitsSold: number }> = {};
        state.products.forEach((p) => {
          if (!categoryRevenue[p.category]) {
            categoryRevenue[p.category] = { revenue: 0, unitsSold: 0 };
          }
          categoryRevenue[p.category].revenue += p.revenue;
          categoryRevenue[p.category].unitsSold += p.unitsSold;
        });

        const revenueByCategory = Object.entries(categoryRevenue)
          .map(([category, stats]) => ({
            category: category as MerchCategory,
            revenue: stats.revenue,
            unitsSold: stats.unitsSold,
          }))
          .sort((a, b) => b.revenue - a.revenue);

        // Top products
        const topProducts = [...state.products]
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 10)
          .map((p) => ({
            productId: p.id,
            productTitle: p.title,
            streamerName: p.streamerName,
            unitsSold: p.unitsSold,
            revenue: p.revenue,
          }));

        // Promotion performance
        const promotionPerformance = state.promotions.map((p) => ({
          promotionId: p.id,
          promotionName: p.name,
          usageCount: p.usageCount,
          revenueGenerated: recentOrders
            .filter((o) => o.promotionId === p.id)
            .reduce((sum, o) => sum + o.total, 0),
          discountGiven: recentOrders
            .filter((o) => o.promotionId === p.id)
            .reduce((sum, o) => sum + o.promotionDiscount, 0),
        }));

        // Revenue by day
        const ordersByDay: Record<string, { revenue: number; orders: number }> = {};
        recentOrders.forEach((o) => {
          const date = o.createdAt.split("T")[0];
          if (!ordersByDay[date]) {
            ordersByDay[date] = { revenue: 0, orders: 0 };
          }
          ordersByDay[date].revenue += o.total;
          ordersByDay[date].orders += 1;
        });

        return {
          totalRevenue,
          totalOrders,
          totalUnitsSold,
          averageOrderValue,
          revenueByStreamer,
          revenueByCategory,
          topProducts,
          promotionPerformance,
          revenueByDay: Object.entries(ordersByDay).map(([date, stats]) => ({ date, ...stats })),
        };
      },

      getTopSellingProducts: (limit = 10) => {
        return [...get().products].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
      },

      // ==================
      // SEED DATA
      // ==================

      seedSampleMerchData: () => {
        const state = get();
        if (state.products.length > 0) return;

        // Initialize default fee structure
        state.initializeDefaultFeeStructure();

        // Initialize default routing rules
        state.initializeDefaultRoutingRules();

        // Initialize default markup rules
        state.initializeDefaultMarkupRules();

        const now = new Date().toISOString();

        // Sample products for streamers
        const sampleProducts: MerchProduct[] = [
          {
            id: "merch-1",
            streamerId: "streamer-1",
            streamerName: "ProGamer",
            streamerAvatar: "https://i.pravatar.cc/150?img=12",
            printifyProductId: "print-001",
            title: "ProGamer Logo Hoodie",
            description: "Premium cotton blend hoodie featuring the iconic ProGamer logo",
            category: "apparel",
            basePrice: 25.00,
            markupPrice: 15.00,
            platformFee: 4.80,
            finalPrice: 44.80,
            images: [
              "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
            ],
            variants: [
              { id: "v1", printifyVariantId: 1, title: "Small - Black", size: "S", color: "Black", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v2", printifyVariantId: 2, title: "Medium - Black", size: "M", color: "Black", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v3", printifyVariantId: 3, title: "Large - Black", size: "L", color: "Black", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v4", printifyVariantId: 4, title: "XL - Black", size: "XL", color: "Black", additionalPrice: 2, stockStatus: "low_stock", isAvailable: true },
            ],
            isActive: true,
            isFeatured: true,
            tags: ["hoodie", "apparel", "gaming"],
            unitsSold: 156,
            revenue: 6988.80,
            createdAt: now,
            updatedAt: now,
            lastSyncAt: now,
          },
          {
            id: "merch-2",
            streamerId: "streamer-1",
            streamerName: "ProGamer",
            streamerAvatar: "https://i.pravatar.cc/150?img=12",
            printifyProductId: "print-002",
            title: "ProGamer Cap",
            description: "Adjustable snapback cap with embroidered logo",
            category: "hats",
            basePrice: 12.00,
            markupPrice: 8.00,
            platformFee: 2.40,
            finalPrice: 22.40,
            images: [
              "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400",
            ],
            variants: [
              { id: "v5", printifyVariantId: 5, title: "One Size - Black", color: "Black", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v6", printifyVariantId: 6, title: "One Size - White", color: "White", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
            ],
            isActive: true,
            isFeatured: false,
            tags: ["cap", "hat", "accessories"],
            unitsSold: 89,
            revenue: 1993.60,
            createdAt: now,
            updatedAt: now,
            lastSyncAt: now,
          },
          {
            id: "merch-3",
            streamerId: "streamer-2",
            streamerName: "StreamQueen",
            streamerAvatar: "https://i.pravatar.cc/150?img=5",
            printifyProductId: "print-003",
            title: "StreamQueen Tee",
            description: "Soft cotton t-shirt with vibrant StreamQueen design",
            category: "apparel",
            basePrice: 15.00,
            markupPrice: 10.00,
            platformFee: 3.00,
            finalPrice: 28.00,
            images: [
              "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
            ],
            variants: [
              { id: "v7", printifyVariantId: 7, title: "Small - Pink", size: "S", color: "Pink", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v8", printifyVariantId: 8, title: "Medium - Pink", size: "M", color: "Pink", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v9", printifyVariantId: 9, title: "Large - Pink", size: "L", color: "Pink", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
            ],
            isActive: true,
            isFeatured: true,
            tags: ["tshirt", "apparel"],
            unitsSold: 203,
            revenue: 5684.00,
            createdAt: now,
            updatedAt: now,
            lastSyncAt: now,
          },
          {
            id: "merch-4",
            streamerId: "streamer-2",
            streamerName: "StreamQueen",
            streamerAvatar: "https://i.pravatar.cc/150?img=5",
            printifyProductId: "print-004",
            title: "StreamQueen Mug",
            description: "Ceramic mug perfect for your morning coffee or gaming sessions",
            category: "mugs",
            basePrice: 8.00,
            markupPrice: 7.00,
            platformFee: 1.80,
            finalPrice: 16.80,
            images: [
              "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400",
            ],
            variants: [
              { id: "v10", printifyVariantId: 10, title: "11oz", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v11", printifyVariantId: 11, title: "15oz", additionalPrice: 3, stockStatus: "in_stock", isAvailable: true },
            ],
            isActive: true,
            isFeatured: false,
            tags: ["mug", "drinkware"],
            unitsSold: 134,
            revenue: 2251.20,
            createdAt: now,
            updatedAt: now,
            lastSyncAt: now,
          },
          {
            id: "merch-5",
            streamerId: "streamer-3",
            streamerName: "GameMaster",
            streamerAvatar: "https://i.pravatar.cc/150?img=8",
            printifyProductId: "print-005",
            title: "GameMaster Phone Case",
            description: "Durable phone case with GameMaster branding",
            category: "phone_cases",
            basePrice: 10.00,
            markupPrice: 8.00,
            platformFee: 2.16,
            finalPrice: 20.16,
            images: [
              "https://images.unsplash.com/photo-1601593346740-925612772716?w=400",
            ],
            variants: [
              { id: "v12", printifyVariantId: 12, title: "iPhone 14", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v13", printifyVariantId: 13, title: "iPhone 15", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
              { id: "v14", printifyVariantId: 14, title: "Samsung S23", additionalPrice: 0, stockStatus: "in_stock", isAvailable: true },
            ],
            isActive: true,
            isFeatured: true,
            tags: ["phone case", "accessories"],
            unitsSold: 78,
            revenue: 1572.48,
            createdAt: now,
            updatedAt: now,
            lastSyncAt: now,
          },
        ];

        // Sample promotions
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        const samplePromotions: Promotion[] = [
          {
            id: "promo-1",
            name: "New Streamer Launch Special",
            description: "20% off for streamers during their first month",
            type: "percentage_off",
            value: 20,
            code: "NEWSTREAM20",
            startDate: now,
            endDate: futureDate.toISOString(),
            duration: "30_days",
            targetAudience: "streamers_only",
            status: "active",
            isVisible: true,
            usageCount: 12,
            createdBy: "admin",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "promo-2",
            name: "Super Fan Exclusive",
            description: "15% off for Super Fans",
            type: "percentage_off",
            value: 15,
            code: "SUPERFAN15",
            startDate: now,
            endDate: futureDate.toISOString(),
            duration: "30_days",
            targetAudience: "superfans_only",
            status: "active",
            isVisible: true,
            usageCount: 45,
            createdBy: "admin",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "promo-3",
            name: "Free Shipping Weekend",
            description: "Free shipping on all orders",
            type: "free_shipping",
            value: 0,
            code: "FREESHIP",
            minPurchase: 25,
            startDate: now,
            endDate: futureDate.toISOString(),
            duration: "7_days",
            targetAudience: "all",
            status: "active",
            isVisible: true,
            usageCount: 89,
            createdBy: "admin",
            createdAt: now,
            updatedAt: now,
          },
        ];

        set({
          products: sampleProducts,
          promotions: samplePromotions,
        });
      },

      connectProductsToStreamer: (streamerId, streamerName) => {
        const state = get();
        // Update all products that don't have the current streamer ID to belong to this streamer
        // This connects the sample products to the authenticated user's account
        const updatedProducts = state.products.map((product) => {
          // If product belongs to a generic streamer ID (streamer-1, streamer-2, etc.), update it
          if (product.streamerId.startsWith("streamer-")) {
            return {
              ...product,
              streamerId,
              streamerName,
              updatedAt: new Date().toISOString(),
            };
          }
          return product;
        });

        set({ products: updatedProducts });
      },
    }),
    {
      name: "merch-store-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
