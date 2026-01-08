/**
 * Printful API Client
 * Official Printful API integration for print-on-demand fulfillment
 *
 * Documentation: https://developers.printful.com/docs/
 *
 * Features:
 * - OAuth 2.0 authentication with private tokens
 * - Product catalog browsing
 * - Sync product management
 * - Order creation and tracking
 * - Webhook support for real-time updates
 */

const PRINTFUL_API_BASE = "https://api.printful.com";

export interface PrintfulConfig {
  apiToken: string;
  storeId?: string; // Optional X-PF-Store-Id header
}

export interface PrintfulProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface PrintfulVariant {
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
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  files: Array<{
    id: number;
    type: string;
    hash: string;
    url: string;
    filename: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
    dpi: number;
    status: string;
    created: number;
    thumbnail_url: string;
    preview_url: string;
    visible: boolean;
  }>;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  store: number;
  status: string;
  shipping: string;
  shipping_service_name: string;
  created: number;
  updated: number;
  recipient: {
    name: string;
    address1: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    id: number;
    external_id: string;
    variant_id: number;
    sync_variant_id: number;
    quantity: number;
    price: string;
    retail_price: string;
    name: string;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
    files: any[];
    options: any[];
  }>;
  costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    tax: string;
    vat: string;
    total: string;
  };
  retail_costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    vat: string;
    total: string;
  };
  shipments: Array<{
    id: number;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    created: number;
    ship_date: string;
    shipped_at: number;
    reshipment: boolean;
    items: any[];
  }>;
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
  files: Array<{
    id: string;
    type: string;
    title: string;
    additional_price: string | null;
  }>;
  options: any[];
  is_discontinued: boolean;
  description: string;
}

export interface PrintfulCatalogVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  color_code2: string | null;
  image: string;
  price: string;
  in_stock: boolean;
  availability_status: string;
  availability_regions: {
    [region: string]: string;
  };
  availability_status_region: string;
}

export interface PrintfulWebhookEvent {
  type: string; // "package_shipped", "order_updated", etc.
  created: number;
  retries: number;
  data: {
    order?: PrintfulOrder;
    shipment?: any;
    reason?: string;
  };
}

/**
 * Printful API Client Class
 */
export class PrintfulClient {
  private config: PrintfulConfig;

  constructor(config: PrintfulConfig) {
    this.config = config;
  }

  /**
   * Make authenticated API request to Printful
   */
  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<{ code: number; result: T; error?: any }> {
    const headers: HeadersInit = {
      "Authorization": `Bearer ${this.config.apiToken}`,
      "Content-Type": "application/json",
    };

    // Add store ID header if configured
    if (this.config.storeId) {
      headers["X-PF-Store-Id"] = this.config.storeId;
    }

    const url = `${PRINTFUL_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("[Printful] API Error:", data);
        return {
          code: response.status,
          result: {} as T,
          error: data.error || data,
        };
      }

      return data;
    } catch (error) {
      console.error("[Printful] Request failed:", error);
      throw error;
    }
  }

  // ==========================================
  // CATALOG API - Browse available products
  // ==========================================

  /**
   * Get all available catalog products
   */
  async getCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    const response = await this.request<PrintfulCatalogProduct[]>("/products");
    return response.result || [];
  }

  /**
   * Get specific catalog product details
   */
  async getCatalogProduct(productId: number): Promise<PrintfulCatalogProduct | null> {
    const response = await this.request<{ product: PrintfulCatalogProduct }>(`/products/${productId}`);
    return response.result?.product || null;
  }

  /**
   * Get variants for a catalog product
   */
  async getCatalogVariants(productId: number): Promise<PrintfulCatalogVariant[]> {
    const response = await this.request<{ product: PrintfulCatalogProduct; variants: PrintfulCatalogVariant[] }>(
      `/products/${productId}`
    );
    return response.result?.variants || [];
  }

  // ==========================================
  // SYNC PRODUCTS API - Manage store products
  // ==========================================

  /**
   * Get all sync products from Printful store
   */
  async getSyncProducts(): Promise<PrintfulProduct[]> {
    const response = await this.request<PrintfulProduct[]>("/store/products");
    return response.result || [];
  }

  /**
   * Get specific sync product with variants
   */
  async getSyncProduct(syncProductId: number): Promise<{
    product: PrintfulProduct;
    variants: PrintfulVariant[];
  } | null> {
    const response = await this.request<{ sync_product: PrintfulProduct; sync_variants: PrintfulVariant[] }>(
      `/store/products/${syncProductId}`
    );

    if (response.result) {
      return {
        product: response.result.sync_product,
        variants: response.result.sync_variants,
      };
    }
    return null;
  }

  /**
   * Create a new sync product in Printful
   */
  async createSyncProduct(data: {
    name: string;
    thumbnail: string;
    variants: Array<{
      variant_id: number; // Catalog variant ID
      retail_price: string;
      files?: Array<{
        url: string;
      }>;
    }>;
  }): Promise<PrintfulProduct | null> {
    const response = await this.request<{ sync_product: PrintfulProduct }>(
      "/store/products",
      "POST",
      {
        sync_product: {
          name: data.name,
          thumbnail: data.thumbnail,
        },
        sync_variants: data.variants.map(v => ({
          variant_id: v.variant_id,
          retail_price: v.retail_price,
          files: v.files,
        })),
      }
    );

    return response.result?.sync_product || null;
  }

  /**
   * Update existing sync product
   */
  async updateSyncProduct(
    syncProductId: number,
    data: {
      name?: string;
      thumbnail?: string;
    }
  ): Promise<boolean> {
    const response = await this.request(
      `/store/products/${syncProductId}`,
      "PUT",
      { sync_product: data }
    );

    return response.code === 200;
  }

  /**
   * Delete sync product
   */
  async deleteSyncProduct(syncProductId: number): Promise<boolean> {
    const response = await this.request(`/store/products/${syncProductId}`, "DELETE");
    return response.code === 200;
  }

  // ==========================================
  // ORDERS API - Create and manage orders
  // ==========================================

  /**
   * Get all orders
   */
  async getOrders(params?: {
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<PrintfulOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/orders?${query}` : "/orders";

    const response = await this.request<PrintfulOrder[]>(endpoint);
    return response.result || [];
  }

