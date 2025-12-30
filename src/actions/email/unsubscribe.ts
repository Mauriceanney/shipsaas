"use server";

import { db } from "@/lib/db";

export interface EmailPreferences {
  emailMarketingOptIn: boolean;
  emailProductUpdates: boolean;
  emailSecurityAlerts: boolean;
}

export interface UnsubscribeResult {
  success: boolean;
  email?: string;
  preferences?: EmailPreferences;
  error?: string;
}

/**
 * Get user's email preferences by unsubscribe token
 * Used to display current preferences on the unsubscribe page
 */
export async function getEmailPreferences(token: string): Promise<UnsubscribeResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  try {
    const user = await db.user.findUnique({
      where: { unsubscribeToken: token },
      select: {
        email: true,
        emailMarketingOptIn: true,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired token" };
    }

    return {
      success: true,
      email: user.email,
      preferences: {
        emailMarketingOptIn: user.emailMarketingOptIn,
        emailProductUpdates: user.emailProductUpdates,
        emailSecurityAlerts: user.emailSecurityAlerts,
      },
    };
  } catch (error) {
    console.error("[getEmailPreferences] Error:", error);
    return { success: false, error: "Failed to get preferences" };
  }
}

/**
 * Update user's email preferences
 * Can be called from the unsubscribe page without authentication
 */
export async function updateEmailPreferences(
  token: string,
  preferences: Partial<EmailPreferences>
): Promise<UnsubscribeResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  try {
    const user = await db.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired token" };
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailMarketingOptIn: preferences.emailMarketingOptIn,
        emailProductUpdates: preferences.emailProductUpdates,
        emailSecurityAlerts: preferences.emailSecurityAlerts,
      },
      select: {
        email: true,
        emailMarketingOptIn: true,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      },
    });

    return {
      success: true,
      email: updatedUser.email,
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
 * One-click unsubscribe from all marketing emails
 * Used for the simple unsubscribe link in emails
 */
export async function unsubscribeFromAll(token: string): Promise<UnsubscribeResult> {
  if (!token) {
    return { success: false, error: "Invalid token" };
  }

  try {
    const user = await db.user.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, email: true },
    });

    if (!user) {
      return { success: false, error: "Invalid or expired token" };
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailMarketingOptIn: false,
        emailProductUpdates: false,
        // Keep security alerts enabled for user safety
        emailSecurityAlerts: true,
      },
      select: {
        email: true,
        emailMarketingOptIn: true,
        emailProductUpdates: true,
        emailSecurityAlerts: true,
      },
    });

    return {
      success: true,
      email: updatedUser.email,
      preferences: {
        emailMarketingOptIn: updatedUser.emailMarketingOptIn,
        emailProductUpdates: updatedUser.emailProductUpdates,
        emailSecurityAlerts: updatedUser.emailSecurityAlerts,
      },
    };
  } catch (error) {
    console.error("[unsubscribeFromAll] Error:", error);
    return { success: false, error: "Failed to unsubscribe" };
  }
}
