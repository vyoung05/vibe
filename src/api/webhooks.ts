/**
 * Webhook Handlers for Print-on-Demand Providers
 * Handles automatic order status updates from Printful, Printify, and Gelato
 */

import { useMerchStore } from "../state/merchStore";
import { notifyOrderStatusChange } from "../services/notificationService";
import type { MerchOrderStatus } from "../types/printify";

// ===================
// WEBHOOK TYPES
// ===================

export interface PrintfulWebhook {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order?: {
      id: number;
      external_id: string;
      status: string;
      shipping?: string;
      shipments?: Array<{
        id: string;
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        created: number;
        ship_date: string;
      }>;
    };
  };
}

export interface PrintifyWebhook {
  type: string;
  resource: {
    type: string;
    id: string;
    data: {
      id: string;
      status: string;
      shipments?: Array<{
        carrier: string;
        number: string;
        url: string;
        delivered_at: string | null;
      }>;
    };
  };
}

export interface GelatoWebhook {
  event: string;
  orderId: string;
  orderReferenceId: string;
  status: string;
  shipments?: Array<{
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
  }>;
}

// ===================
// WEBHOOK HANDLERS
// ===================

/**
 * Handle Printful webhook events
 */
export async function handlePrintfulWebhook(
  webhook: PrintfulWebhook
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[Webhooks] Received Printful webhook:", webhook.type);

    const orderData = webhook.data.order;
    if (!orderData) {
      return { success: false, message: "No order data in webhook" };
    }

    // Find our order by external_id
    const merchStore = useMerchStore.getState();
    const order = merchStore.orders.find((o) => o.id === orderData.external_id);

    if (!order) {
      console.log(`[Webhooks] Order not found: ${orderData.external_id}`);
      return { success: false, message: "Order not found" };
    }

    // Map Printful status to our status
    const previousStatus = order.status;
    let newStatus: MerchOrderStatus = order.status;

    switch (webhook.type) {
      case "package_shipped":
        newStatus = "shipped";
        break;
      case "package_returned":
        newStatus = "cancelled";
        break;
      case "order_failed":
        newStatus = "cancelled";
        break;
      case "order_canceled":
        newStatus = "cancelled";
        break;
      default:
        console.log(`[Webhooks] Unhandled Printful webhook type: ${webhook.type}`);
        return { success: true, message: "Webhook received but not processed" };
    }

    // Update order status
    merchStore.updateOrderStatus(order.id, newStatus);

    // Add tracking info if shipped
    if (newStatus === "shipped" && orderData.shipments && orderData.shipments.length > 0) {
      const shipment = orderData.shipments[0];
      const updatedOrder = {
        ...order,
        status: newStatus,
        trackingNumber: shipment.tracking_number,
        trackingUrl: shipment.tracking_url,
        shippedAt: new Date(shipment.created * 1000).toISOString(),
      };

      // Manually update the order with tracking info
      const orders = merchStore.orders.map((o) =>
        o.id === order.id ? updatedOrder : o
      );
      useMerchStore.setState({ orders });

      // Send notification
      await notifyOrderStatusChange(updatedOrder, previousStatus, newStatus);
    } else {
      // Send notification without tracking
      await notifyOrderStatusChange(order, previousStatus, newStatus);
    }

    console.log(`[Webhooks] Printful order ${order.orderNumber} updated: ${previousStatus} → ${newStatus}`);

    return {
      success: true,
      message: `Order ${order.orderNumber} status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error("[Webhooks] Error handling Printful webhook:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handle Printify webhook events
 */
export async function handlePrintifyWebhook(
  webhook: PrintifyWebhook
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[Webhooks] Received Printify webhook:", webhook.type);

    if (webhook.resource.type !== "order") {
      return { success: true, message: "Not an order webhook" };
    }

    const orderData = webhook.resource.data;

    // Find our order by printifyOrderId
    const merchStore = useMerchStore.getState();
    const order = merchStore.orders.find((o) => o.printifyOrderId === orderData.id);

    if (!order) {
      console.log(`[Webhooks] Order not found with printifyOrderId: ${orderData.id}`);
      return { success: false, message: "Order not found" };
    }

    // Map Printify status to our status
    const previousStatus = order.status;
    let newStatus: MerchOrderStatus = order.status;

    switch (orderData.status) {
      case "pending":
        newStatus = "in_production";
        break;
      case "on-hold":
        newStatus = "in_production";
        break;
      case "fulfilled":
        newStatus = "shipped";
        break;
      case "canceled":
        newStatus = "cancelled";
        break;
      default:
        console.log(`[Webhooks] Unknown Printify status: ${orderData.status}`);
        return { success: true, message: "Unknown status" };
    }

    // Update order status
    merchStore.updateOrderStatus(order.id, newStatus);

    // Add tracking info if shipped
    if (newStatus === "shipped" && orderData.shipments && orderData.shipments.length > 0) {
      const shipment = orderData.shipments[0];
      const updatedOrder = {
        ...order,
        status: newStatus,
        trackingNumber: shipment.number,
        trackingUrl: shipment.url,
        shippedAt: new Date().toISOString(),
      };

      // Manually update the order with tracking info
      const orders = merchStore.orders.map((o) =>
        o.id === order.id ? updatedOrder : o
      );
      useMerchStore.setState({ orders });

      // Send notification
      await notifyOrderStatusChange(updatedOrder, previousStatus, newStatus);
    } else {
      // Send notification without tracking
      await notifyOrderStatusChange(order, previousStatus, newStatus);
    }

    console.log(`[Webhooks] Printify order ${order.orderNumber} updated: ${previousStatus} → ${newStatus}`);

    return {
      success: true,
      message: `Order ${order.orderNumber} status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error("[Webhooks] Error handling Printify webhook:", error);
    return { success: false, message: String(error) };
  }
}

