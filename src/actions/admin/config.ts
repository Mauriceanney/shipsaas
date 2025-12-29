"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createAuditLog, computeChanges } from "@/lib/audit";
import { invalidateCache } from "@/lib/config";
import { db } from "@/lib/db";

import type { Plan } from "@prisma/client";

// ============================================
// PLAN CONFIGURATION ACTIONS
// ============================================

export async function getPlanConfigs() {
  await requireAdmin();
  return db.planConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export async function updatePlanConfig(
  plan: Plan,
  data: {
    name?: string;
    description?: string;
    monthlyPriceId?: string;
    yearlyPriceId?: string;
    monthlyPrice?: number;
    yearlyPrice?: number;
    features?: string[];
    isActive?: boolean;
  }
) {
  const session = await requireAdmin();

  const existing = await db.planConfig.findUnique({ where: { plan } });

  let config;
  if (existing) {
    config = await db.planConfig.update({
      where: { plan },
      data,
    });

    // Audit log
    const changes = computeChanges(existing, { ...existing, ...data }, [
      "name",
      "description",
      "monthlyPriceId",
      "yearlyPriceId",
      "monthlyPrice",
      "yearlyPrice",
      "features",
      "isActive",
    ]);

    if (Object.keys(changes).length > 0) {
      await createAuditLog({
        entityType: "PlanConfig",
        entityId: config.id,
        action: "UPDATE",
        changes,
        userId: session.user.id,
        userEmail: session.user.email || "unknown",
      });
    }
  } else {
    config = await db.planConfig.create({
      data: {
        plan,
        name: data.name || plan,
        ...data,
      },
    });

    await createAuditLog({
      entityType: "PlanConfig",
      entityId: config.id,
      action: "CREATE",
      changes: { plan: { old: null, new: plan } },
      userId: session.user.id,
      userEmail: session.user.email || "unknown",
    });
  }

  invalidateCache("plan_configs");
  revalidatePath("/admin/plans");

  return config;
}

// ============================================
// APP CONFIGURATION ACTIONS
// ============================================

export async function getAppConfigs() {
  await requireAdmin();
  return db.appConfig.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
}

export async function getAppConfigsByCategory(category: string) {
  await requireAdmin();
  return db.appConfig.findMany({
    where: { category },
    orderBy: { key: "asc" },
  });
}

export async function updateAppConfig(
  key: string,
  value: unknown,
  options?: { description?: string; category?: string }
) {
  const session = await requireAdmin();

  const existing = await db.appConfig.findUnique({ where: { key } });

  let config;
  if (existing) {
    config = await db.appConfig.update({
      where: { key },
      data: {
        value: value as object,
        ...(options?.description && { description: options.description }),
      },
    });

    await createAuditLog({
      entityType: "AppConfig",
      entityId: config.id,
      action: "UPDATE",
      changes: { value: { old: existing.value, new: value } },
      userId: session.user.id,
      userEmail: session.user.email || "unknown",
    });
  } else {
    config = await db.appConfig.create({
      data: {
        key,
        value: value as object,
        description: options?.description,
        category: options?.category || "general",
      },
    });

    await createAuditLog({
      entityType: "AppConfig",
      entityId: config.id,
      action: "CREATE",
      changes: { key: { old: null, new: key }, value: { old: null, new: value } },
      userId: session.user.id,
      userEmail: session.user.email || "unknown",
    });
  }

  invalidateCache("app_configs");
  revalidatePath("/admin/settings");

  return config;
}

export async function deleteAppConfig(key: string) {
  const session = await requireAdmin();

  const existing = await db.appConfig.findUnique({ where: { key } });
  if (!existing) throw new Error("Config not found");

  await db.appConfig.delete({ where: { key } });

  await createAuditLog({
    entityType: "AppConfig",
    entityId: existing.id,
    action: "DELETE",
    changes: { key: { old: key, new: null }, value: { old: existing.value, new: null } },
    userId: session.user.id,
    userEmail: session.user.email || "unknown",
  });

  invalidateCache("app_configs");
  revalidatePath("/admin/settings");
}

// ============================================
// FEATURE FLAGS ACTIONS
// ============================================

export async function getFeatureFlags() {
  await requireAdmin();
  const configs = await db.appConfig.findMany({
    where: { category: "features" },
    orderBy: { key: "asc" },
  });

  return configs.map((c) => ({
    key: c.key.replace("feature_", ""),
    enabled: c.value === true,
    description: c.description,
  }));
}

export async function toggleFeatureFlag(featureKey: string) {
  const session = await requireAdmin();
  const key = `feature_${featureKey}`;

  const existing = await db.appConfig.findUnique({ where: { key } });
  const newValue = existing ? !(existing.value === true) : true;

  const config = await db.appConfig.upsert({
    where: { key },
    update: { value: newValue },
    create: {
      key,
      value: newValue,
      category: "features",
      description: `Feature flag: ${featureKey}`,
    },
  });

  await createAuditLog({
    entityType: "AppConfig",
    entityId: config.id,
    action: existing ? "UPDATE" : "CREATE",
    changes: { value: { old: existing?.value ?? null, new: newValue } },
    userId: session.user.id,
    userEmail: session.user.email || "unknown",
  });

  invalidateCache("app_configs");
  revalidatePath("/admin/settings");

  return { key: featureKey, enabled: newValue };
}

// ============================================
// AUDIT LOG ACTIONS
// ============================================

export async function getAuditLogs(limit = 50) {
  await requireAdmin();
  return db.configAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
