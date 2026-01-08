/**
 * Notification Service for Order Updates
 * Handles email/SMS notifications for order status changes
 */

import type { MerchOrder, MerchOrderStatus } from "../types/printify";

export interface NotificationConfig {
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export interface OrderNotificationData {
  order: MerchOrder;
  config: NotificationConfig;
  notificationType: "confirmation" | "shipped" | "delivered" | "exception" | "cancelled";
}

/**
 * Send order confirmation notification
 */
export async function sendOrderConfirmation(
  order: MerchOrder,
  config: NotificationConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[NotificationService] Sending order confirmation...");

    const emailContent = generateOrderConfirmationEmail(order, config);

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, we'll log and return success
    console.log("[NotificationService] Order confirmation email generated");
    console.log("To:", config.userEmail);
    console.log("Subject:", `Order Confirmation - ${order.orderNumber}`);

    // If phone provided, send SMS
    if (config.userPhone) {
      const smsContent = generateOrderConfirmationSMS(order);
      console.log("[NotificationService] SMS notification generated");
      console.log("To:", config.userPhone);
      console.log("Message:", smsContent);
    }

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Failed to send order confirmation:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send shipping notification
 */
export async function sendShippingNotification(
  order: MerchOrder,
  config: NotificationConfig,
  trackingNumber?: string,
  trackingUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[NotificationService] Sending shipping notification...");

    const emailContent = generateShippingEmail(order, config, trackingNumber, trackingUrl);

    console.log("[NotificationService] Shipping email generated");
    console.log("To:", config.userEmail);
    console.log("Subject:", `Your Order Has Shipped - ${order.orderNumber}`);

    if (config.userPhone && trackingNumber) {
      const smsContent = generateShippingSMS(order, trackingNumber, trackingUrl);
      console.log("[NotificationService] SMS notification generated");
      console.log("To:", config.userPhone);
      console.log("Message:", smsContent);
    }

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Failed to send shipping notification:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send delivery confirmation notification
 */
export async function sendDeliveryNotification(
  order: MerchOrder,
  config: NotificationConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[NotificationService] Sending delivery notification...");

    const emailContent = generateDeliveryEmail(order, config);

    console.log("[NotificationService] Delivery email generated");
    console.log("To:", config.userEmail);
    console.log("Subject:", `Your Order Has Been Delivered - ${order.orderNumber}`);

    if (config.userPhone) {
      const smsContent = generateDeliverySMS(order);
      console.log("[NotificationService] SMS notification generated");
      console.log("To:", config.userPhone);
      console.log("Message:", smsContent);
    }

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Failed to send delivery notification:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send exception/error notification
 */
export async function sendExceptionNotification(
  order: MerchOrder,
  config: NotificationConfig,
  exceptionMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[NotificationService] Sending exception notification...");

    const emailContent = generateExceptionEmail(order, config, exceptionMessage);

    console.log("[NotificationService] Exception email generated");
    console.log("To:", config.userEmail);
    console.log("Subject:", `Issue with Your Order - ${order.orderNumber}`);

    if (config.userPhone) {
      const smsContent = `Order ${order.orderNumber} has an issue: ${exceptionMessage}. Check your email for details.`;
      console.log("[NotificationService] SMS notification generated");
      console.log("To:", config.userPhone);
      console.log("Message:", smsContent);
    }

    return { success: true };
  } catch (error) {
    console.error("[NotificationService] Failed to send exception notification:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send order status update notification
 * Master function that routes to appropriate notification type
 */
export async function notifyOrderStatusChange(
  order: MerchOrder,
  previousStatus: MerchOrderStatus,
  newStatus: MerchOrderStatus
): Promise<{ success: boolean; error?: string }> {
  const config: NotificationConfig = {
    userEmail: order.userEmail,
    userName: order.userName,
    userPhone: order.shippingAddress.phone,
  };

  try {
    console.log(`[NotificationService] Order status changed: ${previousStatus} → ${newStatus}`);

    switch (newStatus) {
      case "payment_confirmed":
        return await sendOrderConfirmation(order, config);

      case "shipped":
        return await sendShippingNotification(
          order,
          config,
          order.trackingNumber,
          order.trackingUrl
        );

      case "delivered":
        return await sendDeliveryNotification(order, config);

      case "cancelled":
      case "refunded":
        return await sendExceptionNotification(
          order,
          config,
          `Your order has been ${newStatus}`
        );

      default:
        console.log(`[NotificationService] No notification needed for status: ${newStatus}`);
        return { success: true };
    }
  } catch (error) {
    console.error("[NotificationService] Failed to notify order status change:", error);
    return { success: false, error: String(error) };
  }
}

// ===================
// EMAIL TEMPLATES
// ===================

function generateOrderConfirmationEmail(
  order: MerchOrder,
  config: NotificationConfig
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .order-details { background: #f4f4f4; padding: 15px; margin: 20px 0; }
    .items { margin: 20px 0; }
    .item { border-bottom: 1px solid #ddd; padding: 10px 0; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>

    <p>Hi ${config.userName},</p>
    <p>Thank you for your order! We've received your order and it's being prepared for shipment.</p>

    <div class="order-details">
      <h2>Order Details</h2>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    </div>

    <div class="items">
      <h3>Items</h3>
      ${order.items
        .map(
          (item) => `
        <div class="item">
          <strong>${item.productTitle}</strong><br>
          ${item.variantTitle} - Qty: ${item.quantity}<br>
          Price: $${item.finalPrice.toFixed(2)}
        </div>
      `
        )
        .join("")}
    </div>

    <div class="order-details">
      <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
      ${order.promotionDiscount > 0 ? `<p><strong>Discount:</strong> -$${order.promotionDiscount.toFixed(2)}</p>` : ""}
      <p><strong>Shipping:</strong> $${order.shippingCost.toFixed(2)}</p>
      <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
      <p class="total">Total: $${order.total.toFixed(2)}</p>
    </div>

    <div class="order-details">
      <h3>Shipping Address</h3>
      <p>
        ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
        ${order.shippingAddress.address1}<br>
        ${order.shippingAddress.address2 ? `${order.shippingAddress.address2}<br>` : ""}
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}<br>
        ${order.shippingAddress.country}
      </p>
    </div>

    <p>You'll receive another email with tracking information once your order ships.</p>

    <div class="footer">
      <p>Questions? Contact us at support@ddns.com</p>
      <p>&copy; 2026 DDNS - Day Dreamers Night Streamers</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateShippingEmail(
  order: MerchOrder,
  config: NotificationConfig,
  trackingNumber?: string,
  trackingUrl?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10B981; color: white; padding: 20px; text-align: center; }
    .tracking { background: #f0fdf4; border: 2px solid #10B981; padding: 20px; margin: 20px 0; text-align: center; }
    .tracking-button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
    .order-details { background: #f4f4f4; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order Has Shipped!</h1>
    </div>

    <p>Hi ${config.userName},</p>
    <p>Great news! Your order <strong>#${order.orderNumber}</strong> is on its way to you.</p>

    ${
      trackingNumber
        ? `
    <div class="tracking">
      <h2>Track Your Package</h2>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      ${trackingUrl ? `<a href="${trackingUrl}" class="tracking-button">Track Package</a>` : ""}
    </div>
    `
        : ""
    }

    <div class="order-details">
      <h3>Order Summary</h3>
      ${order.items
        .map(
          (item) => `
        <p><strong>${item.productTitle}</strong> - ${item.variantTitle} (x${item.quantity})</p>
      `
        )
        .join("")}
    </div>

    <div class="order-details">
      <h3>Shipping To</h3>
      <p>
        ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
        ${order.shippingAddress.address1}<br>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
      </p>
      ${order.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString()}</p>` : ""}
    </div>

    <p>Thanks for supporting your favorite streamers!</p>

    <div class="footer">
      <p>Questions? Contact us at support@ddns.com</p>
      <p>&copy; 2026 DDNS - Day Dreamers Night Streamers</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateDeliveryEmail(order: MerchOrder, config: NotificationConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
    .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
    .order-details { background: #f4f4f4; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Order Has Been Delivered!</h1>
    </div>

    <div class="celebration">📦✨</div>

    <p>Hi ${config.userName},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been delivered!</p>

    <div class="order-details">
      <h3>Order Summary</h3>
      ${order.items
        .map(
          (item) => `
        <p><strong>${item.productTitle}</strong> - ${item.variantTitle} (x${item.quantity})</p>
      `
        )
        .join("")}
    </div>

    <p>We hope you love your new merch! If you have any issues with your order, please contact us within 14 days.</p>

    <p>Thank you for supporting your favorite streamers!</p>

    <div class="footer">
      <p>Questions? Contact us at support@ddns.com</p>
      <p>&copy; 2026 DDNS - Day Dreamers Night Streamers</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateExceptionEmail(
  order: MerchOrder,
  config: NotificationConfig,
  exceptionMessage: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
    .alert { background: #FEF2F2; border: 2px solid #EF4444; padding: 20px; margin: 20px 0; }
    .order-details { background: #f4f4f4; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Update About Your Order</h1>
    </div>

    <p>Hi ${config.userName},</p>
    <p>We're writing to inform you about an update regarding your order <strong>#${order.orderNumber}</strong>.</p>

    <div class="alert">
      <h3>What Happened</h3>
      <p>${exceptionMessage}</p>
    </div>

    <div class="order-details">
      <h3>Order Details</h3>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    </div>

    <p>Our support team will reach out to you within 24 hours to resolve this issue. If you have any immediate questions, please contact us at support@ddns.com.</p>

    <p>We apologize for any inconvenience.</p>

    <div class="footer">
      <p>Questions? Contact us at support@ddns.com</p>
      <p>&copy; 2026 DDNS - Day Dreamers Night Streamers</p>
    </div>
  </div>
</body>
</html>
  `;
}

// ===================
// SMS TEMPLATES
// ===================

function generateOrderConfirmationSMS(order: MerchOrder): string {
  return `DDNS: Order #${order.orderNumber} confirmed! Total: $${order.total.toFixed(2)}. You'll receive tracking info when it ships.`;
}

function generateShippingSMS(
  order: MerchOrder,
  trackingNumber?: string,
  trackingUrl?: string
): string {
  if (trackingNumber && trackingUrl) {
    return `DDNS: Your order #${order.orderNumber} has shipped! Track: ${trackingUrl}`;
  }
  return `DDNS: Your order #${order.orderNumber} has shipped! Check your email for tracking details.`;
}

function generateDeliverySMS(order: MerchOrder): string {
  return `DDNS: Your order #${order.orderNumber} has been delivered! Enjoy your new merch!`;
}
