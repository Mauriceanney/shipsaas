"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  account,
  session,
  subscription,
  loginHistory,
} from "@/lib/schema";

/**
 * GDPR Article 20 - Right to Data Portability
 *
 * Generates a complete export of user data in a machine-readable format.
 * This includes all personal data stored about the user.
 */

export interface UserDataExport {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    role: string;
    createdAt: Date;
    tosAcceptedAt: Date | null;
    onboardingCompleted: boolean;
    emailPreferences: {
      marketingOptIn: boolean;
      productUpdates: boolean;
      securityAlerts: boolean;
    };
  };
  accounts: Array<{
    provider: string;
    accountId: string;
    createdAt: Date;
  }>;
  sessions: Array<{
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
  }>;
  loginHistory: Array<{
    ipAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
    success: boolean;
    provider: string;
    createdAt: Date;
  }>;
  subscription: {
    plan: string;
    status: string;
    createdAt: Date;
    currentPeriodEnd: Date | null;
  } | null;
}

/**
 * Generate the complete user data export
 */
export async function generateUserDataExport(
  userId: string
): Promise<UserDataExport> {
  // Fetch user data
  const [userData] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
      tosAcceptedAt: user.tosAcceptedAt,
      onboardingCompleted: user.onboardingCompleted,
      emailMarketingOptIn: user.emailMarketingOptIn,
      emailProductUpdates: user.emailProductUpdates,
      emailSecurityAlerts: user.emailSecurityAlerts,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!userData) {
    throw new Error("User not found");
  }

  // Fetch accounts
  const accounts = await db
    .select({
      provider: account.providerId,
      accountId: account.accountId,
      createdAt: account.createdAt,
    })
    .from(account)
    .where(eq(account.userId, userId));

  // Fetch active sessions
  const sessions = await db
    .select({
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(eq(session.userId, userId));

  // Fetch login history (last 100 entries)
  const loginHistoryData = await db
    .select({
      ipAddress: loginHistory.ipAddress,
      userAgent: loginHistory.userAgent,
      deviceName: loginHistory.deviceName,
      success: loginHistory.success,
      provider: loginHistory.provider,
      createdAt: loginHistory.createdAt,
    })
    .from(loginHistory)
    .where(eq(loginHistory.userId, userId))
    .orderBy(loginHistory.createdAt)
    .limit(100);

  // Fetch subscription
  const [subscriptionData] = await db
    .select({
      plan: subscription.plan,
      status: subscription.status,
      createdAt: subscription.createdAt,
      currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      emailVerified: userData.emailVerified,
      role: userData.role,
      createdAt: userData.createdAt,
      tosAcceptedAt: userData.tosAcceptedAt,
      onboardingCompleted: userData.onboardingCompleted,
      emailPreferences: {
        marketingOptIn: userData.emailMarketingOptIn,
        productUpdates: userData.emailProductUpdates,
        securityAlerts: userData.emailSecurityAlerts,
      },
    },
    accounts: accounts.map((a) => ({
      provider: a.provider,
      accountId: a.accountId,
      createdAt: a.createdAt,
    })),
    sessions: sessions.map((s) => ({
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
    loginHistory: loginHistoryData.map((l) => ({
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      deviceName: l.deviceName,
      success: l.success,
      provider: l.provider,
      createdAt: l.createdAt,
    })),
    subscription: subscriptionData
      ? {
          plan: subscriptionData.plan,
          status: subscriptionData.status,
          createdAt: subscriptionData.createdAt,
          currentPeriodEnd: subscriptionData.currentPeriodEnd,
        }
      : null,
  };
}
