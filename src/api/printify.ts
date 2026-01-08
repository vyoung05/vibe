/**
 * Printify API Client
 * Official Printify API integration for print-on-demand fulfillment
 *
 * Documentation: https://developers.printify.com/docs/
 */

const PRINTIFY_API_BASE = "https://api.printify.com/v1";

export interface PrintifyConfig {
  apiToken: string;
  shopId: string;
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
  title: string;
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
    variant_id: number;
    quantity: number;
    print_provider_id: number;
    blueprint_id: number;
    sku: string;
    cost: number;
    shipping_cost: number;
    status: string;
    metadata: any;
  }>;
  shipments: Array<{
    carrier: string;
    number: string;
    url: string;
    delivered_at: string;
  }>;
  status: string;
  shipping_method: number;
  created_at: string;
  sent_to_production_at: string;
}

export class PrintifyClient {
  private config: PrintifyConfig;

  constructor(config: PrintifyConfig) {
    this.config = config;
  }

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
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[Printify] API Error:", error);
        throw new Error(error.message || "Printify API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("[Printify] Request failed:", error);
      throw error;
    }
  }

  // ==========================================
  // PRODUCTS API
  // ==========================================

  async getProducts(): Promise<PrintifyProduct[]> {
    const response = await this.request<{ data: PrintifyProduct[] }>(
      `/shops/${this.config.shopId}/products.json`
    );
    return response.data || [];
  }

  async getProduct(productId: string): Promise<PrintifyProduct> {
    return await this.request<PrintifyProduct>(
      `/shops/${this.config.shopId}/products/${productId}.json`
    );
  }

  async createProduct(data: {
    title: string;
    description: string;
    blueprint_id: number;
    print_provider_id: number;
    variants: Array<{
      id: number;
      price: number;
      is_enabled: boolean;
    }>;
    print_areas: any[];
  }): Promise<PrintifyProduct> {
    return await this.request<PrintifyProduct>(
      `/shops/${this.config.shopId}/products.json`,
      "POST",
      data
    );
  }

  // ==========================================
  // ORDERS API
  // ==========================================

  async getOrders(): Promise<PrintifyOrder[]> {
    const response = await this.request<{ data: PrintifyOrder[] }>(
      `/shops/${this.config.shopId}/orders.json`
    );
    return response.data || [];
  }

  async createOrder(data: {
    external_id: string;
    label?: string;
    line_items: Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>;
    shipping_method: number;
    address_to: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      country: string;
      region: string;
      address1: string;
      address2?: string;
      city: string;
      zip: string;
    };
  }): Promise<PrintifyOrder> {
    return await this.request<PrintifyOrder>(
      `/shops/${this.config.shopId}/orders.json`,
      "POST",
      data
    );
  }

  async submitOrderToProduction(orderId: string): Promise<void> {
    await this.request(
      `/shops/${this.config.shopId}/orders/${orderId}/send_to_production.json`,
      "POST"
    );
  }

  async calculateShipping(data: {
    line_items: Array<{
      product_id: string;
      variant_id: number;
      quantity: number;
    }>;
    address_to: {
      country: string;
      region: string;
      address1: string;
      city: string;
      zip: string;
    };
  }): Promise<any[]> {
    return await this.request<any[]>(
      `/shops/${this.config.shopId}/orders/shipping.json`,
      "POST",
      data
    );
  }
}

export async function validatePrintifyToken(
  apiToken: string,
  shopId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new PrintifyClient({ apiToken, shopId });
    await client.getProducts();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid API token or shop ID",
    };
  }
}
