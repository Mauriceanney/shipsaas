# Epic 4: Payments - Technical Architecture Document

**Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Ready for Implementation
**Epic**: Stripe Integration for Subscriptions and Billing

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Type Definitions](#3-type-definitions)
4. [Stripe SDK Configuration](#4-stripe-sdk-configuration)
5. [API Routes](#5-api-routes)
6. [Server Actions](#6-server-actions)
7. [Webhook Handler](#7-webhook-handler)
8. [Component Architecture](#8-component-architecture)
9. [Security Patterns](#9-security-patterns)
10. [Integration Points](#10-integration-points)
11. [Testing Strategy](#11-testing-strategy)
12. [Environment Configuration](#12-environment-configuration)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Overview

### 1.1 Purpose

This document outlines the technical architecture for implementing Stripe-based subscription payments in the SaaS boilerplate. The implementation enables:

- Subscription checkout via Stripe Checkout
- Subscription management through Stripe Customer Portal
- Real-time subscription synchronization via webhooks
- Pricing page with plan comparison

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Payment Provider | Stripe | API 2024-12 |
| Stripe SDK | stripe (Node.js) | ^17.3.1 |
| Framework | Next.js | 15.x (App Router) |
| Database ORM | Prisma | 5.x |
| Authentication | Auth.js (next-auth) | 5.x |
| Validation | Zod | 3.x |

### 1.3 Key Design Decisions

1. **Stripe Checkout**: Use hosted checkout for PCI compliance simplicity
2. **Customer Portal**: Use Stripe-hosted portal for subscription management
3. **Webhook-Driven**: All subscription state changes flow through webhooks
4. **User-Subscription Mapping**: One subscription per user (1:1 relationship)
5. **Idempotent Processing**: Webhook handlers must be idempotent

### 1.4 Existing Infrastructure

The codebase already has:

- **Subscription model** in Prisma with Stripe-compatible fields
- **Environment variables** defined for Stripe keys and price IDs
- **Stripe SDK** installed (`stripe: ^17.3.1`)
- **Auth system** with session management

---

## 2. File Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── pricing/
│   │   │   └── page.tsx                 # Public pricing page
│   │   └── checkout/
│   │       └── success/
│   │           └── page.tsx             # Checkout success page
│   │
│   ├── (dashboard)/
│   │   └── settings/
│   │       └── billing/
│   │           └── page.tsx             # User billing settings
│   │
│   └── api/
│       ├── stripe/
│       │   ├── checkout/
│       │   │   └── route.ts             # POST - Create checkout session
│       │   ├── portal/
│       │   │   └── route.ts             # POST - Create portal session
│       │   └── subscription/
│       │       └── route.ts             # GET - Get subscription status
│       │
│       └── webhooks/
│           └── stripe/
│               └── route.ts             # POST - Handle Stripe webhooks
│
├── actions/
│   └── stripe/
│       ├── index.ts                     # Re-exports
│       ├── create-checkout.ts           # Server action for checkout
│       └── create-portal.ts             # Server action for portal
│
├── components/
│   ├── pricing/
│   │   ├── index.ts                     # Re-exports
│   │   ├── pricing-card.tsx             # Individual plan card
│   │   ├── pricing-toggle.tsx           # Monthly/yearly toggle
│   │   ├── pricing-table.tsx            # Full pricing comparison
│   │   └── pricing-feature-list.tsx     # Feature list component
│   │
│   └── billing/
│       ├── index.ts                     # Re-exports
│       ├── subscription-status.tsx      # Current subscription display
│       ├── billing-card.tsx             # Billing info card
│       └── manage-subscription-button.tsx
│
├── lib/
│   └── stripe/
│       ├── index.ts                     # Main exports
│       ├── client.ts                    # Stripe client singleton
│       ├── config.ts                    # Plans and pricing configuration
│       ├── utils.ts                     # Helper functions
│       ├── webhooks.ts                  # Webhook event handlers
│       └── types.ts                     # Stripe-specific types
│
└── types/
    └── stripe.ts                        # Stripe type definitions

tests/
├── unit/
│   └── lib/
│       └── stripe/
│           ├── utils.test.ts
│           ├── config.test.ts
│           └── webhooks.test.ts
│
└── integration/
    └── api/
        └── stripe/
            ├── checkout.test.ts
            ├── portal.test.ts
            └── webhooks.test.ts
```

---

## 3. Type Definitions

### 3.1 Core Stripe Types (`src/lib/stripe/types.ts`)

```typescript
import type { Plan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

// ============================================
// PLAN & PRICING TYPES
// ============================================

/**
 * Billing interval for subscriptions
 */
export type BillingInterval = "monthly" | "yearly";

/**
 * Stripe price IDs for a plan
 */
export interface PlanPrices {
  monthly: string;
  yearly: string;
}

/**
 * Plan configuration with pricing and features
 */
export interface PlanConfig {
  id: Plan;
  name: string;
  description: string;
  prices: PlanPrices;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Pricing display configuration
 */
export interface PricingDisplay {
  monthly: number;
  yearly: number;
  yearlySavingsPercent: number;
}

// ============================================
// CHECKOUT TYPES
// ============================================

/**
 * Input for creating a checkout session
 */
export interface CreateCheckoutInput {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Result of checkout session creation
 */
export interface CreateCheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Checkout session metadata stored in Stripe
 */
export interface CheckoutMetadata {
  userId: string;
}

// ============================================
// PORTAL TYPES
// ============================================

/**
 * Input for creating a portal session
 */
export interface CreatePortalInput {
  customerId: string;
  returnUrl?: string;
}

/**
 * Result of portal session creation
 */
export interface CreatePortalResult {
  url: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

/**
 * Subscription data for UI display
 */
export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: Plan;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Stripe subscription status to app status mapping
 */
export type StripeSubscriptionStatus = Stripe.Subscription.Status;

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Supported webhook event types
 */
export type SupportedWebhookEvent =
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed";

/**
 * Webhook handler function signature
 */
export type WebhookHandler<T = unknown> = (
  event: Stripe.Event,
  data: T
) => Promise<void>;

/**
 * Webhook processing result
 */
export interface WebhookResult {
  success: boolean;
  eventId: string;
  eventType: string;
  error?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Checkout API request body
 */
export interface CheckoutRequestBody {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout API response
 */
export interface CheckoutResponse {
  url: string;
  sessionId: string;
}

/**
 * Portal API request body
 */
export interface PortalRequestBody {
  returnUrl?: string;
}

/**
 * Portal API response
 */
export interface PortalResponse {
  url: string;
}

/**
 * Subscription status API response
 */
export interface SubscriptionStatusResponse {
  subscription: SubscriptionInfo | null;
}

/**
 * API error response
 */
export interface StripeApiError {
  error: string;
  code?: string;
}
```

### 3.2 Re-export for Convenience (`src/types/stripe.ts`)

```typescript
/**
 * Re-export Stripe types for convenience
 */
export type {
  BillingInterval,
  PlanPrices,
  PlanConfig,
  PricingDisplay,
  CreateCheckoutInput,
  CreateCheckoutResult,
  CreatePortalInput,
  CreatePortalResult,
  SubscriptionInfo,
  StripeSubscriptionStatus,
  SupportedWebhookEvent,
  WebhookHandler,
  WebhookResult,
  CheckoutRequestBody,
  CheckoutResponse,
  PortalRequestBody,
  PortalResponse,
  SubscriptionStatusResponse,
  StripeApiError,
} from "@/lib/stripe/types";
```

---

## 4. Stripe SDK Configuration

### 4.1 Stripe Client Singleton (`src/lib/stripe/client.ts`)

```typescript
import Stripe from "stripe";

/**
 * Stripe API version
 * Using the latest stable version as of implementation
 */
const STRIPE_API_VERSION = "2024-12-18.acacia" as const;

/**
 * Create Stripe client instance
 * Uses singleton pattern to avoid multiple instances
 */
function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not defined in environment variables"
    );
  }

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: {
      name: "ShipSaaS",
      version: "1.0.0",
    },
  });
}

// Singleton instance
let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance
 * Creates singleton on first call
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    stripeInstance = createStripeClient();
  }
  return stripeInstance;
}

/**
 * Direct export for convenience
 * Use this in most cases
 */
export const stripe = getStripeClient();
```

### 4.2 Plans and Pricing Configuration (`src/lib/stripe/config.ts`)

```typescript
import type { Plan } from "@prisma/client";
import type { PlanConfig, PlanPrices, BillingInterval } from "./types";

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

/**
 * Get and validate Stripe price IDs from environment
 */
function getStripePriceIds(): Record<Exclude<Plan, "FREE">, PlanPrices> {
  const priceIds = {
    PRO: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY ?? "",
    },
    ENTERPRISE: {
      monthly: process.env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY ?? "",
      yearly: process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY ?? "",
    },
  };

  // Validate in production
  if (process.env.NODE_ENV === "production") {
    const missing: string[] = [];

    if (!priceIds.PRO.monthly) missing.push("STRIPE_PRICE_ID_PRO_MONTHLY");
    if (!priceIds.PRO.yearly) missing.push("STRIPE_PRICE_ID_PRO_YEARLY");
    if (!priceIds.ENTERPRISE.monthly) missing.push("STRIPE_PRICE_ID_ENTERPRISE_MONTHLY");
    if (!priceIds.ENTERPRISE.yearly) missing.push("STRIPE_PRICE_ID_ENTERPRISE_YEARLY");

    if (missing.length > 0) {
      throw new Error(
        `Missing Stripe price IDs: ${missing.join(", ")}`
      );
    }
  }

  return priceIds;
}

/**
 * Stripe price IDs from environment
 */
export const STRIPE_PRICE_IDS = getStripePriceIds();

// ============================================
// PLAN CONFIGURATIONS
// ============================================

/**
 * Plan feature lists
 */
export const PLAN_FEATURES: Record<Plan, string[]> = {
  FREE: [
    "Basic features",
    "Community support",
    "1 project",
    "5GB storage",
  ],
  PRO: [
    "All Free features",
    "Priority email support",
    "Unlimited projects",
    "50GB storage",
    "Advanced analytics",
    "API access",
    "Custom integrations",
  ],
  ENTERPRISE: [
    "All Pro features",
    "24/7 dedicated support",
    "Unlimited storage",
    "Custom SLA",
    "Audit logs",
    "SSO (SAML)",
    "Custom contracts",
    "Dedicated account manager",
  ],
};

/**
 * Plan pricing (in dollars)
 */
export const PLAN_PRICING: Record<Exclude<Plan, "FREE">, { monthly: number; yearly: number }> = {
  PRO: {
    monthly: 19,
    yearly: 190, // ~17% savings
  },
  ENTERPRISE: {
    monthly: 99,
    yearly: 990, // ~17% savings
  },
};

/**
 * Full plan configurations
 */
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: "FREE",
    name: "Free",
    description: "For individuals getting started",
    prices: { monthly: "", yearly: "" },
    features: PLAN_FEATURES.FREE,
  },
  {
    id: "PRO",
    name: "Pro",
    description: "For professionals and small teams",
    prices: STRIPE_PRICE_IDS.PRO,
    features: PLAN_FEATURES.PRO,
    highlighted: true,
    badge: "Popular",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description: "For large organizations",
    prices: STRIPE_PRICE_IDS.ENTERPRISE,
    features: PLAN_FEATURES.ENTERPRISE,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get plan config by ID
 */
export function getPlanConfig(planId: Plan): PlanConfig | undefined {
  return PLAN_CONFIGS.find((p) => p.id === planId);
}

/**
 * Get price ID for a plan and interval
 */
export function getPriceId(plan: Plan, interval: BillingInterval): string | null {
  if (plan === "FREE") return null;
  return STRIPE_PRICE_IDS[plan][interval];
}

/**
 * Get all valid price IDs
 */
export function getAllPriceIds(): string[] {
  return [
    STRIPE_PRICE_IDS.PRO.monthly,
    STRIPE_PRICE_IDS.PRO.yearly,
    STRIPE_PRICE_IDS.ENTERPRISE.monthly,
    STRIPE_PRICE_IDS.ENTERPRISE.yearly,
  ].filter(Boolean);
}

/**
 * Check if a price ID is valid
 */
export function isValidPriceId(priceId: string): boolean {
  return getAllPriceIds().includes(priceId);
}

/**
 * Calculate yearly savings percentage
 */
export function calculateYearlySavings(monthly: number, yearly: number): number {
  const monthlyTotal = monthly * 12;
  const savings = ((monthlyTotal - yearly) / monthlyTotal) * 100;
  return Math.round(savings);
}

// ============================================
// URL CONFIGURATIONS
// ============================================

/**
 * Default URLs for checkout flow
 */
export const CHECKOUT_URLS = {
  success: "/checkout/success",
  cancel: "/pricing",
} as const;

/**
 * Default URL for portal return
 */
export const PORTAL_RETURN_URL = "/settings/billing";
```

### 4.3 Utility Functions (`src/lib/stripe/utils.ts`)

```typescript
import type { Plan, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";
import { STRIPE_PRICE_IDS } from "./config";

// ============================================
// STATUS MAPPING
// ============================================

/**
 * Map Stripe subscription status to app subscription status
 */
export function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "INACTIVE",
    incomplete: "INACTIVE",
    incomplete_expired: "INACTIVE",
    paused: "INACTIVE",
  };

  return statusMap[stripeStatus] ?? "INACTIVE";
}

// ============================================
// PLAN DETECTION
// ============================================

/**
 * Determine plan from Stripe price ID
 */
export function getPlanFromPriceId(priceId: string): Plan {
  // Check Pro prices
  if (
    priceId === STRIPE_PRICE_IDS.PRO.monthly ||
    priceId === STRIPE_PRICE_IDS.PRO.yearly
  ) {
    return "PRO";
  }

  // Check Enterprise prices
  if (
    priceId === STRIPE_PRICE_IDS.ENTERPRISE.monthly ||
    priceId === STRIPE_PRICE_IDS.ENTERPRISE.yearly
  ) {
    return "ENTERPRISE";
  }

  // Default to FREE for unknown prices
  return "FREE";
}

/**
 * Check if plan is paid
 */
export function isPaidPlan(plan: Plan): boolean {
  return plan !== "FREE";
}

/**
 * Check if subscription is active or trialing
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

// ============================================
// STRIPE DATA EXTRACTION
// ============================================

/**
 * Extract price ID from Stripe subscription
 */
export function extractPriceId(subscription: Stripe.Subscription): string | null {
  const item = subscription.items.data[0];
  return item?.price.id ?? null;
}

/**
 * Extract customer ID from various Stripe objects
 */
export function extractCustomerId(
  obj: { customer: string | Stripe.Customer | Stripe.DeletedCustomer | null }
): string | null {
  if (!obj.customer) return null;

  if (typeof obj.customer === "string") {
    return obj.customer;
  }

  return obj.customer.id;
}

/**
 * Extract subscription ID from checkout session
 */
export function extractSubscriptionId(
  session: Stripe.Checkout.Session
): string | null {
  if (!session.subscription) return null;

  if (typeof session.subscription === "string") {
    return session.subscription;
  }

  return session.subscription.id;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Convert Unix timestamp to Date
 */
export function unixToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Check if subscription period has ended
 */
export function hasSubscriptionExpired(periodEnd: Date | null): boolean {
  if (!periodEnd) return true;
  return periodEnd < new Date();
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate checkout metadata
 */
export function validateCheckoutMetadata(
  metadata: Stripe.Metadata | null
): { userId: string } | null {
  if (!metadata?.userId) {
    return null;
  }
  return { userId: metadata.userId };
}

/**
 * Validate webhook signature (wrapper for error handling)
 */
export function validateWebhookSignature(
  body: string,
  signature: string,
  secret: string,
  stripe: Stripe
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return null;
  }
}
```

### 4.4 Main Exports (`src/lib/stripe/index.ts`)

```typescript
/**
 * Stripe integration module
 *
 * This module provides:
 * - Stripe client singleton
 * - Plan and pricing configuration
 * - Utility functions for Stripe data
 * - Webhook handlers
 */

// Client
export { stripe, getStripeClient } from "./client";

// Configuration
export {
  STRIPE_PRICE_IDS,
  PLAN_FEATURES,
  PLAN_PRICING,
  PLAN_CONFIGS,
  CHECKOUT_URLS,
  PORTAL_RETURN_URL,
  getPlanConfig,
  getPriceId,
  getAllPriceIds,
  isValidPriceId,
  calculateYearlySavings,
} from "./config";

// Utilities
export {
  mapStripeStatus,
  getPlanFromPriceId,
  isPaidPlan,
  isActiveSubscription,
  extractPriceId,
  extractCustomerId,
  extractSubscriptionId,
  unixToDate,
  hasSubscriptionExpired,
  validateCheckoutMetadata,
  validateWebhookSignature,
} from "./utils";

// Webhook handlers
export {
  handleCheckoutCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  processWebhookEvent,
} from "./webhooks";

// Types
export type * from "./types";
```

---

## 5. API Routes

### 5.1 Checkout Session Route (`src/app/api/stripe/checkout/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isValidPriceId, CHECKOUT_URLS } from "@/lib/stripe";
import type { CheckoutRequestBody, CheckoutResponse, StripeApiError } from "@/lib/stripe/types";

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<StripeApiError>(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as CheckoutRequestBody;
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json<StripeApiError>(
        { error: "Price ID is required", code: "INVALID_PRICE_ID" },
        { status: 400 }
      );
    }

    if (!isValidPriceId(priceId)) {
      return NextResponse.json<StripeApiError>(
        { error: "Invalid price ID", code: "INVALID_PRICE_ID" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Use existing customer if available
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: session.user.email ?? undefined }),
      // URLs
      success_url: `${baseUrl}${successUrl || CHECKOUT_URLS.success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelUrl || CHECKOUT_URLS.cancel}`,
      // Metadata for webhook processing
      metadata: {
        userId: session.user.id,
      },
      // Subscription metadata
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address
      billing_address_collection: "auto",
    });

    if (!checkoutSession.url) {
      return NextResponse.json<StripeApiError>(
        { error: "Failed to create checkout session", code: "CHECKOUT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json<CheckoutResponse>({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to create checkout session", code: "CHECKOUT_FAILED" },
      { status: 500 }
    );
  }
}
```

### 5.2 Customer Portal Route (`src/app/api/stripe/portal/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PORTAL_RETURN_URL } from "@/lib/stripe";
import type { PortalRequestBody, PortalResponse, StripeApiError } from "@/lib/stripe/types";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<StripeApiError>(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Get user's subscription with Stripe customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json<StripeApiError>(
        { error: "No active subscription found", code: "NO_SUBSCRIPTION" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = (await request.json().catch(() => ({}))) as PortalRequestBody;
    const { returnUrl } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}${returnUrl || PORTAL_RETURN_URL}`,
    });

    return NextResponse.json<PortalResponse>({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to create portal session", code: "PORTAL_FAILED" },
      { status: 500 }
    );
  }
}
```

### 5.3 Subscription Status Route (`src/app/api/stripe/subscription/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isActiveSubscription } from "@/lib/stripe";
import type { SubscriptionStatusResponse, SubscriptionInfo, StripeApiError } from "@/lib/stripe/types";

/**
 * GET /api/stripe/subscription
 * Gets current user's subscription status
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json<StripeApiError>(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json<SubscriptionStatusResponse>({
        subscription: null,
      });
    }

    // Fetch cancel_at_period_end from Stripe if active subscription
    let cancelAtPeriodEnd = false;
    if (
      subscription.stripeSubscriptionId &&
      isActiveSubscription(subscription.status)
    ) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );
        cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      } catch {
        // Subscription might not exist in Stripe anymore
        console.warn("Failed to fetch Stripe subscription:", subscription.stripeSubscriptionId);
      }
    }

    const subscriptionInfo: SubscriptionInfo = {
      status: subscription.status,
      plan: subscription.plan,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    };

    return NextResponse.json<SubscriptionStatusResponse>({
      subscription: subscriptionInfo,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json<StripeApiError>(
      { error: "Failed to get subscription status", code: "SUBSCRIPTION_ERROR" },
      { status: 500 }
    );
  }
}
```

---

## 6. Server Actions

### 6.1 Create Checkout Action (`src/actions/stripe/create-checkout.ts`)

```typescript
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isValidPriceId, CHECKOUT_URLS } from "@/lib/stripe";
import type { Result } from "@/types";

export interface CreateCheckoutInput {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Server action to create a Stripe Checkout session and redirect
 */
export async function createCheckoutAction(
  input: CreateCheckoutInput
): Promise<Result<{ url: string }, string>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const { priceId, successUrl, cancelUrl } = input;

    // Validate price ID
    if (!priceId || !isValidPriceId(priceId)) {
      return { success: false, error: "Invalid price ID" };
    }

    // Get existing subscription for customer ID
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(subscription?.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : { customer_email: session.user.email ?? undefined }),
      success_url: `${baseUrl}${successUrl || CHECKOUT_URLS.success}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelUrl || CHECKOUT_URLS.cancel}`,
      metadata: {
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
        },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return { success: false, error: "Failed to create checkout session" };
    }

    return { success: true, data: { url: checkoutSession.url } };
  } catch (error) {
    console.error("Create checkout error:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

/**
 * Server action that redirects to Stripe Checkout
 */
export async function redirectToCheckout(priceId: string): Promise<void> {
  const result = await createCheckoutAction({ priceId });

  if (result.success) {
    redirect(result.data.url);
  } else {
    // Redirect to pricing with error
    redirect(`/pricing?error=${encodeURIComponent(result.error)}`);
  }
}
```

### 6.2 Create Portal Action (`src/actions/stripe/create-portal.ts`)

```typescript
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, PORTAL_RETURN_URL } from "@/lib/stripe";
import type { Result } from "@/types";

export interface CreatePortalInput {
  returnUrl?: string;
}

/**
 * Server action to create a Stripe Customer Portal session
 */
export async function createPortalAction(
  input?: CreatePortalInput
): Promise<Result<{ url: string }, string>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return { success: false, error: "No active subscription found" };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}${input?.returnUrl || PORTAL_RETURN_URL}`,
    });

    return { success: true, data: { url: portalSession.url } };
  } catch (error) {
    console.error("Create portal error:", error);
    return { success: false, error: "Failed to create portal session" };
  }
}

/**
 * Server action that redirects to Stripe Customer Portal
 */
export async function redirectToPortal(returnUrl?: string): Promise<void> {
  const result = await createPortalAction({ returnUrl });

  if (result.success) {
    redirect(result.data.url);
  } else {
    // Redirect to billing with error
    redirect(`/settings/billing?error=${encodeURIComponent(result.error)}`);
  }
}
```

### 6.3 Actions Index (`src/actions/stripe/index.ts`)

```typescript
export {
  createCheckoutAction,
  redirectToCheckout,
  type CreateCheckoutInput,
} from "./create-checkout";

export {
  createPortalAction,
  redirectToPortal,
  type CreatePortalInput,
} from "./create-portal";
```

---

## 7. Webhook Handler

### 7.1 Webhook Event Handlers (`src/lib/stripe/webhooks.ts`)

```typescript
import type Stripe from "stripe";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import {
  mapStripeStatus,
  getPlanFromPriceId,
  extractPriceId,
  extractCustomerId,
  extractSubscriptionId,
  unixToDate,
  validateCheckoutMetadata,
} from "./utils";
import { stripe } from "./client";
import type { SupportedWebhookEvent, WebhookResult } from "./types";

// ============================================
// CHECKOUT HANDLERS
// ============================================

/**
 * Handle checkout.session.completed event
 * Creates or updates subscription after successful checkout
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // Only handle subscription checkouts
  if (session.mode !== "subscription") {
    console.log("Skipping non-subscription checkout:", session.id);
    return;
  }

  // Validate metadata
  const metadata = validateCheckoutMetadata(session.metadata);
  if (!metadata) {
    console.error("Missing userId in checkout metadata:", session.id);
    return;
  }

  const customerId = extractCustomerId(session);
  const subscriptionId = extractSubscriptionId(session);

  if (!customerId || !subscriptionId) {
    console.error("Missing customer or subscription ID:", session.id);
    return;
  }

  // Fetch full subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = extractPriceId(stripeSubscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : "FREE";

  // Upsert subscription in database
  await db.subscription.upsert({
    where: { userId: metadata.userId },
    create: {
      userId: metadata.userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(stripeSubscription.current_period_end),
      status: mapStripeStatus(stripeSubscription.status),
      plan,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(stripeSubscription.current_period_end),
      status: mapStripeStatus(stripeSubscription.status),
      plan,
    },
  });

  console.log(`Subscription created/updated for user: ${metadata.userId}`);
}

// ============================================
// SUBSCRIPTION HANDLERS
// ============================================

/**
 * Handle customer.subscription.created event
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const metadata = subscription.metadata;
  const userId = metadata?.userId;

  if (!userId) {
    console.log("No userId in subscription metadata, skipping:", subscription.id);
    return;
  }

  const customerId = extractCustomerId(subscription);
  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : "FREE";

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
    },
  });

  console.log(`Subscription created for user: ${userId}`);
}

/**
 * Handle customer.subscription.updated event
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find subscription by Stripe subscription ID
  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log("No matching subscription found for:", subscription.id);
    return;
  }

  const priceId = extractPriceId(subscription);
  const plan = priceId ? getPlanFromPriceId(priceId) : existingSubscription.plan;

  await db.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: unixToDate(subscription.current_period_end),
      status: mapStripeStatus(subscription.status),
      plan,
    },
  });

  console.log(`Subscription updated: ${subscription.id}`);
}

/**
 * Handle customer.subscription.deleted event
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  // Find subscription by Stripe subscription ID
  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log("No matching subscription found for deletion:", subscription.id);
    return;
  }

  await db.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: "CANCELED",
      stripeSubscriptionId: null, // Clear subscription ID
      // Keep stripeCustomerId for potential resubscription
    },
  });

  console.log(`Subscription deleted: ${subscription.id}`);
}

// ============================================
// INVOICE HANDLERS
// ============================================

/**
 * Handle invoice.paid event
 */
export async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice:", invoice.id);
    return;
  }

  // Update subscription status if it was past_due
  const existingSubscription = await db.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
      status: "PAST_DUE",
    },
  });

  if (existingSubscription) {
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: "ACTIVE" },
    });

    console.log(`Subscription reactivated after payment: ${subscriptionId}`);
  }
}

/**
 * Handle invoice.payment_failed event
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("No subscription ID in invoice:", invoice.id);
    return;
  }

  // Update subscription status to past_due
  const existingSubscription = await db.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (existingSubscription) {
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: { status: "PAST_DUE" },
    });

    console.log(`Subscription marked as past_due: ${subscriptionId}`);

    // TODO: Send notification email to user
  }
}

// ============================================
// MAIN WEBHOOK PROCESSOR
// ============================================

/**
 * Process a Stripe webhook event
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<WebhookResult> {
  const eventType = event.type as SupportedWebhookEvent;

  console.log(`Processing webhook event: ${eventType} (${event.id})`);

  try {
    switch (eventType) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return {
      success: true,
      eventId: event.id,
      eventType: event.type,
    };
  } catch (error) {
    console.error(`Error processing webhook event ${event.id}:`, error);
    return {
      success: false,
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### 7.2 Webhook Route Handler (`src/app/api/webhooks/stripe/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, processWebhookEvent } from "@/lib/stripe";

/**
 * POST /api/webhooks/stripe
 * Handles incoming Stripe webhook events
 *
 * IMPORTANT: This route must NOT use any body parsing middleware.
 * The raw body is required for signature verification.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Get Stripe signature header
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("Missing Stripe signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Get webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Verify signature and construct event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Process the event
    const result = await processWebhookEvent(event);

    if (!result.success) {
      console.error(`Webhook processing failed: ${result.error}`);
      // Return 500 so Stripe will retry
      return NextResponse.json(
        { error: "Processing failed", eventId: result.eventId },
        { status: 500 }
      );
    }

    // Acknowledge receipt
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Stripe webhooks only use POST
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
```

---

## 8. Component Architecture

### 8.1 Pricing Card (`src/components/pricing/pricing-card.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Plan } from "@prisma/client";
import type { BillingInterval, PlanConfig } from "@/lib/stripe/types";
import { PLAN_PRICING } from "@/lib/stripe/config";

interface PricingCardProps {
  plan: PlanConfig;
  interval: BillingInterval;
  currentPlan?: Plan;
  isAuthenticated: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
}

export function PricingCard({
  plan,
  interval,
  currentPlan,
  isAuthenticated,
  onSubscribe,
}: PricingCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.id === "FREE";
  const pricing = !isFree ? PLAN_PRICING[plan.id as Exclude<Plan, "FREE">] : null;
  const price = pricing ? pricing[interval] : 0;
  const priceId = plan.prices[interval];

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    if (isFree || isCurrentPlan || !priceId) return;

    setIsLoading(true);
    try {
      await onSubscribe(priceId);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return "Current Plan";
    if (isFree) return "Get Started";
    if (!isAuthenticated) return "Sign up";
    if (currentPlan === "FREE") return "Upgrade";
    if (currentPlan === "ENTERPRISE" && plan.id === "PRO") return "Downgrade";
    return "Subscribe";
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.highlighted && "border-primary shadow-lg scale-105"
      )}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            {plan.badge}
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">${price}</span>
          {!isFree && (
            <span className="text-muted-foreground">
              /{interval === "monthly" ? "mo" : "yr"}
            </span>
          )}
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
          disabled={isCurrentPlan || isLoading}
          onClick={handleSubscribe}
        >
          {isLoading ? "Loading..." : getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 8.2 Pricing Toggle (`src/components/pricing/pricing-toggle.tsx`)

```typescript
"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/stripe/types";

interface PricingToggleProps {
  interval: BillingInterval;
  onIntervalChange: (interval: BillingInterval) => void;
  savingsPercent?: number;
}

export function PricingToggle({
  interval,
  onIntervalChange,
  savingsPercent = 17,
}: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onIntervalChange("monthly")}
        className={cn(
          "text-sm font-medium transition-colors",
          interval === "monthly"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Monthly
      </button>

      <button
        onClick={() =>
          onIntervalChange(interval === "monthly" ? "yearly" : "monthly")
        }
        className={cn(
          "relative w-14 h-7 rounded-full transition-colors",
          interval === "yearly" ? "bg-primary" : "bg-muted"
        )}
        aria-label="Toggle billing interval"
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform",
            interval === "yearly" && "translate-x-7"
          )}
        />
      </button>

      <button
        onClick={() => onIntervalChange("yearly")}
        className={cn(
          "text-sm font-medium transition-colors flex items-center gap-2",
          interval === "yearly"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Yearly
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
          Save {savingsPercent}%
        </span>
      </button>
    </div>
  );
}
```

### 8.3 Pricing Table (`src/components/pricing/pricing-table.tsx`)

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PricingCard } from "./pricing-card";
import { PricingToggle } from "./pricing-toggle";
import { PLAN_CONFIGS, calculateYearlySavings, PLAN_PRICING } from "@/lib/stripe/config";
import type { Plan } from "@prisma/client";
import type { BillingInterval } from "@/lib/stripe/types";

interface PricingTableProps {
  currentPlan?: Plan;
  isAuthenticated: boolean;
}

export function PricingTable({ currentPlan, isAuthenticated }: PricingTableProps) {
  const router = useRouter();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [error, setError] = useState<string | null>(null);

  const savingsPercent = calculateYearlySavings(
    PLAN_PRICING.PRO.monthly,
    PLAN_PRICING.PRO.yearly
  );

  const handleSubscribe = async (priceId: string) => {
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="space-y-8">
      <PricingToggle
        interval={interval}
        onIntervalChange={setInterval}
        savingsPercent={savingsPercent}
      />

      {error && (
        <div className="text-center text-destructive text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLAN_CONFIGS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            interval={interval}
            currentPlan={currentPlan}
            isAuthenticated={isAuthenticated}
            onSubscribe={handleSubscribe}
          />
        ))}
      </div>
    </div>
  );
}
```

### 8.4 Subscription Status (`src/components/billing/subscription-status.tsx`)

```typescript
"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SubscriptionInfo } from "@/lib/stripe/types";

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo | null;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No subscription found</p>
      </div>
    );
  }

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-700",
    TRIALING: "bg-blue-100 text-blue-700",
    PAST_DUE: "bg-yellow-100 text-yellow-700",
    CANCELED: "bg-red-100 text-red-700",
    INACTIVE: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{subscription.plan} Plan</h3>
          <Badge className={cn("mt-1", statusColors[subscription.status])}>
            {subscription.status}
          </Badge>
        </div>
      </div>

      {subscription.currentPeriodEnd && (
        <div className="text-sm text-muted-foreground">
          {subscription.cancelAtPeriodEnd ? (
            <p>
              Your subscription will end on{" "}
              <span className="font-medium">
                {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
              </span>
            </p>
          ) : (
            <p>
              Next billing date:{" "}
              <span className="font-medium">
                {format(subscription.currentPeriodEnd, "MMMM d, yyyy")}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

### 8.5 Manage Subscription Button (`src/components/billing/manage-subscription-button.tsx`)

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ManageSubscriptionButtonProps {
  hasSubscription: boolean;
}

export function ManageSubscriptionButton({
  hasSubscription,
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!hasSubscription) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open portal");
      }

      // Redirect to Stripe Portal
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  if (!hasSubscription) {
    return null;
  }

  return (
    <div>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? "Loading..." : "Manage Subscription"}
        <ExternalLink className="h-4 w-4" />
      </Button>
      {error && <p className="text-destructive text-sm mt-2">{error}</p>}
    </div>
  );
}
```

### 8.6 Component Exports

```typescript
// src/components/pricing/index.ts
export { PricingCard } from "./pricing-card";
export { PricingToggle } from "./pricing-toggle";
export { PricingTable } from "./pricing-table";
export { PricingFeatureList } from "./pricing-feature-list";

// src/components/billing/index.ts
export { SubscriptionStatus } from "./subscription-status";
export { BillingCard } from "./billing-card";
export { ManageSubscriptionButton } from "./manage-subscription-button";
```

---

## 9. Security Patterns

### 9.1 API Key Protection

```typescript
// Environment validation at startup
// src/lib/stripe/client.ts

function validateEnvironment(): void {
  const required = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(", ")}`);
  }
}
```

### 9.2 Webhook Signature Verification

```typescript
// Always verify webhook signatures
// src/app/api/webhooks/stripe/route.ts

// 1. Get raw body (not parsed JSON)
const body = await request.text();

// 2. Get signature header
const signature = headersList.get("stripe-signature");

// 3. Verify using Stripe SDK
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET!
);

// 4. Never trust client-provided data
// Always fetch fresh data from Stripe when needed
```

### 9.3 Price ID Validation

```typescript
// Validate price IDs against known values
// src/lib/stripe/config.ts

export function isValidPriceId(priceId: string): boolean {
  const validPriceIds = [
    STRIPE_PRICE_IDS.PRO.monthly,
    STRIPE_PRICE_IDS.PRO.yearly,
    STRIPE_PRICE_IDS.ENTERPRISE.monthly,
    STRIPE_PRICE_IDS.ENTERPRISE.yearly,
  ];

  return validPriceIds.includes(priceId);
}

// Use in API routes
if (!isValidPriceId(priceId)) {
  return NextResponse.json(
    { error: "Invalid price ID" },
    { status: 400 }
  );
}
```

### 9.4 Authentication Requirements

```typescript
// All checkout and portal endpoints require authentication
// Webhook endpoint uses signature verification instead

// Checkout route
const session = await auth();
if (!session?.user) {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401 }
  );
}

// Webhook route - No session auth, uses signature
const event = stripe.webhooks.constructEvent(body, signature, secret);
```

### 9.5 Rate Limiting Considerations

```typescript
// Apply rate limiting to checkout endpoint
// Prevents abuse and protects Stripe API limits

import { rateLimitByIp } from "@/lib/services/rate-limit.service";

export async function POST(request: NextRequest) {
  const rateLimit = await rateLimitByIp("stripe-checkout", 5, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  // ... rest of handler
}
```

---

## 10. Integration Points

### 10.1 Auth Integration

The payment system integrates with Auth.js for:

- User identification in checkout sessions
- Session validation in API routes
- User email for Stripe customer creation

```typescript
// Get authenticated user
const session = await auth();
if (!session?.user) {
  return { error: "Authentication required" };
}

// Use user data for Stripe
await stripe.checkout.sessions.create({
  customer_email: session.user.email,
  metadata: { userId: session.user.id },
});
```

### 10.2 Database Integration

The payment system uses the existing Subscription model:

```typescript
// Existing schema - no changes needed
model Subscription {
  id                     String             @id @default(cuid())
  userId                 String             @unique
  stripeCustomerId       String?            @unique
  stripeSubscriptionId   String?            @unique
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?
  status                 SubscriptionStatus @default(INACTIVE)
  plan                   Plan               @default(FREE)
  // ...
}
```

### 10.3 Middleware Integration

Protected billing routes via existing auth middleware:

```typescript
// src/middleware.ts - existing middleware handles route protection
// /settings/billing is protected by default (under /settings)
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

#### Utility Function Tests (`tests/unit/lib/stripe/utils.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import {
  mapStripeStatus,
  getPlanFromPriceId,
  isPaidPlan,
  isActiveSubscription,
  unixToDate,
} from "@/lib/stripe/utils";

describe("mapStripeStatus", () => {
  it("maps active to ACTIVE", () => {
    expect(mapStripeStatus("active")).toBe("ACTIVE");
  });

  it("maps trialing to TRIALING", () => {
    expect(mapStripeStatus("trialing")).toBe("TRIALING");
  });

  it("maps past_due to PAST_DUE", () => {
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
  });

  it("maps canceled to CANCELED", () => {
    expect(mapStripeStatus("canceled")).toBe("CANCELED");
  });

  it("maps incomplete to INACTIVE", () => {
    expect(mapStripeStatus("incomplete")).toBe("INACTIVE");
  });
});

describe("getPlanFromPriceId", () => {
  it("returns PRO for pro monthly price", () => {
    const priceId = process.env.STRIPE_PRICE_ID_PRO_MONTHLY;
    if (priceId) {
      expect(getPlanFromPriceId(priceId)).toBe("PRO");
    }
  });

  it("returns FREE for unknown price", () => {
    expect(getPlanFromPriceId("unknown_price")).toBe("FREE");
  });
});

describe("isPaidPlan", () => {
  it("returns false for FREE", () => {
    expect(isPaidPlan("FREE")).toBe(false);
  });

  it("returns true for PRO", () => {
    expect(isPaidPlan("PRO")).toBe(true);
  });

  it("returns true for ENTERPRISE", () => {
    expect(isPaidPlan("ENTERPRISE")).toBe(true);
  });
});

describe("isActiveSubscription", () => {
  it("returns true for ACTIVE", () => {
    expect(isActiveSubscription("ACTIVE")).toBe(true);
  });

  it("returns true for TRIALING", () => {
    expect(isActiveSubscription("TRIALING")).toBe(true);
  });

  it("returns false for CANCELED", () => {
    expect(isActiveSubscription("CANCELED")).toBe(false);
  });
});

describe("unixToDate", () => {
  it("converts unix timestamp to Date", () => {
    const timestamp = 1704067200; // 2024-01-01 00:00:00 UTC
    const date = unixToDate(timestamp);
    expect(date.getUTCFullYear()).toBe(2024);
    expect(date.getUTCMonth()).toBe(0);
    expect(date.getUTCDate()).toBe(1);
  });
});
```

#### Webhook Handler Tests (`tests/unit/lib/stripe/webhooks.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

// Mock database
vi.mock("@/lib/db", () => ({
  db: {
    subscription: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock Stripe client
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
} from "@/lib/stripe/webhooks";

describe("handleCheckoutCompleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips non-subscription checkouts", async () => {
    const session = {
      id: "cs_test",
      mode: "payment",
      metadata: { userId: "user_123" },
    } as Stripe.Checkout.Session;

    await handleCheckoutCompleted(session);

    expect(db.subscription.upsert).not.toHaveBeenCalled();
  });

  it("skips sessions without userId metadata", async () => {
    const session = {
      id: "cs_test",
      mode: "subscription",
      metadata: {},
    } as Stripe.Checkout.Session;

    await handleCheckoutCompleted(session);

    expect(db.subscription.upsert).not.toHaveBeenCalled();
  });
});

describe("handleSubscriptionUpdated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates existing subscription", async () => {
    const mockSubscription = { id: "sub_db_123" };
    vi.mocked(db.subscription.findFirst).mockResolvedValue(mockSubscription as never);

    const subscription = {
      id: "sub_stripe_123",
      status: "active",
      current_period_end: 1704067200,
      items: { data: [{ price: { id: "price_123" } }] },
    } as unknown as Stripe.Subscription;

    await handleSubscriptionUpdated(subscription);

    expect(db.subscription.update).toHaveBeenCalled();
  });

  it("skips when no matching subscription found", async () => {
    vi.mocked(db.subscription.findFirst).mockResolvedValue(null);

    const subscription = {
      id: "sub_unknown",
      status: "active",
      current_period_end: 1704067200,
      items: { data: [] },
    } as unknown as Stripe.Subscription;

    await handleSubscriptionUpdated(subscription);

    expect(db.subscription.update).not.toHaveBeenCalled();
  });
});

describe("handleSubscriptionDeleted", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets status to CANCELED and clears subscription ID", async () => {
    const mockSubscription = { id: "sub_db_123" };
    vi.mocked(db.subscription.findFirst).mockResolvedValue(mockSubscription as never);

    const subscription = {
      id: "sub_stripe_123",
    } as Stripe.Subscription;

    await handleSubscriptionDeleted(subscription);

    expect(db.subscription.update).toHaveBeenCalledWith({
      where: { id: "sub_db_123" },
      data: {
        status: "CANCELED",
        stripeSubscriptionId: null,
      },
    });
  });
});
```

### 11.2 Integration Tests

```typescript
// tests/integration/api/stripe/checkout.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/stripe/checkout/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  isValidPriceId: vi.fn(),
}));

describe("POST /api/stripe/checkout", () => {
  it("returns 401 for unauthenticated requests", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue(null);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: "price_123" }),
        });

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toBe("Authentication required");
      },
    });
  });

  it("returns 400 for invalid price ID", async () => {
    const { auth } = await import("@/lib/auth");
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user_123", email: "test@example.com" },
    } as never);

    const { isValidPriceId } = await import("@/lib/stripe");
    vi.mocked(isValidPriceId).mockReturnValue(false);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId: "invalid_price" }),
        });

        expect(response.status).toBe(400);
      },
    });
  });
});
```

### 11.3 Test Cards

For testing, use Stripe test cards:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Insufficient funds |

---

## 12. Environment Configuration

### 12.1 Required Environment Variables

```bash
# .env.example

# Stripe API Keys (from Stripe Dashboard -> Developers -> API keys)
STRIPE_SECRET_KEY="sk_test_..." # or "sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # or "pk_live_..."

# Webhook Secret (from Stripe Dashboard -> Developers -> Webhooks)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs (from Stripe Dashboard -> Products -> Prices)
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."
STRIPE_PRICE_ID_ENTERPRISE_MONTHLY="price_..."
STRIPE_PRICE_ID_ENTERPRISE_YEARLY="price_..."

# App URL for callbacks
NEXT_PUBLIC_APP_URL="http://localhost:3000" # or production URL
```

### 12.2 Stripe Dashboard Setup

#### Products to Create

1. **Pro Plan**
   - Name: "Pro"
   - Monthly price: $19/month (recurring)
   - Yearly price: $190/year (recurring)

2. **Enterprise Plan**
   - Name: "Enterprise"
   - Monthly price: $99/month (recurring)
   - Yearly price: $990/year (recurring)

#### Webhook Endpoint Configuration

1. Go to Stripe Dashboard -> Developers -> Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

#### Customer Portal Configuration

1. Go to Stripe Dashboard -> Settings -> Billing -> Customer portal
2. Enable features:
   - Payment method management
   - Subscription cancellation
   - Subscription upgrades/downgrades
   - Invoice history
3. Set branding and appearance
4. Configure cancellation flow

### 12.3 Local Development Setup

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note the webhook signing secret output and add to .env.local
# STRIPE_WEBHOOK_SECRET="whsec_..."

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

---

## 13. Implementation Checklist

### Phase 1: Foundation (Day 1)

- [ ] Create `src/lib/stripe/client.ts` - Stripe client singleton
- [ ] Create `src/lib/stripe/config.ts` - Plans and pricing configuration
- [ ] Create `src/lib/stripe/types.ts` - Type definitions
- [ ] Create `src/lib/stripe/utils.ts` - Helper functions
- [ ] Create `src/lib/stripe/index.ts` - Main exports
- [ ] Set up Stripe products and prices in test mode
- [ ] Add environment variables to `.env.local`
- [ ] Write unit tests for utility functions

### Phase 2: Checkout Flow (Day 2)

- [ ] Create `src/app/api/stripe/checkout/route.ts`
- [ ] Create `src/actions/stripe/create-checkout.ts`
- [ ] Create `src/app/(marketing)/pricing/page.tsx`
- [ ] Create `src/components/pricing/pricing-card.tsx`
- [ ] Create `src/components/pricing/pricing-toggle.tsx`
- [ ] Create `src/components/pricing/pricing-table.tsx`
- [ ] Create `src/app/(marketing)/checkout/success/page.tsx`
- [ ] Write tests for checkout flow

### Phase 3: Customer Portal (Day 3)

- [ ] Configure Customer Portal in Stripe Dashboard
- [ ] Create `src/app/api/stripe/portal/route.ts`
- [ ] Create `src/actions/stripe/create-portal.ts`
- [ ] Create `src/app/(dashboard)/settings/billing/page.tsx`
- [ ] Create `src/components/billing/subscription-status.tsx`
- [ ] Create `src/components/billing/manage-subscription-button.tsx`
- [ ] Write tests

### Phase 4: Webhooks (Day 4)

- [ ] Create `src/lib/stripe/webhooks.ts` - Event handlers
- [ ] Create `src/app/api/webhooks/stripe/route.ts`
- [ ] Implement `checkout.session.completed` handler
- [ ] Implement `customer.subscription.created` handler
- [ ] Implement `customer.subscription.updated` handler
- [ ] Implement `customer.subscription.deleted` handler
- [ ] Implement invoice event handlers
- [ ] Write comprehensive webhook tests
- [ ] Test with Stripe CLI locally

### Phase 5: Polish & Testing (Day 5)

- [ ] Create `src/app/api/stripe/subscription/route.ts`
- [ ] Add loading states and error handling
- [ ] Add rate limiting to checkout endpoint
- [ ] E2E tests for full subscription flow
- [ ] Security audit
- [ ] Documentation updates
- [ ] Production webhook endpoint setup
- [ ] Final code review

---

## Appendix A: Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | User must be authenticated |
| `INVALID_PRICE_ID` | 400 | Price ID not in allowed list |
| `NO_SUBSCRIPTION` | 400 | User has no subscription record |
| `NO_CUSTOMER` | 400 | User has no Stripe customer ID |
| `INVALID_SIGNATURE` | 400 | Webhook signature verification failed |
| `CHECKOUT_FAILED` | 500 | Failed to create checkout session |
| `PORTAL_FAILED` | 500 | Failed to create portal session |
| `SUBSCRIPTION_ERROR` | 500 | Failed to get subscription status |
| `WEBHOOK_FAILED` | 500 | Failed to process webhook event |

---

## Appendix B: Data Flow Diagrams

### Checkout Flow

```
User                    App                     Stripe
  |                      |                        |
  |-- Click Subscribe -->|                        |
  |                      |-- Create Session ----->|
  |                      |<-- Session URL --------|
  |<-- Redirect ---------|                        |
  |                      |                        |
  |------------- Complete Payment --------------->|
  |                      |                        |
  |<-- Redirect to Success                        |
  |                      |<-- Webhook: completed -|
  |                      |-- Update DB ---------->|
```

### Portal Flow

```
User                    App                     Stripe
  |                      |                        |
  |-- Click Manage ----->|                        |
  |                      |-- Create Portal ------>|
  |                      |<-- Portal URL ---------|
  |<-- Redirect ---------|                        |
  |                      |                        |
  |------------- Make Changes ------------------->|
  |                      |                        |
  |<-- Return to App                              |
  |                      |<-- Webhook: updated ---|
  |                      |-- Update DB ---------->|
```

### Webhook Processing

```
Stripe                  App                     Database
  |                      |                        |
  |-- POST /webhooks --->|                        |
  |                      |-- Verify Signature     |
  |                      |-- Parse Event          |
  |                      |-- Handle Event ------->|
  |                      |                        |
  |<-- 200 OK -----------|                        |
```

---

## Appendix C: Stripe Event Payloads

### checkout.session.completed

```json
{
  "id": "evt_xxx",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "customer": "cus_xxx",
      "customer_email": "user@example.com",
      "subscription": "sub_xxx",
      "mode": "subscription",
      "payment_status": "paid",
      "metadata": {
        "userId": "user_xxx"
      }
    }
  }
}
```

### customer.subscription.updated

```json
{
  "id": "evt_xxx",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_xxx",
      "customer": "cus_xxx",
      "status": "active",
      "current_period_end": 1735689600,
      "cancel_at_period_end": false,
      "items": {
        "data": [
          {
            "price": {
              "id": "price_xxx"
            }
          }
        ]
      },
      "metadata": {
        "userId": "user_xxx"
      }
    }
  }
}
```

---

**Document End**

This technical architecture document provides a complete blueprint for implementing Epic 4: Payments. Developers should use this as the definitive reference for TDD implementation.
