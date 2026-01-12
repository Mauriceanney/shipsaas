import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  unique,
} from "drizzle-orm/pg-core";

// IMPORTANT! ID fields should ALWAYS use UUID types, EXCEPT the BetterAuth tables.

// ============================================
// ENUMS
// ============================================

export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);
export const planEnum = pgEnum("plan", ["FREE", "PLUS", "PRO"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "INACTIVE",
  "PAST_DUE",
  "CANCELED",
  "TRIALING",
]);
export const dataExportStatusEnum = pgEnum("data_export_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "EXPIRED",
]);
export const dunningEmailTypeEnum = pgEnum("dunning_email_type", [
  "DAY_0_PAYMENT_FAILED",
  "DAY_3_REMINDER",
  "DAY_7_FINAL_WARNING",
  "DAY_10_SUSPENDED",
  "PAYMENT_RECOVERED",
]);
export const discountTypeEnum = pgEnum("discount_type", ["PERCENTAGE", "FIXED"]);
export const emailSendStatusEnum = pgEnum("email_send_status", [
  "PENDING",
  "SENT",
  "FAILED",
]);

// ============================================
// BETTER AUTH CORE TABLES
// ============================================

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),

    // Role and status
    role: roleEnum("role").default("USER").notNull(),
    disabled: boolean("disabled").default(false).notNull(),
    tosAcceptedAt: timestamp("tos_accepted_at", { mode: "date" }),
    welcomeEmailSent: boolean("welcome_email_sent").default(false).notNull(),

    // Email Preferences (GDPR compliant)
    unsubscribeToken: text("unsubscribe_token").unique(),
    emailMarketingOptIn: boolean("email_marketing_opt_in").default(true).notNull(),
    emailProductUpdates: boolean("email_product_updates").default(true).notNull(),
    emailSecurityAlerts: boolean("email_security_alerts").default(true).notNull(),

    // Two-Factor Authentication
    twoFactorSecret: text("two_factor_secret"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
    twoFactorBackupCodes: text("two_factor_backup_codes").array(),

    // Onboarding
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    onboardingDismissedAt: timestamp("onboarding_dismissed_at", { mode: "date" }),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_role_idx").on(table.role),
    index("user_created_at_idx").on(table.createdAt),
    index("user_deleted_at_idx").on(table.deletedAt),
    index("user_disabled_idx").on(table.disabled),
    index("user_two_factor_enabled_idx").on(table.twoFactorEnabled),
    index("user_unsubscribe_token_idx").on(table.unsubscribeToken),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_account_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================
// TRUSTED DEVICES (2FA)
// ============================================

export const trustedDevice = pgTable(
  "trusted_device",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    deviceName: text("device_name").notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("trusted_device_user_token_unique").on(table.userId, table.tokenHash),
    index("trusted_device_user_id_idx").on(table.userId),
    index("trusted_device_expires_at_idx").on(table.expiresAt),
    index("trusted_device_token_hash_idx").on(table.tokenHash),
  ]
);

// ============================================
// SESSION MANAGEMENT
// ============================================

export const userSession = pgTable(
  "user_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sessionToken: text("session_token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceName: text("device_name"),
    lastActiveAt: timestamp("last_active_at", { mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_session_user_id_idx").on(table.userId),
    index("user_session_token_idx").on(table.sessionToken),
    index("user_session_user_revoked_idx").on(table.userId, table.revokedAt),
    index("user_session_expires_at_idx").on(table.expiresAt),
    index("user_session_last_active_idx").on(table.lastActiveAt),
    index("user_session_composite_idx").on(
      table.userId,
      table.revokedAt,
      table.expiresAt,
      table.lastActiveAt
    ),
  ]
);

export const loginHistory = pgTable(
  "login_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceName: text("device_name"),
    success: boolean("success").notNull(),
    failReason: text("fail_reason"),
    provider: text("provider").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("login_history_user_id_idx").on(table.userId),
    index("login_history_user_created_idx").on(table.userId, table.createdAt),
    index("login_history_created_at_idx").on(table.createdAt),
    index("login_history_user_success_idx").on(table.userId, table.success),
    index("login_history_metrics_idx").on(
      table.userId,
      table.success,
      table.createdAt
    ),
  ]
);

