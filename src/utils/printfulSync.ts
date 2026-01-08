/**
 * Printful Synchronization Utility
 * Handles 2-way sync between app and Printful
 */

import { PrintfulClient, mapPrintfulProductToAppFormat } from "../api/printful";
import type { MerchProduct, MerchOrder, StreamerPrintifyConnection } from "../types/printify";

/**
 * Sync all products from Printful to app
 */
export async function syncProductsFromPrintful(
  connection: StreamerPrintifyConnection,
  streamerId: string,
  streamerName: string
): Promise<{
  success: boolean;
  products: Partial<MerchProduct>[];
  error?: string;
}> {
  try {
    console.log(`[PrintfulSync] Starting product sync for streamer: ${streamerName}`);

    const client = new PrintfulClient({
      apiToken: connection.printfulApiToken,
      storeId: connection.storeId,
    });

    // Get all sync products from Printful
    const syncProducts = await client.getSyncProducts();

    if (syncProducts.length === 0) {
      console.log("[PrintfulSync] No products found in Printful store");
      return {
        success: true,
        products: [],
      };
    }

    // Fetch variants for each product
    const products: Partial<MerchProduct>[] = [];

    for (const syncProduct of syncProducts) {
      try {
        const productData = await client.getSyncProduct(syncProduct.id);

        if (!productData) {
          console.warn(`[PrintfulSync] Could not fetch product ${syncProduct.id}`);
          continue;
        }

        // Map Printful product to app format
        const mappedProduct = mapPrintfulProductToAppFormat(
          productData.product,
          productData.variants,
          streamerId,
          streamerName
        );

        products.push(mappedProduct);
      } catch (error) {
        console.error(`[PrintfulSync] Error syncing product ${syncProduct.id}:`, error);
      }
    }

    console.log(`[PrintfulSync] Successfully synced ${products.length} products`);

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error("[PrintfulSync] Product sync failed:", error);
    return {
      success: false,
      products: [],
      error: String(error),
    };
  }
}

/**
 * Create order in Printful
 */
export async function createPrintfulOrder(
  connection: StreamerPrintifyConnection,
  order: MerchOrder
): Promise<{
  success: boolean;
  printfulOrderId?: number;
  error?: string;
}> {
  try {
    console.log(`[PrintfulSync] Creating Printful order for: ${order.orderNumber}`);

    const client = new PrintfulClient({
      apiToken: connection.printfulApiToken,
      storeId: connection.storeId,
    });

    // Prepare order data for Printful
    const printfulOrderData = {
      external_id: order.id,
      recipient: {
        name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        state_code: order.shippingAddress.state,
        country_code: order.shippingAddress.country,
        zip: order.shippingAddress.zipCode,
        phone: order.shippingAddress.phone,
        email: order.userEmail,
      },
      items: order.items.map((item) => {
        // Find the product to get Printful sync variant ID
        const variant = item.variantId; // This should contain printfulSyncVariantId

        return {
          sync_variant_id: parseInt(variant), // Use sync variant ID for existing products
          quantity: item.quantity,
          retail_price: item.finalPrice.toFixed(2),
        };
      }),
      retail_costs: {
        currency: "USD",
        subtotal: order.subtotal.toFixed(2),
        discount: order.promotionDiscount.toFixed(2),
        shipping: order.shippingCost.toFixed(2),
        tax: order.tax.toFixed(2),
      },
    };

    const printfulOrder = await client.createOrder(printfulOrderData);

    if (!printfulOrder) {
      return {
        success: false,
        error: "Failed to create order in Printful",
      };
    }

    console.log(`[PrintfulSync] Printful order created: ${printfulOrder.id}`);

    return {
      success: true,
      printfulOrderId: printfulOrder.id,
    };
  } catch (error) {
    console.error("[PrintfulSync] Order creation failed:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Confirm order for production in Printful
 */
export async function confirmPrintfulOrder(
  connection: StreamerPrintifyConnection,
  printfulOrderId: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`[PrintfulSync] Confirming Printful order: ${printfulOrderId}`);

    const client = new PrintfulClient({
      apiToken: connection.printfulApiToken,
      storeId: connection.storeId,
    });

    const success = await client.confirmOrder(printfulOrderId);

    if (!success) {
      return {
        success: false,
        error: "Failed to confirm order in Printful",
      };
    }

    console.log(`[PrintfulSync] Order confirmed: ${printfulOrderId}`);

    return { success: true };
  } catch (error) {
    console.error("[PrintfulSync] Order confirmation failed:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Get order status from Printful
 */
export async function getPrintfulOrderStatus(
  connection: StreamerPrintifyConnection,
  printfulOrderId: number
): Promise<{
  success: boolean;
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  error?: string;
}> {
  try {
    const client = new PrintfulClient({
      apiToken: connection.printfulApiToken,
      storeId: connection.storeId,
    });

    const order = await client.getOrder(printfulOrderId);

    if (!order) {
      return {
        success: false,
        error: "Order not found in Printful",
      };
    }

    // Get tracking info from first shipment
    const shipment = order.shipments?.[0];

    return {
      success: true,
      status: order.status,
      trackingNumber: shipment?.tracking_number,
      trackingUrl: shipment?.tracking_url,
    };
  } catch (error) {
    console.error("[PrintfulSync] Failed to get order status:", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Handle Printful webhook event
 */
export function handlePrintfulWebhook(
  event: any,
  onOrderUpdated: (orderId: string, updates: Partial<MerchOrder>) => void
): void {
  try {
    console.log(`[PrintfulSync] Webhook received: ${event.type}`);

    const eventType = event.type;
    const orderData = event.data?.order;

    if (!orderData) {
      console.warn("[PrintfulSync] No order data in webhook");
      return;
    }

    const externalId = orderData.external_id; // Our app's order ID

    switch (eventType) {
      case "package_shipped":
        const shipment = orderData.shipments?.[0];
        onOrderUpdated(externalId, {
          status: "shipped",
          trackingNumber: shipment?.tracking_number,
          trackingUrl: shipment?.tracking_url,
          shippedAt: new Date().toISOString(),
        });
        break;

      case "order_updated":
        // Update order status based on Printful status
        let appStatus: MerchOrder["status"] = "in_production";
        if (orderData.status === "fulfilled") {
          appStatus = "delivered";
        } else if (orderData.status === "canceled") {
          appStatus = "cancelled";
        }

        onOrderUpdated(externalId, {
          status: appStatus,
          updatedAt: new Date().toISOString(),
        });
        break;

      case "order_failed":
        onOrderUpdated(externalId, {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
        break;

      case "order_canceled":
        onOrderUpdated(externalId, {
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        });
        break;

      default:
        console.log(`[PrintfulSync] Unhandled webhook type: ${eventType}`);
    }
  } catch (error) {
    console.error("[PrintfulSync] Webhook handling failed:", error);
  }
}

/**
 * Validate Printful connection by testing API token
 */
export async function validatePrintfulConnection(
  apiToken: string
): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const client = new PrintfulClient({ apiToken });

    // Try to fetch products to validate token
    await client.getSyncProducts();

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid API token or connection failed",
    };
  }
}
