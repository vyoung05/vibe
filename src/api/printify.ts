/**
 * Printify API Client
 * Official Printify API integration for print-on-demand fulfillment
 *
 * Documentation: https://developers.printify.com/
 *
 * Features:
 * - API token authentication
 * - Shop management
 * - Product catalog & blueprints
 * - Product publishing
 * - Order creation and tracking
 */

const PRINTIFY_API_BASE = "https://api.printify.com/v1";

export interface PrintifyConfig {
  apiToken: string;
  shopId?: string;
}

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyPrintProvider {
  id: number;
  title: string;
  location: {
    address1: string;
    city: string;
    country: string;
    region: string;
    zip: string;
  };
}

export interface PrintifyVariant {
  id: number;
  title: string;
  options: {
    color: string;
    size: string;
  };
  placeholders: Array<{
    position: string;
    height: number;
    width: number;
  }>;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{
    name: string;
    type: string;
    values: Array<{ id: number; title: string }>;
  }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    grams: number;
    is_enabled: boolean;
    is_default: boolean;
    is_available: boolean;
    options: number[];
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: any[];
  sales_channel_properties: any[];
}

export interface PrintifyOrder {
  id: string;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2: string;
    city: string;
    zip: string;
  };
  line_items: Array<{
    product_id: string;
    quantity: number;
    variant_id: number;
    print_provider_id: number;
    cost: number;
    shipping_cost: number;
    status: string;
    metadata: {
      title: string;
      price: number;
      variant_label: string;
      sku: string;
      country: string;
    };
    sent_to_production_at: string;
    fulfilled_at: string;
  }>;
  metadata: {
    order_type: string;
    shop_order_id: number;
    shop_order_label: string;
    shop_fulfilled_at: string;
  };
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  is_printify_express: boolean;
  shipments: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at: string;
  }>;
  created_at: string;
  sent_to_production_at: string;
  fulfilled_at: string;
}

/**
 * Printify API Client Class
 */
export class PrintifyClient {
  private config: PrintifyConfig;

  constructor(config: PrintifyConfig) {
    this.config = config;
  }

  /**
   * Make authenticated API request to Printify
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<T> {
    const headers: HeadersInit = {
      "Authorization": `Bearer ${this.config.apiToken}`,
      "Content-Type": "application/json",
    };

    const url = `${PRINTIFY_API_BASE}${endpoint}`;

    try {
      console.log(`[Printify] ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Printify] API Error:", response.status, errorData);
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[Printify] Request failed:", error);
      throw error;
    }
  }

  // ==========================================
  // SHOPS API
  // ==========================================

  /**
   * Get all shops for the authenticated user
   */
  async getShops(): Promise<PrintifyShop[]> {
    return this.request<PrintifyShop[]>("/shops.json");
  }

  /**
   * Get specific shop details
   */
  async getShop(shopId: number): Promise<PrintifyShop> {
    return this.request<PrintifyShop>(`/shops/${shopId}.json`);
  }

  // ==========================================
  // CATALOG API - Blueprints & Print Providers
  // ==========================================

  /**
   * Get all available blueprints (product templates)
   */
  async getBlueprints(): Promise<PrintifyBlueprint[]> {
    return this.request<PrintifyBlueprint[]>("/catalog/blueprints.json");
  }

  /**
   * Get specific blueprint
   */
  async getBlueprint(blueprintId: number): Promise<PrintifyBlueprint> {
    return this.request<PrintifyBlueprint>(`/catalog/blueprints/${blueprintId}.json`);
  }

  /**
   * Get print providers for a blueprint
   */
  async getPrintProviders(blueprintId: number): Promise<PrintifyPrintProvider[]> {
    return this.request<PrintifyPrintProvider[]>(`/catalog/blueprints/${blueprintId}/print_providers.json`);
  }

  /**
   * Get variants for a blueprint/provider combination
   */
  async getVariants(blueprintId: number, printProviderId: number): Promise<PrintifyVariant[]> {
    const response = await this.request<{ variants: PrintifyVariant[] }>(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
    );
    return response.variants;
  }

