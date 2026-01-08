/**
 * Gelato API Client
 * Official Gelato API integration for print-on-demand fulfillment
 *
 * Documentation: https://developers.gelato.com/
 */

const GELATO_API_BASE = "https://order.gelatoapis.com/v4";

export interface GelatoConfig {
  apiKey: string;
}

export interface GelatoProduct {
  id: string;
  uid: string;
  title: string;
  description: string;
  productUid: string;
  currency: string;
  price: {
    amount: number;
    currency: string;
  };
  files: Array<{
    type: string;
    url: string;
  }>;
  attributes: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

export interface GelatoOrder {
  id: string;
  orderReferenceId: string;
  currency: string;
  orderType: string;
  customerReferenceId: string;
  orderItems: Array<{
    itemReferenceId: string;
    productUid: string;
    quantity: number;
    files: Array<{
      type: string;
      url: string;
    }>;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postCode: string;
    state?: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipments: Array<{
    carrier: string;
    trackingNumber: string;
    trackingUrl: string;
  }>;
  metadata: any;
}

export class GelatoClient {
  private config: GelatoConfig;

  constructor(config: GelatoConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    body?: any
  ): Promise<T> {
    const headers: HeadersInit = {
      "X-API-KEY": this.config.apiKey,
      "Content-Type": "application/json",
    };

    const url = `${GELATO_API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[Gelato] API Error:", error);
        throw new Error(error.message || "Gelato API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("[Gelato] Request failed:", error);
      throw error;
    }
  }

  // ==========================================
  // PRODUCTS API
  // ==========================================

  async getProducts(): Promise<GelatoProduct[]> {
    const response = await this.request<{ products: GelatoProduct[] }>("/products");
    return response.products || [];
  }

  async getProduct(productUid: string): Promise<GelatoProduct> {
    return await this.request<GelatoProduct>(`/products/${productUid}`);
  }

  // ==========================================
  // ORDERS API
  // ==========================================

  async createOrder(data: {
    orderReferenceId: string;
    customerReferenceId?: string;
    currency: string;
    orderType: "order" | "draft";
    orderItems: Array<{
      itemReferenceId: string;
      productUid: string;
      quantity: number;
      files: Array<{
        type: string;
        url: string;
      }>;
    }>;
    shippingAddress: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postCode: string;
      state?: string;
      country: string;
      email: string;
      phone?: string;
    };
  }): Promise<GelatoOrder> {
    return await this.request<GelatoOrder>("/orders", "POST", data);
  }

  async getOrder(orderId: string): Promise<GelatoOrder> {
    return await this.request<GelatoOrder>(`/orders/${orderId}`);
  }

  async getOrders(params?: {
    offset?: number;
    limit?: number;
  }): Promise<GelatoOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/orders?${query}` : "/orders";

    const response = await this.request<{ orders: GelatoOrder[] }>(endpoint);
    return response.orders || [];
  }

  // ==========================================
  // SHIPPING API
  // ==========================================

  async getShippingMethods(data: {
    productUid: string;
    country: string;
  }): Promise<any[]> {
    return await this.request<any[]>(`/shipping/methods`, "POST", data);
  }

  async calculateShipping(data: {
    orderItems: Array<{
      productUid: string;
      quantity: number;
    }>;
    shippingAddress: {
      country: string;
      postCode: string;
    };
  }): Promise<any> {
    return await this.request<any>("/shipping/calculate", "POST", data);
  }
}

export async function validateGelatoToken(
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new GelatoClient({ apiKey });
    await client.getProducts();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid API key",
    };
  }
}
