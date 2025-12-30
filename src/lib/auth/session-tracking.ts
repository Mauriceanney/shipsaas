import { randomUUID } from "crypto";

import { headers } from "next/headers";

import { db } from "@/lib/db";

/**
 * Parse user agent string to get a friendly device name
 */
export function parseDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";

  // Check for mobile devices first
  if (/iPhone/i.test(userAgent)) {
    const match = userAgent.match(/iPhone OS (\d+)/);
    return match ? `iPhone (iOS ${match[1]})` : "iPhone";
  }
  if (/iPad/i.test(userAgent)) {
    return "iPad";
  }
  if (/Android/i.test(userAgent)) {
    const match = userAgent.match(/Android (\d+)/);
    return match ? `Android ${match[1]}` : "Android Device";
  }

  // Desktop browsers
  let browser = "Unknown Browser";
  let os = "";

  // Detect browser
  if (/Edg\//i.test(userAgent)) {
    browser = "Edge";
  } else if (/Chrome/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/Firefox/i.test(userAgent)) {
    browser = "Firefox";
  }

  // Detect OS
  if (/Windows/i.test(userAgent)) {
    os = "Windows";
  } else if (/Mac OS X/i.test(userAgent)) {
    os = "macOS";
  } else if (/Linux/i.test(userAgent)) {
    os = "Linux";
  }

  return os ? `${browser} on ${os}` : browser;
}

/**
 * Get client info from request headers
 */
export async function getClientInfo(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
}> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    null;

  return {
    ipAddress,
    userAgent,
    deviceName: parseDeviceName(userAgent),
  };
}

/**
 * Record a login attempt in the login history
 */
export async function recordLoginAttempt({
  userId,
  success,
  failReason,
  provider,
}: {
  userId: string;
  success: boolean;
  failReason?: string;
  provider: string;
}): Promise<void> {
  try {
    const clientInfo = await getClientInfo();

    await db.loginHistory.create({
      data: {
        userId,
        success,
        failReason: failReason ?? null,
        provider,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceName: clientInfo.deviceName,
      },
    });
  } catch (error) {
    console.error("[recordLoginAttempt] Error:", error);
  }
}

/**
 * Create a user session record for tracking
 */
export async function createUserSession(userId: string): Promise<string> {
  const clientInfo = await getClientInfo();
  const sessionToken = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  try {
    await db.userSession.create({
      data: {
        userId,
        sessionToken,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceName: clientInfo.deviceName,
        lastActiveAt: new Date(),
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[createUserSession] Error:", error);
  }

  return sessionToken;
}

/**
 * Update session last active time
 */
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await db.userSession.updateMany({
      where: {
        sessionToken,
        revokedAt: null,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[updateSessionActivity] Error:", error);
  }
}

/**
 * Revoke a user session
 */
export async function revokeUserSession(sessionToken: string): Promise<void> {
  try {
    await db.userSession.updateMany({
      where: {
        sessionToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[revokeUserSession] Error:", error);
  }
}
