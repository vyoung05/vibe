/**
 * Unified Print-on-Demand Provider Manager
 * Handles Printful, Printify, and Gelato with automatic routing
 */

import { PrintfulClient } from "../api/printful";
import { PrintifyClient } from "../api/printify";
import { GelatoClient } from "../api/gelato";
import type { MerchProduct, MerchOrder, MerchShippingAddress } from "../types/printify";

export type PODProvider = "printful" | "printify" | "gelato";

export interface PODConnection {
  streamerId: string;
  provider: PODProvider;
  apiToken: string;
  storeId?: string; // For Printful (optional) and Printify (required)
  shopId?: string; // For Printify
  isConnected: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

export interface UnifiedProduct {
  provider: PODProvider;
  providerId: string;
  title: string;
  description: string;
  images: string[];
  variants: Array<{
    id: string;
    title: string;
    size?: string;
    color?: string;
    price: number;
    cost: number;
    isAvailable: boolean;
  }>;
  tags: string[];
  category: string;
}

export interface UnifiedOrder {
  provider: PODProvider;
  providerOrderId: string;
  externalId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
}

/**
 * Unified POD Manager - handles all three providers
 */
export class PODManager {
  private printfulClient?: PrintfulClient;
  private printifyClient?: PrintifyClient;
  private gelatoClient?: GelatoClient;

  constructor(private connections: PODConnection[]) {
    // Initialize clients for connected providers
    connections.forEach((conn) => {
      if (!conn.isConnected) return;

      switch (conn.provider) {
        case "printful":
          this.printfulClient = new PrintfulClient({
            apiToken: conn.apiToken,
            storeId: conn.storeId,
          });
          break;
        case "printify":
          this.printifyClient = new PrintifyClient({
            apiToken: conn.apiToken,
            shopId: conn.shopId!,
          });
          break;
        case "gelato":
          this.gelatoClient = new GelatoClient({
            apiKey: conn.apiToken,
          });
          break;
      }
    });
  }

  /**
   * Sync products from all connected providers
   */
  async syncAllProducts(
    streamerId: string
  ): Promise<{
    success: boolean;
    products: UnifiedProduct[];
    errors: string[];
  }> {
    const products: UnifiedProduct[] = [];
    const errors: string[] = [];

    // Sync from Printful
    if (this.printfulClient) {
      try {
        const printfulProducts = await this.printfulClient.getSyncProducts();

        for (const product of printfulProducts) {
          const productData = await this.printfulClient.getSyncProduct(product.id);

          if (productData) {
            products.push({
              provider: "printful",
              providerId: product.id.toString(),
              title: productData.product.name,
              description: productData.product.name,
              images: [productData.product.thumbnail_url],
              variants: productData.variants.map((v) => ({
                id: v.id.toString(),
                title: v.name,
                size: v.product.name.match(/\b(XS|S|M|L|XL|2XL|3XL)\b/)?.[0],
                color: v.product.name.split("-").pop()?.trim(),
                price: parseFloat(v.retail_price),
                cost: parseFloat(v.retail_price) * 0.6,
                isAvailable: v.synced,
              })),
              tags: [],
              category: "apparel",
            });
          }
        }

        console.log(`[PODManager] Synced ${printfulProducts.length} products from Printful`);
      } catch (error) {
        errors.push(`Printful sync failed: ${error}`);
        console.error("[PODManager] Printful sync error:", error);
      }
    }

    // Sync from Printify
    if (this.printifyClient) {
      try {
        const printifyProducts = await this.printifyClient.getProducts();

        for (const product of printifyProducts) {
          products.push({
            provider: "printify",
            providerId: product.id,
            title: product.title,
            description: product.description,
            images: product.images.map((img) => img.src),
            variants: product.variants.map((v) => ({
              id: v.id.toString(),
              title: v.title,
              size: v.title.match(/\b(XS|S|M|L|XL|2XL|3XL)\b/)?.[0],
              color: v.title.split("-").pop()?.trim(),
              price: v.price / 100, // Printify uses cents
              cost: v.cost / 100,
              isAvailable: v.is_available && v.is_enabled,
            })),
            tags: product.tags,
            category: "apparel",
          });
        }

        console.log(`[PODManager] Synced ${printifyProducts.length} products from Printify`);
      } catch (error) {
        errors.push(`Printify sync failed: ${error}`);
        console.error("[PODManager] Printify sync error:", error);
      }
    }

    // Sync from Gelato
    if (this.gelatoClient) {
      try {
        const gelatoProducts = await this.gelatoClient.getProducts();

        for (const product of gelatoProducts) {
          products.push({
            provider: "gelato",
            providerId: product.uid,
            title: product.title,
            description: product.description,
            images: product.files.map((f) => f.url),
            variants: [
              {
                id: product.id,
                title: product.title,
                size: product.attributes.size,
                color: product.attributes.color,
                price: product.price.amount,
                cost: product.price.amount * 0.6,
                isAvailable: true,
              },
            ],
            tags: [],
            category: "apparel",
          });
        }

        console.log(`[PODManager] Synced ${gelatoProducts.length} products from Gelato`);
      } catch (error) {
        errors.push(`Gelato sync failed: ${error}`);
        console.error("[PODManager] Gelato sync error:", error);
      }
    }

    return {
      success: errors.length === 0,
      products,
      errors,
    };
  }

