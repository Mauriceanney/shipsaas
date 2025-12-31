/**
 * Admin Impersonation Utilities
 * Provides functions for managing admin impersonation sessions
 */

import { cookies } from "next/headers";

// Impersonation cookie name
export const IMPERSONATION_COOKIE = "impersonation-session";

// Impersonation session duration (1 hour)
export const IMPERSONATION_DURATION_MS = 60 * 60 * 1000;

/**
 * Impersonation session data stored in cookie
 */
export type ImpersonationSession = {
  originalAdminId: string;
  originalAdminEmail: string;
  targetUserId: string;
  impersonationLogId: string;
  expiresAt: string; // ISO date string
};

/**
 * Check if current session is an impersonation
 */
export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.has(IMPERSONATION_COOKIE);
}

/**
 * Get impersonation session data
 */
export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(IMPERSONATION_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value) as ImpersonationSession;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Set impersonation session cookie
 */
export async function setImpersonationCookie(session: ImpersonationSession): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(session.expiresAt);

  cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Clear impersonation session cookie
 */
export async function clearImpersonationCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE);
}

/**
 * Calculate expiration time for impersonation session
 */
export function calculateExpiresAt(): Date {
  return new Date(Date.now() + IMPERSONATION_DURATION_MS);
}