  /**
   * Get specific order details
   */
  async getOrder(orderId: number | string): Promise<PrintfulOrder | null> {
    const response = await this.request<PrintfulOrder>(`/orders/@${orderId}`);
    return response.result || null;
  }

  /**
   * Create a new order in Printful
   */
  async createOrder(data: {
    external_id: string; // Your app's order ID
    recipient: {
      name: string;
      address1: string;
      city: string;
      state_code: string;
      country_code: string;
      zip: string;
      phone?: string;
      email?: string;
    };
    items: Array<{
      sync_variant_id?: number; // For existing sync products
      variant_id?: number; // For catalog products
      quantity: number;
      retail_price?: string;
      files?: Array<{
        url: string;
        type?: string;
      }>;
    }>;
    retail_costs?: {
      currency: string;
      subtotal: string;
      discount?: string;
      shipping?: string;
      tax?: string;
    };
  }): Promise<PrintfulOrder | null> {
    const response = await this.request<PrintfulOrder>(
      "/orders",
      "POST",
      data
    );

    if (response.error) {
      console.error("[Printful] Order creation failed:", response.error);
      return null;
    }

    return response.result || null;
  }

  /**
   * Confirm order for fulfillment
   */
  async confirmOrder(orderId: number | string): Promise<boolean> {
    const response = await this.request(`/orders/@${orderId}/confirm`, "POST");
    return response.code === 200;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: number | string): Promise<boolean> {
    const response = await this.request(`/orders/@${orderId}`, "DELETE");
    return response.code === 200;
  }

  // ==========================================
  // WEBHOOKS API - Real-time notifications
  // ==========================================

  /**
   * Setup webhook for order status updates
   */
  async createWebhook(url: string, types: string[]): Promise<boolean> {
    const response = await this.request(
      "/webhooks",
      "POST",
      {
        url,
        types, // ["package_shipped", "order_updated", "order_failed", "order_canceled"]
      }
    );

    return response.code === 200;
  }

  /**
   * Get all configured webhooks
   */
  async getWebhooks(): Promise<any[]> {
    const response = await this.request<any[]>("/webhooks");
    return response.result || [];
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: number): Promise<boolean> {
    const response = await this.request(`/webhooks/${webhookId}`, "DELETE");
    return response.code === 200;
  }

  // ==========================================
  // SHIPPING API - Calculate shipping costs
  // ==========================================

  /**
   * Calculate shipping rates for an order
   */
  async calculateShipping(data: {
    recipient: {
      address1: string;
      city: string;
      state_code: string;
      country_code: string;
      zip: string;
    };
    items: Array<{
      variant_id: number;
      quantity: number;
    }>;
  }): Promise<any[]> {
    const response = await this.request<any[]>(
      "/shipping/rates",
      "POST",
      data
    );

    return response.result || [];
  }
}

/**
 * Utility function to validate Printful API token
 */
export async function validatePrintfulToken(apiToken: string): Promise<{
  valid: boolean;
  storeId?: string;
  storeName?: string;
  error?: string;
}> {
  try {
    const client = new PrintfulClient({ apiToken });
    const products = await client.getSyncProducts();

    return {
      valid: true,
      storeId: "validated",
    };
  } catch (error) {
    return {
      valid: false,
      error: String(error),
    };
  }
}

/**
 * Sync Printful products to app format
 */
export function mapPrintfulProductToAppFormat(
  printfulProduct: PrintfulProduct,
  printfulVariants: PrintfulVariant[],
  streamerId: string,
  streamerName: string
): {
  title: string;
  description: string;
  category: "apparel" | "accessories" | "home_decor" | "stickers" | "posters" | "mugs" | "phone_cases" | "bags" | "hats" | "other";
  basePrice: number;
  finalPrice: number;
  images: string[];
  variants: any[];
  printfulProductId: number;
  printfulSyncProductId: number;
} {
  const firstVariant = printfulVariants[0];
  const retailPrice = parseFloat(firstVariant?.retail_price || "0");

  return {
    title: printfulProduct.name,
    description: `${printfulProduct.name} - Available in multiple sizes and colors`,
    category: "apparel", // Could be determined from product type
    basePrice: retailPrice * 0.6, // Estimated production cost
    finalPrice: retailPrice,
    images: [
      printfulProduct.thumbnail_url,
      ...printfulVariants.map(v => v.product.image).filter(Boolean),
    ].filter((url, index, self) => self.indexOf(url) === index), // Remove duplicates
    variants: printfulVariants.map(v => ({
      printfulVariantId: v.variant_id,
      printfulSyncVariantId: v.id,
      title: v.name,
      size: v.product.name.match(/\b(XS|S|M|L|XL|2XL|3XL)\b/)?.[0],
      color: v.product.name.match(/\b(\w+)$/)?.[0],
      additionalPrice: 0,
      stockStatus: "in_stock",
      isAvailable: v.synced,
    })),
    printfulProductId: printfulProduct.id,
    printfulSyncProductId: printfulProduct.id,
  };
}
