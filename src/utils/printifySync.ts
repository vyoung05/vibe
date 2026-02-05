/**
 * Printify Synchronization Utility
 * Handles 2-way sync between app and Printify
 */

import { PrintifyClient, mapPrintifyProductToAppFormat, validatePrintifyToken } from "../api/printify";
import type { MerchProduct, MerchOrder, StreamerPrintifyConnection } from "../types/printify";

/**
 * Validate Printify connection
 */
export async function validatePrintifyConnection(
  apiToken: string
): Promise<{
  valid: boolean;
  shops?: Array<{ id: number; title: string }>;
  error?: string;
}> {
  return validatePrintifyToken(apiToken);
}

/**
 * Sync all products from Printify shop to app
 */
export async function syncProductsFromPrintify(
  connection: StreamerPrintifyConnection,
  streamerId: string,
  streamerName: string,
  streamerAvatar?: string
): Promise<{
  success: boolean;
  products: Partial<MerchProduct>[];
  error?: string;
}> {
  try {
    console.log(`[PrintifySync] Starting product sync for streamer: ${streamerName}`);

    if (!connection.printifyApiToken) {
      return {
        success: false,
        products: [],
        error: "No Printify API token configured",
      };
    }

    const shopId = connection.printifyShopId ? parseInt(connection.printifyShopId) : undefined;
    
    if (!shopId) {
      return {
        success: false,
        products: [],
        error: "No Printify shop ID configured. Please select a shop.",
      };
    }

    const client = new PrintifyClient({
      apiToken: connection.printifyApiToken,
      shopId: shopId.toString(),
    });

    // Get all products from the shop
    const { data: printifyProducts } = await client.getProducts(shopId);

    if (!printifyProducts || printifyProducts.length === 0) {
      console.log("[PrintifySync] No products found in Printify shop");
      return {
        success: true,
        products: [],
      };
    }

    // Map Printify products to app format
    const products: Partial<MerchProduct>[] = printifyProducts
      .filter(p => p.visible) // Only sync visible products
      .map(product => {
        const mapped = mapPrintifyProductToAppFormat(product, streamerId, streamerName, streamerAvatar);
        return {
          streamerId,
          streamerName,
          streamerAvatar,
          printifyProductId: mapped.printifyProductId,
          title: mapped.title,
          description: mapped.description,
          category: mapped.category,
          basePrice: mapped.basePrice,
          markupPrice: mapped.markupPrice,
          platformFee: mapped.platformFee,
          finalPrice: mapped.finalPrice,
          images: mapped.images,
          variants: mapped.variants,
          isActive: mapped.isActive,
          isFeatured: mapped.isFeatured,
          tags: mapped.tags,
        };
      });

    console.log(`[PrintifySync] Successfully synced ${products.length} products`);

    return {
      success: true,
      products,
    };
  } catch (error: any) {
    console.error("[PrintifySync] Product sync failed:", error);
    return {
      success: false,
      products: [],
      error: error.message || String(error),
    };
  }
}

/**
 * Create order in Printify
 */
export async function createPrintifyOrder(
  connection: StreamerPrintifyConnection,
  order: MerchOrder
): Promise<{
  success: boolean;
  printifyOrderId?: string;
  error?: string;
}> {
  try {
    console.log(`[PrintifySync] Creating Printify order for: ${order.orderNumber}`);

    if (!connection.printifyApiToken || !connection.printifyShopId) {
      return {
        success: false,
        error: "Printify connection not configured",
      };
    }

    const shopId = parseInt(connection.printifyShopId);
    const client = new PrintifyClient({
      apiToken: connection.printifyApiToken,
      shopId: connection.printifyShopId,
    });

    // Create order in Printify
    const printifyOrder = await client.createOrder(shopId, {
      external_id: order.id,
      label: order.orderNumber,
      line_items: order.items.map(item => ({
        product_id: item.printifyProductId || item.productId,
        variant_id: parseInt(item.variantId.replace("pfy-", "")),
        quantity: item.quantity,
      })),
      shipping_method: 1, // Standard shipping
      send_shipping_notification: true,
      address_to: {
        first_name: order.shippingAddress.firstName,
        last_name: order.shippingAddress.lastName,
        email: order.userEmail,
        phone: order.shippingAddress.phone,
        country: order.shippingAddress.country,
        region: order.shippingAddress.state,
        address1: order.shippingAddress.address1,
        address2: order.shippingAddress.address2,
        city: order.shippingAddress.city,
        zip: order.shippingAddress.zipCode,
      },
    });

    console.log(`[PrintifySync] Printify order created: ${printifyOrder.id}`);

    return {
      success: true,
      printifyOrderId: printifyOrder.id,
    };
  } catch (error: any) {
    console.error("[PrintifySync] Order creation failed:", error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Send order to production in Printify
 */
export async function sendPrintifyOrderToProduction(
  connection: StreamerPrintifyConnection,
  printifyOrderId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`[PrintifySync] Sending order to production: ${printifyOrderId}`);

    if (!connection.printifyApiToken || !connection.printifyShopId) {
      return {
        success: false,
        error: "Printify connection not configured",
      };
    }

    const client = new PrintifyClient({
      apiToken: connection.printifyApiToken,
      shopId: connection.printifyShopId,
    });

    await client.sendToProduction(printifyOrderId);

    console.log(`[PrintifySync] Order sent to production: ${printifyOrderId}`);

    return { success: true };
  } catch (error: any) {
    console.error("[PrintifySync] Failed to send order to production:", error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Get order status from Printify
 */
export async function getPrintifyOrderStatus(
  connection: StreamerPrintifyConnection,
  printifyOrderId: string
): Promise<{
  success: boolean;
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  error?: string;
}> {
  try {
    if (!connection.printifyApiToken || !connection.printifyShopId) {
      return {
        success: false,
        error: "Printify connection not configured",
      };
    }

    const client = new PrintifyClient({
      apiToken: connection.printifyApiToken,
      shopId: connection.printifyShopId,
    });

    const order = await client.getOrder(printifyOrderId);

    // Get tracking info from first shipment
    const shipment = order.shipments?.[0];

    return {
      success: true,
      status: order.status,
      trackingNumber: shipment?.number,
      trackingUrl: shipment?.url,
    };
  } catch (error: any) {
    console.error("[PrintifySync] Failed to get order status:", error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

/**
 * Get available shops for a Printify account
 */
export async function getPrintifyShops(apiToken: string): Promise<{
  success: boolean;
  shops?: Array<{ id: number; title: string }>;
  error?: string;
}> {
  try {
    const client = new PrintifyClient({ apiToken });
    const shops = await client.getShops();

    return {
      success: true,
      shops: shops.map(s => ({ id: s.id, title: s.title })),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}
