/**
 * Configuration service with in-memory caching
 * Provides runtime configuration management for app settings and feature flags
 */

import { db } from "@/lib/db";

import type { AppConfig, PlanConfig } from "@prisma/client";

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache
const cache: Map<string, CacheEntry<unknown>> = new Map();

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (isCacheValid(entry)) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Invalidate cache for a specific key or all keys
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// ============================================
// PLAN CONFIGURATION
// ============================================

const PLAN_CACHE_KEY = "plan_configs";

/**
 * Get all plan configurations with caching
 */
export async function getPlanConfigs(): Promise<PlanConfig[]> {
  const cached = getCache<PlanConfig[]>(PLAN_CACHE_KEY);
  if (cached) return cached;

  const configs = await db.planConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });

  setCache(PLAN_CACHE_KEY, configs);
  return configs;
}

/**
 * Get active plan configurations only
 */
export async function getActivePlanConfigs(): Promise<PlanConfig[]> {
  const configs = await getPlanConfigs();
  return configs.filter((c) => c.isActive);
}

/**
 * Get a specific plan configuration
 */
export async function getPlanConfig(plan: string): Promise<PlanConfig | null> {
  const configs = await getPlanConfigs();
  return configs.find((c) => c.plan === plan) || null;
}

// ============================================
// APP CONFIGURATION
// ============================================

const APP_CONFIG_CACHE_KEY = "app_configs";

/**
 * Get all app configurations with caching
 */
export async function getAppConfigs(): Promise<AppConfig[]> {
  const cached = getCache<AppConfig[]>(APP_CONFIG_CACHE_KEY);
  if (cached) return cached;

  const configs = await db.appConfig.findMany({
    orderBy: { key: "asc" },
  });

  setCache(APP_CONFIG_CACHE_KEY, configs);
  return configs;
}

/**
 * Get app configurations by category
 */
export async function getAppConfigsByCategory(
  category: string
): Promise<AppConfig[]> {
  const configs = await getAppConfigs();
  return configs.filter((c) => c.category === category);
}

/**
 * Get a specific app configuration value
 */
export async function getAppConfig<T = unknown>(key: string): Promise<T | null> {
  const configs = await getAppConfigs();
  const config = configs.find((c) => c.key === key);
  return config ? (config.value as T) : null;
}

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Check if a feature flag is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const value = await getAppConfig<boolean>(`feature_${featureKey}`);
  return value === true;
}

/**
 * Get all feature flags
 */
export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const configs = await getAppConfigsByCategory("features");
  const flags: Record<string, boolean> = {};

  for (const config of configs) {
    const key = config.key.replace("feature_", "");
    flags[key] = config.value === true;
  }

  return flags;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

/**
 * Seed default plan configurations if none exist
 */
export async function seedDefaultPlanConfigs(): Promise<void> {
  const existing = await db.planConfig.count();
  if (existing > 0) return;

  const defaultPlans = [
    {
      plan: "FREE" as const,
      name: "Free",
      description: "Get started with basic features",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ["Basic features", "1 project", "Community support"],
      sortOrder: 0,
    },
    {
      plan: "PLUS" as const,
      name: "Plus",
      description: "Perfect for professionals",
      monthlyPrice: 2900, // $29.00
      yearlyPrice: 29000, // $290.00
      features: [
        "All Free features",
        "Unlimited projects",
        "Priority support",
        "Advanced analytics",
      ],
      sortOrder: 1,
    },
    {
      plan: "PLUS" as const,
      name: "Pro",
      description: "For large organizations",
      monthlyPrice: 9900, // $99.00
      yearlyPrice: 99000, // $990.00
      features: [
        "All Plus features",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
      ],
      sortOrder: 2,
    },
  ];

  await db.planConfig.createMany({ data: defaultPlans });
  invalidateCache(PLAN_CACHE_KEY);
}

/**
 * Seed default app configurations if none exist
 */
export async function seedDefaultAppConfigs(): Promise<void> {
  const existing = await db.appConfig.count();
  if (existing > 0) return;

  const defaultConfigs = [
    // General settings
    {
      key: "site_name",
      value: "ShipSaaS",
      description: "The name of the application",
      category: "general",
    },
    {
      key: "site_description",
      value: "Ship your SaaS faster",
      description: "The description of the application",
      category: "general",
    },
    // Feature flags
    {
      key: "feature_dark_mode",
      value: true,
      description: "Enable dark mode toggle",
      category: "features",
    },
    {
      key: "feature_user_registration",
      value: true,
      description: "Allow new user registrations",
      category: "features",
    },
    {
      key: "feature_social_login",
      value: true,
      description: "Enable social login (Google, GitHub)",
      category: "features",
    },
  ];

  await db.appConfig.createMany({ data: defaultConfigs });
  invalidateCache(APP_CONFIG_CACHE_KEY);
}