  /**
   * Create order with the appropriate provider
   */
  async createOrder(
    provider: PODProvider,
    order: MerchOrder
  ): Promise<{
    success: boolean;
    providerOrderId?: string;
    error?: string;
  }> {
    try {
      switch (provider) {
        case "printful":
          if (!this.printfulClient) {
            return { success: false, error: "Printful not connected" };
          }
          return await this.createPrintfulOrder(order);

        case "printify":
          if (!this.printifyClient) {
            return { success: false, error: "Printify not connected" };
          }
          return await this.createPrintifyOrder(order);

        case "gelato":
          if (!this.gelatoClient) {
            return { success: false, error: "Gelato not connected" };
          }
          return await this.createGelatoOrder(order);

        default:
          return { success: false, error: "Invalid provider" };
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  private async createPrintfulOrder(
    order: MerchOrder
  ): Promise<{ success: boolean; providerOrderId?: string; error?: string }> {
    const recipient: any = {
      name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      address1: order.shippingAddress.address1,
      city: order.shippingAddress.city,
      state_code: order.shippingAddress.state,
      country_code: order.shippingAddress.country,
      zip: order.shippingAddress.zipCode,
      phone: order.shippingAddress.phone,
      email: order.userEmail,
    };

    if (order.shippingAddress.address2) {
      recipient.address2 = order.shippingAddress.address2;
    }

    const printfulOrder = await this.printfulClient!.createOrder({
      external_id: order.id,
      recipient,
      items: order.items.map((item) => ({
        sync_variant_id: parseInt(item.variantId),
        quantity: item.quantity,
        retail_price: item.finalPrice.toFixed(2),
      })),
      retail_costs: {
        currency: "USD",
        subtotal: order.subtotal.toFixed(2),
        discount: order.promotionDiscount.toFixed(2),
        shipping: order.shippingCost.toFixed(2),
        tax: order.tax.toFixed(2),
      },
    });

    if (!printfulOrder) {
      return { success: false, error: "Failed to create Printful order" };
    }

    // Confirm for production
    await this.printfulClient!.confirmOrder(printfulOrder.id);

    return {
      success: true,
      providerOrderId: printfulOrder.id.toString(),
    };
  }

  private async createPrintifyOrder(
    order: MerchOrder
  ): Promise<{ success: boolean; providerOrderId?: string; error?: string }> {
    const printifyOrder = await this.printifyClient!.createOrder({
      external_id: order.id,
      line_items: order.items.map((item) => ({
        product_id: item.productId,
        variant_id: parseInt(item.variantId),
        quantity: item.quantity,
      })),
      shipping_method: 1, // Standard shipping
      address_to: {
        first_name: order.shippingAddress.firstName,
        last_name: order.shippingAddress.lastName,
        email: order.userEmail,
        phone: order.shippingAddress.phone || "",
        country: order.shippingAddress.country,
        region: order.shippingAddress.state,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        zip: order.shippingAddress.zipCode,
      },
    });

    // Submit to production
    await this.printifyClient!.submitOrderToProduction(printifyOrder.id);

    return {
      success: true,
      providerOrderId: printifyOrder.id,
    };
  }

  private async createGelatoOrder(
    order: MerchOrder
  ): Promise<{ success: boolean; providerOrderId?: string; error?: string }> {
    const gelatoOrder = await this.gelatoClient!.createOrder({
      orderReferenceId: order.id,
      customerReferenceId: order.userId,
      currency: "USD",
      orderType: "order",
      orderItems: order.items.map((item, index) => ({
        itemReferenceId: `${order.id}-${index}`,
        productUid: item.productId,
        quantity: item.quantity,
        files: [], // Would need to add design files
      })),
      shippingAddress: {
        firstName: order.shippingAddress.firstName,
        lastName: order.shippingAddress.lastName,
        addressLine1: order.shippingAddress.address1,
        addressLine2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        postCode: order.shippingAddress.zipCode,
        state: order.shippingAddress.state,
        country: order.shippingAddress.country,
        email: order.userEmail,
        phone: order.shippingAddress.phone,
      },
    });

    return {
      success: true,
      providerOrderId: gelatoOrder.id,
    };
  }

  /**
   * Calculate shipping for an order
   */
  async calculateShipping(
    provider: PODProvider,
    order: Partial<MerchOrder>
  ): Promise<{
    success: boolean;
    shippingCost?: number;
    taxAmount?: number;
    error?: string;
  }> {
    try {
      switch (provider) {
        case "printful":
          if (!this.printfulClient) {
            return { success: false, error: "Printful not connected" };
          }
          // Printful shipping calculation
          const rates = await this.printfulClient.calculateShipping({
            recipient: {
              address1: order.shippingAddress!.address1,
              city: order.shippingAddress!.city,
              state_code: order.shippingAddress!.state,
              country_code: order.shippingAddress!.country,
              zip: order.shippingAddress!.zipCode,
            },
            items: order.items!.map((item) => ({
              variant_id: parseInt(item.variantId),
              quantity: item.quantity,
            })),
          });

          const cheapestRate = rates.reduce((min, rate) => (rate.rate < min ? rate.rate : min), Infinity);

          return {
            success: true,
            shippingCost: parseFloat(cheapestRate),
            taxAmount: order.subtotal! * 0.0875, // 8.75% default tax
          };

        // Similar implementations for Printify and Gelato...
        default:
          return {
            success: true,
            shippingCost: 4.99,
            taxAmount: order.subtotal! * 0.0875,
          };
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

/**
 * Get tracking information from provider
 */
export async function getOrderTracking(
  provider: PODProvider,
  connection: PODConnection,
  providerOrderId: string
): Promise<{
  success: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: string;
  error?: string;
}> {
  try {
    switch (provider) {
      case "printful": {
        const client = new PrintfulClient({
          apiToken: connection.apiToken,
          storeId: connection.storeId,
        });
        const order = await client.getOrder(providerOrderId);

        if (!order) {
          return { success: false, error: "Order not found" };
        }

        const shipment = order.shipments?.[0];

        return {
          success: true,
          status: order.status,
          trackingNumber: shipment?.tracking_number,
          trackingUrl: shipment?.tracking_url,
        };
      }

      case "printify": {
        const client = new PrintifyClient({
          apiToken: connection.apiToken,
          shopId: connection.shopId!,
        });
        const orders = await client.getOrders();
        const order = orders.find((o) => o.id === providerOrderId);

        if (!order) {
          return { success: false, error: "Order not found" };
        }

        const shipment = order.shipments?.[0];

        return {
          success: true,
          status: order.status,
          trackingNumber: shipment?.number,
          trackingUrl: shipment?.url,
        };
      }

      case "gelato": {
        const client = new GelatoClient({
          apiKey: connection.apiToken,
        });
        const order = await client.getOrder(providerOrderId);

        if (!order) {
          return { success: false, error: "Order not found" };
        }

        const shipment = order.shipments?.[0];

        return {
          success: true,
          status: "shipped", // Gelato status
          trackingNumber: shipment?.trackingNumber,
          trackingUrl: shipment?.trackingUrl,
        };
      }

      default:
        return { success: false, error: "Invalid provider" };
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