  // ==========================================
  // PRODUCTS API
  // ==========================================

  /**
   * Get all products in a shop
   */
  async getProducts(shopId?: number): Promise<{ data: PrintifyProduct[] }> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<{ data: PrintifyProduct[] }>(`/shops/${id}/products.json`);
  }

  /**
   * Get specific product
   */
  async getProduct(productId: string, shopId?: number): Promise<PrintifyProduct> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<PrintifyProduct>(`/shops/${id}/products/${productId}.json`);
  }

  /**
   * Create a new product
   */
  async createProduct(
    shopId: number,
    data: {
      title: string;
      description: string;
      blueprint_id: number;
      print_provider_id: number;
      variants: Array<{
        id: number;
        price: number;
        is_enabled: boolean;
      }>;
      print_areas: Array<{
        variant_ids: number[];
        placeholders: Array<{
          position: string;
          images: Array<{
            id: string;
            x: number;
            y: number;
            scale: number;
            angle: number;
          }>;
        }>;
      }>;
    }
  ): Promise<PrintifyProduct> {
    return this.request<PrintifyProduct>(`/shops/${shopId}/products.json`, "POST", data);
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    data: Partial<{
      title: string;
      description: string;
      tags: string[];
      variants: any[];
    }>,
    shopId?: number
  ): Promise<PrintifyProduct> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<PrintifyProduct>(`/shops/${id}/products/${productId}.json`, "PUT", data);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string, shopId?: number): Promise<void> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    await this.request(`/shops/${id}/products/${productId}.json`, "DELETE");
  }

  /**
   * Publish product to sales channel
   */
  async publishProduct(
    productId: string,
    shopId?: number,
    options?: {
      title?: boolean;
      description?: boolean;
      images?: boolean;
      variants?: boolean;
      tags?: boolean;
    }
  ): Promise<void> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    await this.request(`/shops/${id}/products/${productId}/publish.json`, "POST", options || {
      title: true,
      description: true,
      images: true,
      variants: true,
      tags: true,
    });
  }

  // ==========================================
  // ORDERS API
  // ==========================================

  /**
   * Get all orders for a shop
   */
  async getOrders(shopId?: number): Promise<{ data: PrintifyOrder[] }> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<{ data: PrintifyOrder[] }>(`/shops/${id}/orders.json`);
  }

  /**
   * Get specific order
   */
  async getOrder(orderId: string, shopId?: number): Promise<PrintifyOrder> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<PrintifyOrder>(`/shops/${id}/orders/${orderId}.json`);
  }

  /**
   * Create a new order
   */
  async createOrder(
    shopId: number,
    data: {
      external_id?: string;
      label?: string;
      line_items: Array<{
        product_id: string;
        variant_id: number;
        quantity: number;
      }>;
      shipping_method: number; // 1 = standard, 2 = express
      is_printify_express?: boolean;
      send_shipping_notification?: boolean;
      address_to: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        country: string;
        region: string;
        address1: string;
        address2?: string;
        city: string;
        zip: string;
      };
    }
  ): Promise<PrintifyOrder> {
    return this.request<PrintifyOrder>(`/shops/${shopId}/orders.json`, "POST", data);
  }

  /**
   * Send order to production
   */
  async sendToProduction(orderId: string, shopId?: number): Promise<PrintifyOrder> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    return this.request<PrintifyOrder>(`/shops/${id}/orders/${orderId}/send_to_production.json`, "POST");
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, shopId?: number): Promise<void> {
    const id = shopId || this.config.shopId;
    if (!id) throw new Error("Shop ID is required");
    await this.request(`/shops/${id}/orders/${orderId}/cancel.json`, "POST");
  }

  /**
   * Calculate shipping for an order
   */
  async calculateShipping(
    shopId: number,
    data: {
      line_items: Array<{
        product_id: string;
        variant_id: number;
        quantity: number;
      }>;
      address_to: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        country: string;
        region: string;
        address1: string;
        address2?: string;
        city: string;
        zip: string;
      };
    }
  ): Promise<{ standard: number; express: number }> {
    return this.request(`/shops/${shopId}/orders/shipping.json`, "POST", data);
  }

  // ==========================================
  // UPLOADS API - For print images
  // ==========================================

  /**
   * Upload an image for printing
   */
  async uploadImage(data: {
    file_name: string;
    url: string;
  }): Promise<{
    id: string;
    file_name: string;
    height: number;
    width: number;
    size: number;
    mime_type: string;
    preview_url: string;
    upload_time: string;
  }> {
    return this.request("/uploads/images.json", "POST", data);
  }

  /**
   * Get uploaded images
   */
  async getUploads(): Promise<any[]> {
    return this.request("/uploads.json");
  }
}

