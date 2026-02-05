// Stripe Checkout Integration
import { supabase } from "../lib/supabase";
import { getStripe, isStripeConfigured, formatAmountForStripe } from "../lib/stripe";
import type { MerchOrder } from "../types/printify";

interface CheckoutItem {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  image?: string;
}

interface CreateCheckoutParams {
  order: MerchOrder;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

/**
 * Create a Stripe Checkout session via Supabase Edge Function
 */
export const createCheckoutSession = async ({
  order,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<CheckoutResult> => {
  try {
    if (!isStripeConfigured()) {
      return {
        success: false,
        error: "Stripe is not configured. Please add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
      };
    }

    // Build items array for checkout
    const items: CheckoutItem[] = order.items.map((item) => ({
      name: item.productTitle,
      description: `${item.variantTitle}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
      quantity: item.quantity,
      price: item.basePrice,
      image: item.productImage,
    }));

    // Call Supabase Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items,
        customerEmail: order.userEmail,
        shippingCost: order.shippingCost,
        tax: order.tax,
        successUrl,
        cancelUrl,
        metadata: {
          user_id: order.userId,
          user_name: order.userName,
        },
      },
    });

    if (error) {
      console.error("[StripeCheckout] Error from edge function:", error);
      return {
        success: false,
        error: error.message || "Failed to create checkout session",
      };
    }

    if (!data?.url) {
      return {
        success: false,
        error: "No checkout URL returned",
      };
    }

    return {
      success: true,
      sessionId: data.sessionId,
      url: data.url,
    };
  } catch (error) {
    console.error("[StripeCheckout] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Redirect to Stripe Checkout
 */
export const redirectToCheckout = async (sessionId: string): Promise<void> => {
  const stripe = await getStripe();

  if (!stripe) {
    throw new Error("Stripe not initialized");
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Open Stripe Checkout URL in new window/redirect
 * This is the simpler approach for web - just redirect to the URL
 */
export const openCheckoutUrl = (url: string): void => {
  // For web, we can just redirect
  if (typeof window !== "undefined") {
    window.location.href = url;
  }
};

/**
 * Verify payment was successful (call after redirect back)
 * This should ideally be verified via webhook, but this is a client-side check
 */
export const verifyCheckoutSession = async (sessionId: string): Promise<{
  success: boolean;
  paymentStatus?: string;
  error?: string;
}> => {
  try {
    // Call edge function to verify session
    const { data, error } = await supabase.functions.invoke("verify-checkout", {
      body: { sessionId },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: data?.paymentStatus === "paid",
      paymentStatus: data?.paymentStatus,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
