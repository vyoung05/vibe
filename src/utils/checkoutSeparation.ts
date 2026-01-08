/**
 * Checkout Separation Utility
 * Ensures RevenueCat (digital subscriptions) and Physical Merch orders never mix
 */

import type { MerchOrder } from "../types/printify";

// ===================
// TYPES
// ===================

export type CheckoutType = "digital" | "physical";

export interface CheckoutGuard {
  allowed: boolean;
  reason?: string;
}

// ===================
// GUARDS
// ===================

/**
 * Validate that a checkout session is exclusively digital or physical
 * NEVER allow mixing digital subscriptions with physical products
 */
export function validateCheckoutType(
  hasDigitalItems: boolean,
  hasPhysicalItems: boolean
): CheckoutGuard {
  // Both types in same cart = violation
  if (hasDigitalItems && hasPhysicalItems) {
    return {
      allowed: false,
      reason:
        "Cannot mix digital subscriptions with physical products. Please checkout separately.",
    };
  }

  // Empty cart
  if (!hasDigitalItems && !hasPhysicalItems) {
    return {
      allowed: false,
      reason: "Cart is empty",
    };
  }

  // Valid: exclusively one type
  return {
    allowed: true,
  };
}

/**
 * Check if an order is a physical merch order
 */
export function isPhysicalOrder(order: MerchOrder): boolean {
  return order.items.length > 0 && !!order.shippingAddress;
}

/**
 * Check if an order is a digital subscription order
 * Digital orders should NOT have:
 * - Physical items
 * - Shipping addresses
 * - POD provider connections
 */
export function isDigitalOrder(order: any): boolean {
  // Digital orders won't have these physical-only properties
  return !order.shippingAddress && !order.items;
}

/**
 * Prevent RevenueCat purchases in physical checkout flow
 */
export function guardRevenueCatInPhysicalCheckout(
  checkoutType: CheckoutType
): CheckoutGuard {
  if (checkoutType === "physical") {
    return {
      allowed: false,
      reason:
        "RevenueCat subscriptions cannot be purchased during physical checkout. Please use the subscription/billing screen.",
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Prevent physical items in RevenueCat checkout flow
 */
export function guardPhysicalItemsInDigitalCheckout(
  checkoutType: CheckoutType
): CheckoutGuard {
  if (checkoutType === "digital") {
    return {
      allowed: false,
      reason:
        "Physical merchandise cannot be purchased with subscriptions. Please checkout separately in the Merch Store.",
    };
  }

  return {
    allowed: true,
  };
}

// ===================
// CART VALIDATION
// ===================

/**
 * Validate entire cart before checkout
 */
export function validateCartSeparation(cart: {
  digitalItems: any[];
  physicalItems: any[];
}): CheckoutGuard {
  const hasDigital = cart.digitalItems.length > 0;
  const hasPhysical = cart.physicalItems.length > 0;

  return validateCheckoutType(hasDigital, hasPhysical);
}

// ===================
// PAYMENT SEPARATION
// ===================

/**
 * Ensure payment methods are used correctly
 * - RevenueCat handles its own payments through native app stores
 * - Physical products use Stripe, Apple Pay, etc. but NOT RevenueCat
 */
export function validatePaymentMethod(
  checkoutType: CheckoutType,
  paymentMethod: "revenuecat" | "stripe" | "apple_pay" | "google_pay"
): CheckoutGuard {
  // RevenueCat can ONLY be used for digital subscriptions
  if (paymentMethod === "revenuecat" && checkoutType === "physical") {
    return {
      allowed: false,
      reason: "RevenueCat is only for digital subscriptions, not physical products.",
    };
  }

  // Physical products cannot use RevenueCat
  if (checkoutType === "physical" && paymentMethod === "revenuecat") {
    return {
      allowed: false,
      reason: "Physical products must be purchased with Stripe, Apple Pay, or Google Pay.",
    };
  }

  return {
    allowed: true,
  };
}

// ===================
// ORDER PROCESSING
// ===================

/**
 * Guard against sending digital orders to POD providers
 */
export function guardDigitalOrderToPOD(order: MerchOrder | any): CheckoutGuard {
  // If order has no physical items, it should NOT go to POD
  if (!order.items || order.items.length === 0) {
    return {
      allowed: false,
      reason: "Digital orders cannot be sent to print-on-demand providers.",
    };
  }

  // If order has no shipping address, it's digital
  if (!order.shippingAddress) {
    return {
      allowed: false,
      reason: "Orders without shipping addresses cannot be sent to fulfillment.",
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Guard against processing physical orders through RevenueCat
 */
export function guardPhysicalOrderToRevenueCat(order: MerchOrder): CheckoutGuard {
  if (isPhysicalOrder(order)) {
    return {
      allowed: false,
      reason: "Physical merchandise orders cannot be processed through RevenueCat.",
    };
  }

  return {
    allowed: true,
  };
}

// ===================
// USER INTERFACE GUARDS
// ===================

/**
 * Should the RevenueCat subscription UI be shown?
 * Only show if no physical items in cart
 */
export function shouldShowRevenueCatUI(hasPhysicalItemsInCart: boolean): boolean {
  return !hasPhysicalItemsInCart;
}

/**
 * Should the physical checkout UI be shown?
 * Only show if no digital items in cart
 */
export function shouldShowPhysicalCheckoutUI(hasDigitalItemsInCart: boolean): boolean {
  return !hasDigitalItemsInCart;
}

// ===================
// LOGGING & MONITORING
// ===================

/**
 * Log separation violation for monitoring
 */
export function logSeparationViolation(
  userId: string,
  violationType: string,
  details: string
): void {
  console.error("[CheckoutSeparation] VIOLATION DETECTED", {
    userId,
    violationType,
    details,
    timestamp: new Date().toISOString(),
  });

  // In production, send to monitoring service (Sentry, Datadog, etc.)
  // Example: Sentry.captureMessage('Checkout separation violation', { level: 'error', extra: { userId, violationType, details }});
}

// ===================
// EXAMPLE USAGE
// ===================

/**
 * Example: Validating a cart before checkout
 *
 * const cart = {
 *   digitalItems: [subscription],
 *   physicalItems: [tshirt, mug]
 * };
 *
 * const validation = validateCartSeparation(cart);
 * if (!validation.allowed) {
 *   alert(validation.reason); // "Cannot mix digital subscriptions with physical products..."
 *   return;
 * }
 *
 * // Proceed with checkout
 */

/**
 * Example: Validating payment method
 *
 * const paymentValidation = validatePaymentMethod('physical', 'revenuecat');
 * if (!paymentValidation.allowed) {
 *   alert(paymentValidation.reason); // "RevenueCat is only for digital subscriptions..."
 *   return;
 * }
 */

/**
 * Example: Guard before sending to POD
 *
 * const podGuard = guardDigitalOrderToPOD(order);
 * if (!podGuard.allowed) {
 *   console.error(podGuard.reason);
 *   return;
 * }
 *
 * // Safe to send to Printful/Printify/Gelato
 * await podManager.createOrder('printify', order);
 */
