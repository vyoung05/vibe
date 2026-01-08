import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Merchant,
  MerchantItem,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  Discount,
  DeliveryAddress,
  SelectedOption,
  MerchantFilter,
  ItemFilter,
  OrderFilter,
  AdminDashboardStats,
} from "../types/merchant";

// Generate unique IDs
const generateId = () => "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);

// Generate order number
const generateOrderNumber = () => "ORD-" + Date.now().toString().slice(-6);

interface MerchantState {
  // Data
  merchants: Merchant[];
  items: MerchantItem[];
  cart: Cart | null;
  orders: Order[];
  discounts: Discount[];
  savedAddresses: DeliveryAddress[];

  // Merchant Actions
  addMerchant: (merchant: Omit<Merchant, "id" | "createdAt" | "updatedAt">) => string;
  updateMerchant: (id: string, data: Partial<Merchant>) => void;
  deleteMerchant: (id: string) => void;
  getMerchant: (id: string) => Merchant | undefined;
  getMerchants: (filter?: MerchantFilter) => Merchant[];

  // Item Actions
  addItem: (item: Omit<MerchantItem, "id" | "createdAt" | "updatedAt" | "unitsSold" | "revenue">) => string;
  updateItem: (id: string, data: Partial<MerchantItem>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => MerchantItem | undefined;
  getItems: (filter?: ItemFilter) => MerchantItem[];
  getMerchantItems: (merchantId: string) => MerchantItem[];
  getMerchantCategories: (merchantId: string) => string[];
  bulkUpdateItems: (itemIds: string[], data: Partial<MerchantItem>) => void;
  bulkDeleteItems: (itemIds: string[]) => void;

  // Cart Actions
  createCart: (userId: string, merchantId: string, merchantName: string) => void;
  getCart: () => Cart | null;
  addToCart: (item: MerchantItem, quantity: number, selectedOptions: SelectedOption[], notes?: string) => boolean;
  updateCartItem: (cartItemId: string, quantity?: number, notes?: string, selectedOptions?: SelectedOption[]) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  getCartTotal: () => { subtotal: number; itemCount: number };

  // Order Actions
  createOrder: (
    userId: string,
    userName: string,
    userPhone: string | undefined,
    deliveryType: "delivery" | "pickup",
    deliveryAddress: DeliveryAddress | undefined,
    paymentMethod: string,
    tip: number,
    notes?: string
  ) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  getOrder: (id: string) => Order | undefined;
  getOrders: (filter?: OrderFilter) => Order[];
  getUserOrders: (userId: string) => Order[];

  // Discount Actions
  addDiscount: (discount: Omit<Discount, "id" | "usageCount" | "createdAt" | "updatedAt">) => string;
  updateDiscount: (id: string, data: Partial<Discount>) => void;
  deleteDiscount: (id: string) => void;
  getDiscount: (id: string) => Discount | undefined;
  getDiscountByCode: (code: string) => Discount | undefined;
  applyDiscount: (code: string, orderSubtotal: number) => { valid: boolean; discount: number; message: string };
  getActiveDiscounts: () => Discount[];

  // Address Actions
  addAddress: (address: Omit<DeliveryAddress, "id">) => string;
  updateAddress: (id: string, data: Partial<DeliveryAddress>) => void;
  deleteAddress: (id: string) => void;
  getUserAddresses: (userId: string) => DeliveryAddress[];
  setDefaultAddress: (userId: string, addressId: string) => void;

  // Analytics
  getAdminDashboardStats: (days?: number) => AdminDashboardStats;
  getTopSellingItems: (merchantId?: string, limit?: number) => MerchantItem[];

  // Seed Data
  seedSampleData: () => void;
}

export const useMerchantStore = create<MerchantState>()(
  persist(
    (set, get) => ({
      merchants: [],
      items: [],
      cart: null,
      orders: [],
      discounts: [],
      savedAddresses: [],

      // ==================
      // MERCHANT ACTIONS
      // ==================

      addMerchant: (merchantData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const merchant: Merchant = {
          ...merchantData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ merchants: [...state.merchants, merchant] }));
        return id;
      },

      updateMerchant: (id, data) => {
        set((state) => ({
          merchants: state.merchants.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m
          ),
        }));
      },

      deleteMerchant: (id) => {
        set((state) => ({
          merchants: state.merchants.filter((m) => m.id !== id),
          items: state.items.filter((i) => i.merchantId !== id),
        }));
      },

      getMerchant: (id) => get().merchants.find((m) => m.id === id),

      getMerchants: (filter) => {
        let result = get().merchants;

        if (filter) {
          if (filter.category) {
            result = result.filter((m) => m.category === filter.category);
          }
          if (filter.isOpen !== undefined) {
            result = result.filter((m) => m.isOpen === filter.isOpen);
          }
          if (filter.minRating !== undefined) {
            result = result.filter((m) => m.rating >= filter.minRating!);
          }
          if (filter.supportsDelivery) {
            result = result.filter((m) => m.supportsDelivery);
          }
          if (filter.supportsPickup) {
            result = result.filter((m) => m.supportsPickup);
          }
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            result = result.filter(
              (m) =>
                m.name.toLowerCase().includes(query) ||
                m.description.toLowerCase().includes(query)
            );
          }
        }

        return result.filter((m) => m.isActive);
      },

