/**
 * Provider Routing Rules System
 * Determines which POD provider fulfills which products
 */

import type { PODProvider } from "../utils/podManager";
import type { MerchCategory } from "../types/printify";

// ===================
// TYPES
// ===================

export interface ProviderRoutingRule {
  id: string;
  name: string;
  description: string;
  priority: number; // Lower number = higher priority
  isActive: boolean;

  // Conditions
  conditions: {
    categories?: MerchCategory[];
    productIds?: string[];
    streamerIds?: string[];
    priceRange?: {
      min?: number;
      max?: number;
    };
    tags?: string[];
  };

  // Action
  provider: PODProvider;
  fallbackProvider?: PODProvider;

  createdAt: string;
  updatedAt: string;
}

export interface ProviderConnectionAccess {
  streamerId: string;
  streamerName: string;
  allowedProviders: PODProvider[];
  canConnectPrintful: boolean;
  canConnectPrintify: boolean;
  canConnectGelato: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupRule {
  id: string;
  name: string;
  description: string;
  isGlobal: boolean; // Global rule applies to all products

  // If not global, specify which products
  productIds?: string[];
  categories?: MerchCategory[];
  streamerIds?: string[];

  // Markup settings
  markupType: "percentage" | "fixed";
  markupValue: number; // Percentage (e.g., 50 for 50%) or fixed dollar amount

  // Optional overrides
  platformFeeOverride?: number; // Override platform fee percentage

  priority: number;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
}

// ===================
// ROUTING ENGINE
// ===================

/**
 * Determine which provider should fulfill a product
 */
export function determineProductProvider(
  productId: string,
  category: MerchCategory,
  streamerId: string,
  price: number,
  tags: string[],
  rules: ProviderRoutingRule[]
): PODProvider {
  // Sort rules by priority (lower number = higher priority)
  const activeRules = rules.filter((r) => r.isActive).sort((a, b) => a.priority - b.priority);

  for (const rule of activeRules) {
    const conditions = rule.conditions;

    // Check if this rule applies to this product
    let matches = true;

    // Check category
    if (conditions.categories && conditions.categories.length > 0) {
      if (!conditions.categories.includes(category)) {
        matches = false;
      }
    }

    // Check specific product IDs
    if (conditions.productIds && conditions.productIds.length > 0) {
      if (!conditions.productIds.includes(productId)) {
        matches = false;
      }
    }

    // Check streamer
    if (conditions.streamerIds && conditions.streamerIds.length > 0) {
      if (!conditions.streamerIds.includes(streamerId)) {
        matches = false;
      }
    }

    // Check price range
    if (conditions.priceRange) {
      if (conditions.priceRange.min !== undefined && price < conditions.priceRange.min) {
        matches = false;
      }
      if (conditions.priceRange.max !== undefined && price > conditions.priceRange.max) {
        matches = false;
      }
    }

    // Check tags
    if (conditions.tags && conditions.tags.length > 0) {
      const hasMatchingTag = conditions.tags.some((tag) => tags.includes(tag));
      if (!hasMatchingTag) {
        matches = false;
      }
    }

    if (matches) {
      console.log(`[ProviderRouting] Product ${productId} matched rule: ${rule.name} → ${rule.provider}`);
      return rule.provider;
    }
  }

  // Default to printify if no rules match
  console.log(`[ProviderRouting] No rules matched for product ${productId}, using default: printify`);
  return "printify";
}

/**
 * Check if a streamer has access to a specific provider
 */
export function hasProviderAccess(
  streamerId: string,
  provider: PODProvider,
  accessRules: ProviderConnectionAccess[]
): boolean {
  const access = accessRules.find((a) => a.streamerId === streamerId);

  if (!access) {
    // No specific rules = full access by default
    return true;
  }

  return access.allowedProviders.includes(provider);
}

/**
 * Calculate product markup based on rules
 */
export function calculateProductMarkup(
  productId: string,
  category: MerchCategory,
  streamerId: string,
  basePrice: number,
  markupRules: MarkupRule[]
): {
  markupAmount: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  finalPrice: number;
} {
  // Find applicable rule (highest priority first)
  const activeRules = markupRules
    .filter((r) => r.isActive)
    .sort((a, b) => a.priority - b.priority);

  let appliedRule: MarkupRule | undefined;

  for (const rule of activeRules) {
    // Check if global rule
    if (rule.isGlobal) {
      appliedRule = rule;
      break;
    }

    // Check specific conditions
    let matches = false;

    if (rule.productIds && rule.productIds.includes(productId)) {
      matches = true;
    }

    if (rule.categories && rule.categories.includes(category)) {
      matches = true;
    }

    if (rule.streamerIds && rule.streamerIds.includes(streamerId)) {
      matches = true;
    }

    if (matches) {
      appliedRule = rule;
      break;
    }
  }

  // Calculate markup
  let markupAmount = 0;

  if (appliedRule) {
    if (appliedRule.markupType === "percentage") {
      markupAmount = basePrice * (appliedRule.markupValue / 100);
    } else {
      markupAmount = appliedRule.markupValue;
    }
  } else {
    // Default 50% markup if no rules apply
    markupAmount = basePrice * 0.5;
  }

  // Calculate platform fee
  const platformFeePercentage = appliedRule?.platformFeeOverride || 12; // 12% default
  const subtotal = basePrice + markupAmount;
  const platformFeeAmount = subtotal * (platformFeePercentage / 100);

  const finalPrice = subtotal + platformFeeAmount;

  return {
    markupAmount,
    platformFeePercentage,
    platformFeeAmount,
    finalPrice,
  };
}

// ===================
// DEFAULT RULES
// ===================

/**
 * Create default routing rules for a new platform
 */
export function createDefaultRoutingRules(): ProviderRoutingRule[] {
  const now = new Date().toISOString();

  return [
    {
      id: "rule-default-printify",
      name: "Default - Use Printify",
      description: "Send all products to Printify by default",
      priority: 999, // Lowest priority (catch-all)
      isActive: true,
      conditions: {},
      provider: "printify",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rule-premium-printful",
      name: "Premium Products - Use Printful",
      description: "Send products over $50 to Printful for premium quality",
      priority: 1,
      isActive: false, // Disabled by default
      conditions: {
        priceRange: {
          min: 50,
        },
      },
      provider: "printful",
      fallbackProvider: "printify",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rule-international-gelato",
      name: "International - Use Gelato",
      description: "Use Gelato for international shipping",
      priority: 2,
      isActive: false, // Disabled by default
      conditions: {
        categories: ["posters", "stickers"],
      },
      provider: "gelato",
      fallbackProvider: "printify",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/**
 * Create default markup rules
 */
export function createDefaultMarkupRules(): MarkupRule[] {
  const now = new Date().toISOString();

  return [
    {
      id: "markup-global-50",
      name: "Global 50% Markup",
      description: "Apply 50% markup to all products",
      isGlobal: true,
      markupType: "percentage",
      markupValue: 50,
      priority: 999,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "markup-premium-70",
      name: "Premium Products 70% Markup",
      description: "Higher markup for premium categories",
      isGlobal: false,
      categories: ["apparel", "bags"],
      markupType: "percentage",
      markupValue: 70,
      priority: 1,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "markup-accessories-fixed",
      name: "Accessories $10 Fixed Markup",
      description: "Fixed $10 markup for small accessories",
      isGlobal: false,
      categories: ["stickers", "phone_cases"],
      markupType: "fixed",
      markupValue: 10,
      priority: 2,
      isActive: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