/**
 * Validate Printify API token by fetching shops
 */
export async function validatePrintifyToken(apiToken: string): Promise<{
  valid: boolean;
  shops?: PrintifyShop[];
  error?: string;
}> {
  try {
    const client = new PrintifyClient({ apiToken });
    const shops = await client.getShops();

    if (shops.length === 0) {
      return {
        valid: false,
        error: "No shops found. Please create a shop in Printify first.",
      };
    }

    return {
      valid: true,
      shops,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Invalid API token",
    };
  }
}

/**
 * Map Printify product to app format
 */
export function mapPrintifyProductToAppFormat(
  product: PrintifyProduct,
  streamerId: string,
  streamerName: string,
  streamerAvatar?: string
): {
  title: string;
  description: string;
  category: "apparel" | "accessories" | "home_decor" | "stickers" | "posters" | "mugs" | "phone_cases" | "bags" | "hats" | "other";
  basePrice: number;
  markupPrice: number;
  platformFee: number;
  finalPrice: number;
  images: string[];
  variants: any[];
  printifyProductId: string;
  printifyShopId: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
} {
  // Get first enabled variant for pricing
  const enabledVariants = product.variants.filter(v => v.is_enabled && v.is_available);
  const firstVariant = enabledVariants[0] || product.variants[0];
  
  const basePrice = firstVariant?.cost || 0;
  const retailPrice = firstVariant?.price || basePrice * 1.5;
  const markupPrice = retailPrice - basePrice;
  const platformFee = retailPrice * 0.12; // 12% platform fee

  // Determine category from blueprint or tags
  let category: "apparel" | "accessories" | "home_decor" | "stickers" | "posters" | "mugs" | "phone_cases" | "bags" | "hats" | "other" = "other";
  const titleLower = product.title.toLowerCase();
  const tagsLower = product.tags.map(t => t.toLowerCase()).join(" ");
  
  if (titleLower.includes("shirt") || titleLower.includes("hoodie") || titleLower.includes("tee") || tagsLower.includes("apparel")) {
    category = "apparel";
  } else if (titleLower.includes("mug") || titleLower.includes("cup")) {
    category = "mugs";
  } else if (titleLower.includes("phone") || titleLower.includes("case")) {
    category = "phone_cases";
  } else if (titleLower.includes("poster") || titleLower.includes("print")) {
    category = "posters";
  } else if (titleLower.includes("sticker")) {
    category = "stickers";
  } else if (titleLower.includes("hat") || titleLower.includes("cap") || titleLower.includes("beanie")) {
    category = "hats";
  } else if (titleLower.includes("bag") || titleLower.includes("tote")) {
    category = "bags";
  }

  return {
    title: product.title,
    description: product.description || `${product.title} - High quality print on demand`,
    category,
    basePrice,
    markupPrice,
    platformFee,
    finalPrice: retailPrice + platformFee,
    images: product.images.filter(img => img.is_default || img.position === "front").map(img => img.src),
    variants: enabledVariants.map(v => ({
      id: `pfy-${v.id}`,
      printifyVariantId: v.id,
      title: v.title,
      additionalPrice: v.price - (firstVariant?.price || 0),
      stockStatus: v.is_available ? "in_stock" : "out_of_stock",
      isAvailable: v.is_available && v.is_enabled,
    })),
    printifyProductId: product.id,
    printifyShopId: product.shop_id,
    isActive: product.visible,
    isFeatured: false,
    tags: product.tags,
  };
}
