// Stripe Client Configuration
import { loadStripe, Stripe } from "@stripe/stripe-js";

// Get publishable key from environment
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

if (!STRIPE_PUBLISHABLE_KEY) {
  console.warn(
    "[Stripe] Warning: Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable. " +
    "Stripe payments will not work until this is configured."
  );
}

// Singleton promise for Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get the Stripe instance (singleton pattern)
 * Returns null if Stripe is not configured
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise || Promise.resolve(null);
};

/**
 * Check if Stripe is configured
 */
export const isStripeConfigured = (): boolean => {
  return !!STRIPE_PUBLISHABLE_KEY;
};

/**
 * Format amount for Stripe (converts dollars to cents)
 */
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

/**
 * Format amount from Stripe (converts cents to dollars)
 */
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};