/**
 * Handle Gelato webhook events
 */
export async function handleGelatoWebhook(
  webhook: GelatoWebhook
): Promise<{ success: boolean; message: string }> {
  try {
    console.log("[Webhooks] Received Gelato webhook:", webhook.event);

    // Find our order by orderReferenceId (which is our order ID)
    const merchStore = useMerchStore.getState();
    const order = merchStore.orders.find((o) => o.id === webhook.orderReferenceId);

    if (!order) {
      console.log(`[Webhooks] Order not found: ${webhook.orderReferenceId}`);
      return { success: false, message: "Order not found" };
    }

    // Map Gelato status to our status
    const previousStatus = order.status;
    let newStatus: MerchOrderStatus = order.status;

    switch (webhook.event) {
      case "order.created":
        newStatus = "in_production";
        break;
      case "order.shipped":
        newStatus = "shipped";
        break;
      case "order.delivered":
        newStatus = "delivered";
        break;
      case "order.cancelled":
        newStatus = "cancelled";
        break;
      default:
        console.log(`[Webhooks] Unhandled Gelato event: ${webhook.event}`);
        return { success: true, message: "Webhook received but not processed" };
    }

    // Update order status
    merchStore.updateOrderStatus(order.id, newStatus);

    // Add tracking info if shipped
    if (
      (newStatus === "shipped" || newStatus === "delivered") &&
      webhook.shipments &&
      webhook.shipments.length > 0
    ) {
      const shipment = webhook.shipments[0];
      const updatedOrder = {
        ...order,
        status: newStatus,
        trackingNumber: shipment.trackingNumber,
        trackingUrl: shipment.trackingUrl,
        shippedAt: newStatus === "shipped" ? new Date().toISOString() : order.shippedAt,
        deliveredAt: newStatus === "delivered" ? new Date().toISOString() : undefined,
      };

      // Manually update the order with tracking info
      const orders = merchStore.orders.map((o) =>
        o.id === order.id ? updatedOrder : o
      );
      useMerchStore.setState({ orders });

      // Send notification
      await notifyOrderStatusChange(updatedOrder, previousStatus, newStatus);
    } else {
      // Send notification without tracking
      await notifyOrderStatusChange(order, previousStatus, newStatus);
    }

    console.log(`[Webhooks] Gelato order ${order.orderNumber} updated: ${previousStatus} → ${newStatus}`);

    return {
      success: true,
      message: `Order ${order.orderNumber} status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error("[Webhooks] Error handling Gelato webhook:", error);
    return { success: false, message: String(error) };
  }
}

// ===================
// WEBHOOK ROUTER
// ===================

/**
 * Route webhook to appropriate handler based on provider
 */
export async function handleWebhook(
  provider: "printful" | "printify" | "gelato",
  payload: any
): Promise<{ success: boolean; message: string }> {
  try {
    switch (provider) {
      case "printful":
        return await handlePrintfulWebhook(payload as PrintfulWebhook);
      case "printify":
        return await handlePrintifyWebhook(payload as PrintifyWebhook);
      case "gelato":
        return await handleGelatoWebhook(payload as GelatoWebhook);
      default:
        return { success: false, message: "Unknown provider" };
    }
  } catch (error) {
    console.error("[Webhooks] Error routing webhook:", error);
    return { success: false, message: String(error) };
  }
}

// ===================
// WEBHOOK VERIFICATION
// ===================

/**
 * Verify Printful webhook signature
 */
export function verifyPrintfulWebhook(payload: string, signature: string, secret: string): boolean {
  // In production, implement HMAC signature verification
  // const crypto = require('crypto');
  // const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // return hash === signature;

  console.log("[Webhooks] Printful webhook signature verification (mock)");
  return true; // Mock verification for now
}

/**
 * Verify Printify webhook signature
 */
export function verifyPrintifyWebhook(payload: string, signature: string, secret: string): boolean {
  // In production, implement HMAC signature verification
  console.log("[Webhooks] Printify webhook signature verification (mock)");
  return true; // Mock verification for now
}

/**
 * Verify Gelato webhook signature
 */
export function verifyGelatoWebhook(payload: string, signature: string, secret: string): boolean {
  // In production, implement signature verification per Gelato docs
  console.log("[Webhooks] Gelato webhook signature verification (mock)");
  return true; // Mock verification for now
}
