"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { emailPreferencesSchema, type EmailPreferencesInput } from "@/lib/validations/gdpr";

/**
 * GDPR Email Preferences Management
 *
 * Server actions for managing email preferences both for authenticated users
 * and via unsubscribe tokens (one-click unsubscribe from emails).
 */

export interface EmailPreferences {
  emailMarketingOptIn: boolean;
  emailProductUpdates: boolean;
  emailSecurityAlerts: boolean;
}

export type UpdateEmailPreferencesResult =
  | {
      success: true;
      preferences: EmailPreferences;
    }
  | {
      success: false;
      error: string;
    };

export type GetEmailPreferencesResult =
  | {
      success: true;
      email: string;
      preferences: EmailPreferences;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Update email preferences for the authenticated user
 */
export async function updateEmailPreferences(
  input: EmailPreferencesInput
): Promise<UpdateEmailPreferencesResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = emailPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const [updatedUser] = await db
      .update(user)
      .set({
        emailMarketingOptIn: parsed.data.emailMarketingOptIn,
        emailProductUpdates: parsed.data.emailProductUpdates,
        emailSecurityAlerts: parsed.data.emailSecurityAlerts,
      })
      .where(eq(user.id, session.user.id))
      .returning({
        emailMarketingOptIn: user.emailMarketingOptIn,
        emailProductUpdates: user.emailProductUpdates,
        emailSecurityAlerts: user.emailSecurityAlerts,
      });

    if (!updatedUser) {
      return { success: false, error: "Failed to update preferences" };
    }

    // Revalidate settings page
    revalidatePath("/settings/privacy");

    return {
      success: true,
      preferences: {
        emailMarketingOptIn: updatedUser.emailMarketingOptIn,
        emailProductUpdates: updatedUser.emailProductUpdates,
        emailSecurityAlerts: updatedUser.emailSecurityAlerts,
      },
    };
  } catch (error) {
    console.error("[updateEmailPreferences] Error:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}

/**
 * Get current email preferences for the authenticated user
 */
export async function getEmailPreferences(): Promise<GetEmailPreferencesResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const [userData] = await db
    .select({
      email: user.email,
      emailMarketingOptIn: user.emailMarketingOptIn,
      emailProductUpdates: user.emailProductUpdates,
      emailSecurityAlerts: user.emailSecurityAlerts,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!userData) {
    return { success: false, error: "User not found" };
  }

  return {
    success: true,
    email: userData.email,
    preferences: {
      emailMarketingOptIn: userData.emailMarketingOptIn,
      emailProductUpdates: userData.emailProductUpdates,
      emailSecurityAlerts: userData.emailSecurityAlerts,
    },
  };
}

/**
 * Get email preferences by unsubscribe token (no auth required)
 * Used for the unsubscribe page
 */
export async function getEmailPreferencesByToken(
  token: string
): Promise<GetEmailPreferencesResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  const [userData] = await db
    .select({
      email: user.email,
      emailMarketingOptIn: user.emailMarketingOptIn,
      emailProductUpdates: user.emailProductUpdates,
      emailSecurityAlerts: user.emailSecurityAlerts,
    })
    .from(user)
    .where(eq(user.unsubscribeToken, token))
    .limit(1);

  if (!userData) {
    return { success: false, error: "Invalid or expired token" };
  }

  return {
    success: true,
    email: userData.email,
    preferences: {
      emailMarketingOptIn: userData.emailMarketingOptIn,
      emailProductUpdates: userData.emailProductUpdates,
      emailSecurityAlerts: userData.emailSecurityAlerts,
    },
  };
}

/**
 * Update email preferences by unsubscribe token (no auth required)
 * Used for the unsubscribe page
 */
export async function updateEmailPreferencesByToken(
  token: string,
  preferences: Partial<EmailPreferences>
): Promise<UpdateEmailPreferencesResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  const [userData] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.unsubscribeToken, token))
    .limit(1);

  if (!userData) {
    return { success: false, error: "Invalid or expired token" };
  }

  const [updatedUser] = await db
    .update(user)
    .set({
      emailMarketingOptIn: preferences.emailMarketingOptIn,
      emailProductUpdates: preferences.emailProductUpdates,
      emailSecurityAlerts: preferences.emailSecurityAlerts,
    })
    .where(eq(user.id, userData.id))
    .returning({
      emailMarketingOptIn: user.emailMarketingOptIn,
      emailProductUpdates: user.emailProductUpdates,
      emailSecurityAlerts: user.emailSecurityAlerts,
    });

  if (!updatedUser) {
    return { success: false, error: "Failed to update preferences" };
  }

  // Revalidate settings page
  revalidatePath("/settings/privacy");

  return {
    success: true,
    preferences: {
      emailMarketingOptIn: updatedUser.emailMarketingOptIn,
      emailProductUpdates: updatedUser.emailProductUpdates,
      emailSecurityAlerts: updatedUser.emailSecurityAlerts,
    },
  };
}

/**
 * One-click unsubscribe from all marketing emails
 * Used for the simple unsubscribe link in emails
 */
export async function unsubscribeFromAll(
  token: string
): Promise<UpdateEmailPreferencesResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  const [userData] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.unsubscribeToken, token))
    .limit(1);

  if (!userData) {
    return { success: false, error: "Invalid or expired token" };
  }

  const [updatedUser] = await db
    .update(user)
    .set({
      emailMarketingOptIn: false,
      emailProductUpdates: false,
      // Keep security alerts enabled for user safety
      emailSecurityAlerts: true,
    })
    .where(eq(user.id, userData.id))
    .returning({
      emailMarketingOptIn: user.emailMarketingOptIn,
      emailProductUpdates: user.emailProductUpdates,
      emailSecurityAlerts: user.emailSecurityAlerts,
    });

  if (!updatedUser) {
    return { success: false, error: "Failed to update preferences" };
  }

  // Revalidate settings page
  revalidatePath("/settings/privacy");

  return {
    success: true,
    preferences: {
      emailMarketingOptIn: updatedUser.emailMarketingOptIn,
      emailProductUpdates: updatedUser.emailProductUpdates,
      emailSecurityAlerts: updatedUser.emailSecurityAlerts,
    },
  };
}

/**
 * Generate an unsubscribe token for a user if they don't have one
 */
export async function generateUnsubscribeToken(
  userId: string
): Promise<string> {
  const [userData] = await db
    .select({ unsubscribeToken: user.unsubscribeToken })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userData?.unsubscribeToken) {
    return userData.unsubscribeToken;
  }

  const token = createId();
  await db
    .update(user)
    .set({ unsubscribeToken: token })
    .where(eq(user.id, userId));

  return token;
}