// ============================================
// SUBSCRIPTION MODELS
// ============================================

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    stripePriceId: text("stripe_price_id"),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end", { mode: "date" }),
    stripeTrialEnd: timestamp("stripe_trial_end", { mode: "date" }),
    status: subscriptionStatusEnum("status").default("INACTIVE").notNull(),
    statusChangedAt: timestamp("status_changed_at", { mode: "date" }),
    plan: planEnum("plan").default("FREE").notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    index("subscription_customer_idx").on(table.stripeCustomerId),
    index("subscription_subscription_idx").on(table.stripeSubscriptionId),
    index("subscription_status_idx").on(table.status),
    index("subscription_plan_idx").on(table.plan),
    index("subscription_user_status_idx").on(table.userId, table.status),
    index("subscription_plan_status_idx").on(table.plan, table.status),
    index("subscription_deleted_at_idx").on(table.deletedAt),
  ]
);

// ============================================
// USAGE METERING
// ============================================

export const usage = pgTable(
  "usage",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    period: text("period").notNull(), // Billing period in YYYY-MM format
    apiCalls: integer("api_calls").default(0).notNull(),
    projectsCount: integer("projects_count").default(0).notNull(),
    storageBytes: bigint("storage_bytes", { mode: "bigint" }).default(BigInt(0)).notNull(),
    teamMembers: integer("team_members").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("usage_user_period_unique").on(table.userId, table.period),
    index("usage_user_id_idx").on(table.userId),
    index("usage_period_idx").on(table.period),
    index("usage_user_period_idx").on(table.userId, table.period),
  ]
);

// ============================================
// ADMIN CONFIGURATION
// ============================================

export const planConfig = pgTable(
  "plan_config",
  {
    id: text("id").primaryKey(),
    plan: planEnum("plan").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    monthlyPriceId: text("monthly_price_id"),
    yearlyPriceId: text("yearly_price_id"),
    monthlyPrice: integer("monthly_price").default(0).notNull(),
    yearlyPrice: integer("yearly_price").default(0).notNull(),
    features: text("features").array().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("plan_config_is_active_idx").on(table.isActive),
    index("plan_config_sort_order_idx").on(table.sortOrder),
  ]
);

// ============================================
// GDPR COMPLIANCE
// ============================================

export const dataExportRequest = pgTable(
  "data_export_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: dataExportStatusEnum("status").default("PENDING").notNull(),
    downloadUrl: text("download_url"),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => [
    index("data_export_user_id_idx").on(table.userId),
    index("data_export_status_idx").on(table.status),
    index("data_export_expires_at_idx").on(table.expiresAt),
  ]
);

export const accountDeletionRequest = pgTable(
  "account_deletion_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    reason: text("reason"),
    scheduledFor: timestamp("scheduled_for", { mode: "date" }).notNull(),
    canceledAt: timestamp("canceled_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("account_deletion_scheduled_idx").on(table.scheduledFor)]
);

// ============================================
// DUNNING FLOW
// ============================================

export const dunningEmail = pgTable(
  "dunning_email",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id, { onDelete: "cascade" }),
    emailType: dunningEmailTypeEnum("email_type").notNull(),
    sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
    recipientEmail: text("recipient_email").notNull(),
    emailStatus: emailSendStatusEnum("email_status").default("PENDING").notNull(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("dunning_email_subscription_type_unique").on(
      table.subscriptionId,
      table.emailType
    ),
    index("dunning_email_subscription_idx").on(table.subscriptionId),
    index("dunning_email_subscription_type_idx").on(
      table.subscriptionId,
      table.emailType
    ),
    index("dunning_email_sent_at_idx").on(table.sentAt),
  ]
);