      // ==================
      // ITEM ACTIONS
      // ==================

      addItem: (itemData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const item: MerchantItem = {
          ...itemData,
          id,
          unitsSold: 0,
          revenue: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ items: [...state.items, item] }));
        return id;
      },

      updateItem: (id, data) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      getItem: (id) => get().items.find((i) => i.id === id),

      getItems: (filter) => {
        let result = get().items;

        if (filter) {
          if (filter.merchantId) {
            result = result.filter((i) => i.merchantId === filter.merchantId);
          }
          if (filter.category) {
            result = result.filter((i) => i.category === filter.category);
          }
          if (filter.isAvailable !== undefined) {
            result = result.filter((i) => i.isAvailable === filter.isAvailable);
          }
          if (filter.isFeatured !== undefined) {
            result = result.filter((i) => i.isFeatured === filter.isFeatured);
          }
          if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            result = result.filter(
              (i) =>
                i.name.toLowerCase().includes(query) ||
                (i.description && i.description.toLowerCase().includes(query))
            );
          }

          // Sorting
          if (filter.sortBy) {
            result = [...result].sort((a, b) => {
              const order = filter.sortOrder === "desc" ? -1 : 1;
              switch (filter.sortBy) {
                case "name":
                  return a.name.localeCompare(b.name) * order;
                case "price":
                  return (a.price - b.price) * order;
                case "unitsSold":
                  return (a.unitsSold - b.unitsSold) * order;
                case "sortOrder":
                  return (a.sortOrder - b.sortOrder) * order;
                default:
                  return 0;
              }
            });
          }
        }

        return result;
      },

      getMerchantItems: (merchantId) => {
        return get()
          .items.filter((i) => i.merchantId === merchantId)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      getMerchantCategories: (merchantId) => {
        const items = get().items.filter((i) => i.merchantId === merchantId);
        const categories = [...new Set(items.map((i) => i.category))];
        return categories;
      },

      bulkUpdateItems: (itemIds, data) => {
        set((state) => ({
          items: state.items.map((i) =>
            itemIds.includes(i.id)
              ? { ...i, ...data, updatedAt: new Date().toISOString() }
              : i
          ),
        }));
      },

      bulkDeleteItems: (itemIds) => {
        set((state) => ({
          items: state.items.filter((i) => !itemIds.includes(i.id)),
        }));
      },

      // ==================
      // CART ACTIONS
      // ==================

      createCart: (userId, merchantId, merchantName) => {
        const cart: Cart = {
          id: generateId(),
          userId,
          merchantId,
          merchantName,
          status: "active",
          items: [],
          subtotal: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ cart });
      },

      getCart: () => get().cart,

      addToCart: (item, quantity, selectedOptions, notes) => {
        const state = get();
        let cart = state.cart;

        // If cart exists but is for a different merchant, return false
        if (cart && cart.merchantId !== item.merchantId) {
          return false;
        }

        // Create cart if it does not exist
        if (!cart) {
          const merchant = state.merchants.find((m) => m.id === item.merchantId);
          if (!merchant) return false;

          cart = {
            id: generateId(),
            userId: "", // Will be set when user checks out
            merchantId: item.merchantId,
            merchantName: merchant.name,
            status: "active",
            items: [],
            subtotal: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        // Calculate line total
        const optionsPriceDelta = selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
        const lineTotal = (item.price + optionsPriceDelta) * quantity;

        const cartItem: CartItem = {
          id: generateId(),
          cartId: cart.id,
          itemId: item.id,
          itemName: item.name,
          itemImageUrl: item.imageUrl,
          basePrice: item.price,
          quantity,
          selectedOptions,
          notes,
          lineTotal,
        };

        const newItems = [...cart.items, cartItem];
        const newSubtotal = newItems.reduce((sum, ci) => sum + ci.lineTotal, 0);

        set({
          cart: {
            ...cart,
            items: newItems,
            subtotal: newSubtotal,
            updatedAt: new Date().toISOString(),
          },
        });

        return true;
      },

      updateCartItem: (cartItemId, quantity, notes, selectedOptions) => {
        const cart = get().cart;
        if (!cart) return;

        const newItems = cart.items
          .map((ci) => {
            if (ci.id !== cartItemId) return ci;

            const newQuantity = quantity !== undefined ? quantity : ci.quantity;
            const newOptions = selectedOptions !== undefined ? selectedOptions : ci.selectedOptions;
            const newNotes = notes !== undefined ? notes : ci.notes;

            if (newQuantity <= 0) return null;

            const optionsPriceDelta = newOptions.reduce((sum, opt) => sum + opt.priceDelta, 0);
            const lineTotal = (ci.basePrice + optionsPriceDelta) * newQuantity;

            return {
              ...ci,
              quantity: newQuantity,
              selectedOptions: newOptions,
              notes: newNotes,
              lineTotal,
            };
          })
          .filter(Boolean) as CartItem[];

        const newSubtotal = newItems.reduce((sum, ci) => sum + ci.lineTotal, 0);

        set({
          cart: {
            ...cart,
            items: newItems,
            subtotal: newSubtotal,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      removeFromCart: (cartItemId) => {
        const cart = get().cart;
        if (!cart) return;

        const newItems = cart.items.filter((ci) => ci.id !== cartItemId);
        const newSubtotal = newItems.reduce((sum, ci) => sum + ci.lineTotal, 0);

        if (newItems.length === 0) {
          set({ cart: null });
        } else {
          set({
            cart: {
              ...cart,
              items: newItems,
              subtotal: newSubtotal,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      clearCart: () => set({ cart: null }),

      getCartTotal: () => {
        const cart = get().cart;
        if (!cart) return { subtotal: 0, itemCount: 0 };

        const itemCount = cart.items.reduce((sum, ci) => sum + ci.quantity, 0);
        return { subtotal: cart.subtotal, itemCount };
      },

      // ==================
      // ORDER ACTIONS
      // ==================

      createOrder: (userId, userName, userPhone, deliveryType, deliveryAddress, paymentMethod, tip, notes) => {
        const state = get();
        const cart = state.cart;

        if (!cart || cart.items.length === 0) return null;

        const merchant = state.merchants.find((m) => m.id === cart.merchantId);
        if (!merchant) return null;

        // Create order items from cart
        const orderItems: OrderItem[] = cart.items.map((ci) => ({
          id: generateId(),
          orderId: "", // Will be set below
          itemId: ci.itemId,
          itemName: ci.itemName,
          itemImageUrl: ci.itemImageUrl,
          unitPrice: ci.basePrice + ci.selectedOptions.reduce((sum, opt) => sum + opt.priceDelta, 0),
          quantity: ci.quantity,
          selectedOptions: ci.selectedOptions,
          notes: ci.notes,
          lineTotal: ci.lineTotal,
        }));

        // Calculate totals
        const subtotal = cart.subtotal;
        const tax = subtotal * 0.0875; // 8.75% tax
        const deliveryFee = deliveryType === "delivery" ? (merchant.deliveryFee || 0) : 0;
        const total = subtotal + tax + deliveryFee + tip;

        const orderId = generateId();
        const order: Order = {
          id: orderId,
          orderNumber: generateOrderNumber(),
          userId,
          userName,
          userPhone,
          merchantId: cart.merchantId,
          merchantName: cart.merchantName,
          status: "pending",
          deliveryType,
          deliveryAddress,
          items: orderItems.map((oi) => ({ ...oi, orderId })),
          subtotal,
          tax,
          deliveryFee,
          tip,
          discount: 0,
          total,
          paymentStatus: "pending",
          paymentMethod,
          estimatedTime: merchant.deliveryTime || "30-45 min",
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update item sales stats
        const updatedItems = state.items.map((item) => {
          const orderItem = orderItems.find((oi) => oi.itemId === item.id);
          if (orderItem) {
            return {
              ...item,
              unitsSold: item.unitsSold + orderItem.quantity,
              revenue: item.revenue + orderItem.lineTotal,
            };
          }
          return item;
        });

        set({
          orders: [...state.orders, order],
          cart: null, // Clear cart after order
          items: updatedItems,
        });

        return order;
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;

            const updates: Partial<Order> = {
              status,
              updatedAt: new Date().toISOString(),
            };

            if (status === "confirmed") {
              updates.confirmedAt = new Date().toISOString();
            } else if (status === "completed" || status === "delivered") {
              updates.completedAt = new Date().toISOString();
            }

            return { ...o, ...updates };
          }),
        }));
      },

      updatePaymentStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, paymentStatus: status, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      cancelOrder: (orderId, reason) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled" as OrderStatus,
                  cancellationReason: reason,
                  cancelledAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      getOrder: (id) => get().orders.find((o) => o.id === id),

      getOrders: (filter) => {
        let result = get().orders;

        if (filter) {
          if (filter.userId) {
            result = result.filter((o) => o.userId === filter.userId);
          }
          if (filter.merchantId) {
            result = result.filter((o) => o.merchantId === filter.merchantId);
          }
          if (filter.status) {
            result = result.filter((o) => o.status === filter.status);
          }
          if (filter.paymentStatus) {
            result = result.filter((o) => o.paymentStatus === filter.paymentStatus);
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
      // DISCOUNT ACTIONS
      // ==================

      addDiscount: (discountData) => {
        const id = generateId();
        const now = new Date().toISOString();
        const discount: Discount = {
          ...discountData,
          id,
          usageCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ discounts: [...state.discounts, discount] }));
        return id;
      },

      updateDiscount: (id, data) => {
        set((state) => ({
          discounts: state.discounts.map((d) =>
            d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteDiscount: (id) => {
        set((state) => ({ discounts: state.discounts.filter((d) => d.id !== id) }));
      },

      getDiscount: (id) => get().discounts.find((d) => d.id === id),

      getDiscountByCode: (code) =>
        get().discounts.find((d) => d.code?.toUpperCase() === code.toUpperCase()),

      applyDiscount: (code, orderSubtotal) => {
        const discount = get().discounts.find(
          (d) => d.code?.toUpperCase() === code.toUpperCase()
        );

        if (!discount) {
          return { valid: false, discount: 0, message: "Invalid discount code" };
        }

        if (!discount.isActive) {
          return { valid: false, discount: 0, message: "This discount is no longer active" };
        }

        const now = new Date();
        if (discount.startDate && new Date(discount.startDate) > now) {
          return { valid: false, discount: 0, message: "This discount is not yet active" };
        }

        if (discount.endDate && new Date(discount.endDate) < now) {
          return { valid: false, discount: 0, message: "This discount has expired" };
        }

        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
          return { valid: false, discount: 0, message: "This discount has reached its usage limit" };
        }

        if (discount.minOrderAmount && orderSubtotal < discount.minOrderAmount) {
          return {
            valid: false,
            discount: 0,
            message: `Minimum order of $${discount.minOrderAmount.toFixed(2)} required`,
          };
        }

        let discountAmount = 0;
        if (discount.type === "percentage") {
          discountAmount = orderSubtotal * (discount.value / 100);
          if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
            discountAmount = discount.maxDiscount;
          }
        } else {
          discountAmount = discount.value;
        }

        // Increment usage count
        set((state) => ({
          discounts: state.discounts.map((d) =>
            d.id === discount.id ? { ...d, usageCount: d.usageCount + 1 } : d
          ),
        }));

        return {
          valid: true,
          discount: discountAmount,
          message: `Discount applied: -$${discountAmount.toFixed(2)}`,
        };
      },

      getActiveDiscounts: () => {
        const now = new Date();
        return get().discounts.filter((d) => {
          if (!d.isActive) return false;
          if (d.startDate && new Date(d.startDate) > now) return false;
          if (d.endDate && new Date(d.endDate) < now) return false;
          if (d.usageLimit && d.usageCount >= d.usageLimit) return false;
          return true;
        });
      },

      // ==================
      // ADDRESS ACTIONS
      // ==================

      addAddress: (addressData) => {
        const id = generateId();
        const address: DeliveryAddress = { ...addressData, id };

        set((state) => {
          // If this is the first address or isDefault is true, set it as default
          let addresses = state.savedAddresses;
          if (address.isDefault) {
            addresses = addresses.map((a) =>
              a.userId === address.userId ? { ...a, isDefault: false } : a
            );
          }
          return { savedAddresses: [...addresses, address] };
        });

        return id;
      },

      updateAddress: (id, data) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },

      deleteAddress: (id) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.filter((a) => a.id !== id),
        }));
      },

      getUserAddresses: (userId) => {
        return get().savedAddresses.filter((a) => a.userId === userId);
      },

      setDefaultAddress: (userId, addressId) => {
        set((state) => ({
          savedAddresses: state.savedAddresses.map((a) =>
            a.userId === userId ? { ...a, isDefault: a.id === addressId } : a
          ),
        }));
      },

      // ==================
      // ANALYTICS
      // ==================

      getAdminDashboardStats: (days = 30) => {
        const state = get();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentOrders = state.orders.filter(
          (o) => new Date(o.createdAt) >= cutoffDate && o.paymentStatus === "paid"
        );

        const totalGMV = recentOrders.reduce((sum, o) => sum + o.total, 0);
        const totalFees = recentOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
        const totalNetSales = totalGMV - totalFees;

        // Top merchants
        const merchantStats: Record<string, { revenue: number; orders: number; name: string }> = {};
        recentOrders.forEach((o) => {
          if (!merchantStats[o.merchantId]) {
            merchantStats[o.merchantId] = { revenue: 0, orders: 0, name: o.merchantName };
          }
          merchantStats[o.merchantId].revenue += o.total;
          merchantStats[o.merchantId].orders += 1;
        });

        const topMerchants = Object.entries(merchantStats)
          .map(([merchantId, stats]) => ({
            merchantId,
            merchantName: stats.name,
            revenue: stats.revenue,
            orders: stats.orders,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Top items
        const topItems = [...state.items]
          .sort((a, b) => b.unitsSold - a.unitsSold)
          .slice(0, 10)
          .map((item) => {
            const merchant = state.merchants.find((m) => m.id === item.merchantId);
            return {
              itemId: item.id,
              itemName: item.name,
              merchantName: merchant?.name || "Unknown",
              unitsSold: item.unitsSold,
              revenue: item.revenue,
            };
          });

        // Orders by day
        const ordersByDay: Record<string, { orders: number; revenue: number }> = {};
        recentOrders.forEach((o) => {
          const date = o.createdAt.split("T")[0];
          if (!ordersByDay[date]) {
            ordersByDay[date] = { orders: 0, revenue: 0 };
          }
          ordersByDay[date].orders += 1;
          ordersByDay[date].revenue += o.total;
        });

        return {
          totalGMV,
          totalNetSales,
          totalFees,
          totalOrders: recentOrders.length,
          activeMerchants: state.merchants.filter((m) => m.isActive).length,
          topMerchants,
          topItems,
          ordersByDay: Object.entries(ordersByDay).map(([date, stats]) => ({ date, ...stats })),
        };
      },

      getTopSellingItems: (merchantId, limit = 10) => {
        let items = get().items;
        if (merchantId) {
          items = items.filter((i) => i.merchantId === merchantId);
        }
        return [...items].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
      },

      // ==================
      // SEED DATA
      // ==================

      seedSampleData: () => {
        const state = get();
        if (state.merchants.length > 0) return; // Already seeded

        const now = new Date().toISOString();

        // Sample Merchants
        const sampleMerchants: Merchant[] = [
          {
            id: "merchant-1",
            name: "Sakura Sushi",
            description: "Authentic Japanese cuisine with fresh sushi and traditional dishes",
            category: "restaurant",
            address: "123 Main St, Downtown",
            phone: "(555) 123-4567",
            logoUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200",
            bannerUrl: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800",
            hours: [
              { day: "monday", open: "11:00", close: "22:00", isClosed: false },
              { day: "tuesday", open: "11:00", close: "22:00", isClosed: false },
              { day: "wednesday", open: "11:00", close: "22:00", isClosed: false },
              { day: "thursday", open: "11:00", close: "22:00", isClosed: false },
              { day: "friday", open: "11:00", close: "23:00", isClosed: false },
              { day: "saturday", open: "12:00", close: "23:00", isClosed: false },
              { day: "sunday", open: "12:00", close: "21:00", isClosed: false },
            ],
            rating: 4.8,
            reviewCount: 342,
            isActive: true,
            isOpen: true,
            minOrderAmount: 15,
            deliveryFee: 3.99,
            deliveryTime: "25-35 min",
            supportsDelivery: true,
            supportsPickup: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "merchant-2",
            name: "Pizza Paradise",
            description: "New York style pizza made with love and the freshest ingredients",
            category: "restaurant",
            address: "456 Oak Ave, Midtown",
            phone: "(555) 234-5678",
            logoUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200",
            bannerUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
            hours: [
              { day: "monday", open: "10:00", close: "23:00", isClosed: false },
              { day: "tuesday", open: "10:00", close: "23:00", isClosed: false },
              { day: "wednesday", open: "10:00", close: "23:00", isClosed: false },
              { day: "thursday", open: "10:00", close: "23:00", isClosed: false },
              { day: "friday", open: "10:00", close: "00:00", isClosed: false },
              { day: "saturday", open: "10:00", close: "00:00", isClosed: false },
              { day: "sunday", open: "11:00", close: "22:00", isClosed: false },
            ],
            rating: 4.6,
            reviewCount: 528,
            isActive: true,
            isOpen: true,
            deliveryFee: 2.99,
            deliveryTime: "20-30 min",
            supportsDelivery: true,
            supportsPickup: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "merchant-3",
            name: "Green Garden Cafe",
            description: "Healthy, organic meals and fresh smoothies for the health-conscious",
            category: "cafe",
            address: "789 Elm St, Uptown",
            phone: "(555) 345-6789",
            logoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200",
            bannerUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
            hours: [
              { day: "monday", open: "07:00", close: "20:00", isClosed: false },
              { day: "tuesday", open: "07:00", close: "20:00", isClosed: false },
              { day: "wednesday", open: "07:00", close: "20:00", isClosed: false },
              { day: "thursday", open: "07:00", close: "20:00", isClosed: false },
              { day: "friday", open: "07:00", close: "21:00", isClosed: false },
              { day: "saturday", open: "08:00", close: "21:00", isClosed: false },
              { day: "sunday", open: "08:00", close: "18:00", isClosed: false },
            ],
            rating: 4.7,
            reviewCount: 215,
            isActive: true,
            isOpen: true,
            minOrderAmount: 10,
            deliveryFee: 4.99,
            deliveryTime: "30-40 min",
            supportsDelivery: true,
            supportsPickup: true,
            createdAt: now,
            updatedAt: now,
          },
        ];

        // Sample Items for Sakura Sushi
        const sushiItems: MerchantItem[] = [
          {
            id: "item-1",
            merchantId: "merchant-1",
            name: "California Roll",
            description: "Crab, avocado, and cucumber wrapped in rice and seaweed",
            price: 12.99,
            imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400",
            images: [],
            category: "Rolls",
            optionGroups: [
              {
                id: "og-1",
                name: "Size",
                selectionType: "single",
                required: true,
                choices: [
                  { id: "c-1", name: "Regular (6 pcs)", priceDelta: 0, isAvailable: true, isDefault: true },
                  { id: "c-2", name: "Large (10 pcs)", priceDelta: 6, isAvailable: true },
                ],
              },
              {
                id: "og-2",
                name: "Extras",
                selectionType: "multiple",
                required: false,
                maxSelect: 3,
                choices: [
                  { id: "c-3", name: "Extra Avocado", priceDelta: 1.5, isAvailable: true },
                  { id: "c-4", name: "Spicy Mayo", priceDelta: 0.5, isAvailable: true },
                  { id: "c-5", name: "Eel Sauce", priceDelta: 0.5, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 1,
            unitsSold: 156,
            revenue: 2026.44,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-2",
            merchantId: "merchant-1",
            name: "Salmon Nigiri",
            description: "Fresh salmon over pressed rice, 2 pieces",
            price: 8.99,
            imageUrl: "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400",
            images: [],
            category: "Nigiri",
            optionGroups: [],
            isAvailable: true,
            isFeatured: false,
            sortOrder: 2,
            unitsSold: 89,
            revenue: 799.11,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-3",
            merchantId: "merchant-1",
            name: "Dragon Roll",
            description: "Eel and cucumber topped with avocado and eel sauce",
            price: 16.99,
            imageUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400",
            images: [],
            category: "Rolls",
            optionGroups: [
              {
                id: "og-3",
                name: "Extras",
                selectionType: "multiple",
                required: false,
                maxSelect: 2,
                choices: [
                  { id: "c-6", name: "Extra Eel", priceDelta: 3, isAvailable: true },
                  { id: "c-7", name: "Tempura Flakes", priceDelta: 1, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 3,
            unitsSold: 72,
            revenue: 1223.28,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-4",
            merchantId: "merchant-1",
            name: "Miso Soup",
            description: "Traditional Japanese soup with tofu, seaweed, and green onions",
            price: 3.99,
            imageUrl: "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?w=400",
            images: [],
            category: "Appetizers",
            optionGroups: [],
            isAvailable: true,
            isFeatured: false,
            sortOrder: 0,
            unitsSold: 203,
            revenue: 809.97,
            createdAt: now,
            updatedAt: now,
          },
        ];

        // Sample Items for Pizza Paradise
        const pizzaItems: MerchantItem[] = [
          {
            id: "item-5",
            merchantId: "merchant-2",
            name: "Margherita Pizza",
            description: "Fresh mozzarella, tomatoes, and basil on our signature crust",
            price: 14.99,
            imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
            images: [],
            category: "Pizzas",
            optionGroups: [
              {
                id: "og-4",
                name: "Size",
                selectionType: "single",
                required: true,
                choices: [
                  { id: "c-8", name: "Small (10\")", priceDelta: 0, isAvailable: true },
                  { id: "c-9", name: "Medium (14\")", priceDelta: 4, isAvailable: true, isDefault: true },
                  { id: "c-10", name: "Large (18\")", priceDelta: 8, isAvailable: true },
                ],
              },
              {
                id: "og-5",
                name: "Crust",
                selectionType: "single",
                required: true,
                choices: [
                  { id: "c-11", name: "Classic", priceDelta: 0, isAvailable: true, isDefault: true },
                  { id: "c-12", name: "Thin Crust", priceDelta: 0, isAvailable: true },
                  { id: "c-13", name: "Stuffed Crust", priceDelta: 3, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 1,
            unitsSold: 245,
            revenue: 4652.55,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-6",
            merchantId: "merchant-2",
            name: "Pepperoni Passion",
            description: "Double pepperoni with our secret blend of cheeses",
            price: 16.99,
            imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400",
            images: [],
            category: "Pizzas",
            optionGroups: [
              {
                id: "og-6",
                name: "Size",
                selectionType: "single",
                required: true,
                choices: [
                  { id: "c-14", name: "Small (10\")", priceDelta: 0, isAvailable: true },
                  { id: "c-15", name: "Medium (14\")", priceDelta: 4, isAvailable: true, isDefault: true },
                  { id: "c-16", name: "Large (18\")", priceDelta: 8, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 2,
            unitsSold: 312,
            revenue: 6516.72,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-7",
            merchantId: "merchant-2",
            name: "Garlic Knots",
            description: "Fresh baked knots brushed with garlic butter (6 pcs)",
            price: 5.99,
            imageUrl: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400",
            images: [],
            category: "Sides",
            optionGroups: [
              {
                id: "og-7",
                name: "Dipping Sauce",
                selectionType: "single",
                required: false,
                choices: [
                  { id: "c-17", name: "Marinara", priceDelta: 0, isAvailable: true },
                  { id: "c-18", name: "Ranch", priceDelta: 0.5, isAvailable: true },
                  { id: "c-19", name: "Garlic Parmesan", priceDelta: 0.5, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: false,
            sortOrder: 5,
            unitsSold: 187,
            revenue: 1120.13,
            createdAt: now,
            updatedAt: now,
          },
        ];

        // Sample Items for Green Garden Cafe
        const cafeItems: MerchantItem[] = [
          {
            id: "item-8",
            merchantId: "merchant-3",
            name: "Acai Bowl",
            description: "Organic acai blend topped with granola, fresh berries, and honey",
            price: 11.99,
            imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400",
            images: [],
            category: "Bowls",
            optionGroups: [
              {
                id: "og-8",
                name: "Toppings",
                selectionType: "multiple",
                required: false,
                maxSelect: 4,
                choices: [
                  { id: "c-20", name: "Extra Berries", priceDelta: 1.5, isAvailable: true },
                  { id: "c-21", name: "Coconut Flakes", priceDelta: 0.75, isAvailable: true },
                  { id: "c-22", name: "Peanut Butter", priceDelta: 1, isAvailable: true },
                  { id: "c-23", name: "Chia Seeds", priceDelta: 0.5, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 1,
            unitsSold: 134,
            revenue: 1606.66,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-9",
            merchantId: "merchant-3",
            name: "Green Goddess Smoothie",
            description: "Spinach, kale, banana, mango, and almond milk",
            price: 8.99,
            imageUrl: "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400",
            images: [],
            category: "Smoothies",
            optionGroups: [
              {
                id: "og-9",
                name: "Add-ins",
                selectionType: "multiple",
                required: false,
                maxSelect: 3,
                choices: [
                  { id: "c-24", name: "Protein Powder", priceDelta: 2, isAvailable: true },
                  { id: "c-25", name: "Spirulina", priceDelta: 1.5, isAvailable: true },
                  { id: "c-26", name: "Flax Seeds", priceDelta: 0.75, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: true,
            sortOrder: 2,
            unitsSold: 98,
            revenue: 880.02,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "item-10",
            merchantId: "merchant-3",
            name: "Avocado Toast",
            description: "Smashed avocado on sourdough with cherry tomatoes and microgreens",
            price: 10.99,
            imageUrl: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400",
            images: [],
            category: "Toasts",
            optionGroups: [
              {
                id: "og-10",
                name: "Extras",
                selectionType: "multiple",
                required: false,
                maxSelect: 2,
                choices: [
                  { id: "c-27", name: "Poached Egg", priceDelta: 2, isAvailable: true },
                  { id: "c-28", name: "Feta Cheese", priceDelta: 1.5, isAvailable: true },
                  { id: "c-29", name: "Everything Seasoning", priceDelta: 0, isAvailable: true },
                ],
              },
            ],
            isAvailable: true,
            isFeatured: false,
            sortOrder: 3,
            unitsSold: 167,
            revenue: 1835.33,
            createdAt: now,
            updatedAt: now,
          },
        ];

        // Sample Discounts
        const sampleDiscounts: Discount[] = [
          {
            id: "discount-1",
            name: "First Order Special",
            description: "20% off your first order",
            type: "percentage",
            value: 20,
            scope: "order",
            code: "WELCOME20",
            maxDiscount: 15,
            isActive: true,
            usageCount: 45,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "discount-2",
            name: "Free Delivery",
            description: "$5 off delivery fee",
            type: "fixed",
            value: 5,
            scope: "order",
            code: "FREEDEL",
            minOrderAmount: 25,
            isActive: true,
            usageCount: 23,
            createdAt: now,
            updatedAt: now,
          },
        ];

        set({
          merchants: sampleMerchants,
          items: [...sushiItems, ...pizzaItems, ...cafeItems],
          discounts: sampleDiscounts,
        });
      },
    }),
    {
      name: "merchant-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