// ============================================
// WEBHOOK IDEMPOTENCY
// ============================================

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: text("id").primaryKey(),
    stripeEventId: text("stripe_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    processed: boolean("processed").default(false).notNull(),
    processedAt: timestamp("processed_at", { mode: "date" }),
    apiVersion: text("api_version"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("webhook_event_stripe_id_idx").on(table.stripeEventId),
    index("webhook_event_type_idx").on(table.eventType),
    index("webhook_event_processed_at_idx").on(table.processedAt),
  ]
);

// ============================================
// PROMOTION CODES
// ============================================

export const promotionCode = pgTable(
  "promotion_code",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    stripePromotionId: text("stripe_promotion_id").notNull().unique(),
    stripeCouponId: text("stripe_coupon_id").notNull(),
    description: text("description"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    currency: text("currency"),
    active: boolean("active").default(true).notNull(),
    maxRedemptions: integer("max_redemptions").default(0).notNull(),
    timesRedeemed: integer("times_redeemed").default(0).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdBy: text("created_by").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("promotion_code_code_idx").on(table.code),
    index("promotion_code_active_idx").on(table.active),
    index("promotion_code_expires_at_idx").on(table.expiresAt),
    index("promotion_code_created_by_idx").on(table.createdBy),
  ]
);

export const promotionUsage = pgTable(
  "promotion_usage",
  {
    id: text("id").primaryKey(),
    promotionCodeId: text("promotion_code_id")
      .notNull()
      .references(() => promotionCode.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    subscriptionId: text("subscription_id"),
    stripeCheckoutId: text("stripe_checkout_id").notNull().unique(),
    discountAmount: integer("discount_amount").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("promotion_usage_code_idx").on(table.promotionCodeId),
    index("promotion_usage_user_idx").on(table.userId),
    index("promotion_usage_subscription_idx").on(table.subscriptionId),
    index("promotion_usage_created_at_idx").on(table.createdAt),
  ]
);

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type TrustedDevice = typeof trustedDevice.$inferSelect;
export type NewTrustedDevice = typeof trustedDevice.$inferInsert;

export type UserSession = typeof userSession.$inferSelect;
export type NewUserSession = typeof userSession.$inferInsert;

export type LoginHistory = typeof loginHistory.$inferSelect;
export type NewLoginHistory = typeof loginHistory.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;

export type PlanConfig = typeof planConfig.$inferSelect;
export type NewPlanConfig = typeof planConfig.$inferInsert;

export type DataExportRequest = typeof dataExportRequest.$inferSelect;
export type NewDataExportRequest = typeof dataExportRequest.$inferInsert;

export type AccountDeletionRequest = typeof accountDeletionRequest.$inferSelect;
export type NewAccountDeletionRequest = typeof accountDeletionRequest.$inferInsert;

export type DunningEmail = typeof dunningEmail.$inferSelect;
export type NewDunningEmail = typeof dunningEmail.$inferInsert;

export type WebhookEvent = typeof webhookEvent.$inferSelect;
export type NewWebhookEvent = typeof webhookEvent.$inferInsert;

export type PromotionCode = typeof promotionCode.$inferSelect;
export type NewPromotionCode = typeof promotionCode.$inferInsert;

export type PromotionUsage = typeof promotionUsage.$inferSelect;
export type NewPromotionUsage = typeof promotionUsage.$inferInsert;

// Enum type exports
export type Role = (typeof roleEnum.enumValues)[number];
export type Plan = (typeof planEnum.enumValues)[number];
export type SubscriptionStatus = (typeof subscriptionStatusEnum.enumValues)[number];
export type DataExportStatus = (typeof dataExportStatusEnum.enumValues)[number];
export type DunningEmailType = (typeof dunningEmailTypeEnum.enumValues)[number];
export type DiscountType = (typeof discountTypeEnum.enumValues)[number];
export type EmailSendStatus = (typeof emailSendStatusEnum.enumValues)[number];
