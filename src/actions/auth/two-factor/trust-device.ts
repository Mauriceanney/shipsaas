"use server";

import { headers, cookies } from "next/headers";
import { randomBytes, createHash, randomUUID } from "crypto";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trustedDevice } from "@/lib/schema";

const TRUSTED_DEVICE_COOKIE = "trusted_device_token";
const TRUSTED_DEVICE_DAYS = 30;

export type TrustDeviceResult =
  | { success: true }
  | { success: false; error: string };

export type GetTrustedDevicesResult =
  | { success: true; devices: TrustedDeviceInfo[] }
  | { success: false; error: string };

export type RemoveTrustedDeviceResult =
  | { success: true }
  | { success: false; error: string };

export interface TrustedDeviceInfo {
  id: string;
  deviceName: string;
  lastUsedAt: Date;
  createdAt: Date;
  isCurrent: boolean;
}

/**
 * Generate a secure device token
 */
function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a device token for secure storage
 */
function hashDeviceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Parse user agent to get a friendly device name
 */
function parseDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";

  // Simple parsing - could be enhanced with a proper UA parser
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("iPad")) return "iPad";
  if (userAgent.includes("Android")) return "Android Device";
  if (userAgent.includes("Mac")) return "Mac";
  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("Linux")) return "Linux";

  return "Unknown Device";
}

/**
 * Trust the current device for 2FA
 * After trusting, the device won't need 2FA for the specified duration
 */
export async function trustDevice(): Promise<TrustDeviceResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    const headersList = await headers();
    const userAgent = headersList.get("user-agent");
    const deviceName = parseDeviceName(userAgent);

    // Generate token and hash
    const token = generateDeviceToken();
    const tokenHash = hashDeviceToken(token);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TRUSTED_DEVICE_DAYS);

    // Store trusted device
    await db.insert(trustedDevice).values({
      id: randomUUID(),
      userId: session.user.id,
      tokenHash,
      deviceName,
      expiresAt,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(TRUSTED_DEVICE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TRUSTED_DEVICE_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Error trusting device:", error);
    return { success: false, error: "Failed to trust device" };
  }
}

/**
 * Check if the current device is trusted
 */
export async function isDeviceTrusted(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;

    if (!token) return false;

    const tokenHash = hashDeviceToken(token);
    const now = new Date();

    const [device] = await db
      .select()
      .from(trustedDevice)
      .where(
        and(
          eq(trustedDevice.userId, userId),
          eq(trustedDevice.tokenHash, tokenHash),
          gt(trustedDevice.expiresAt, now)
        )
      )
      .limit(1);

    if (device) {
      // Update last used timestamp
      await db
        .update(trustedDevice)
        .set({ lastUsedAt: now })
        .where(eq(trustedDevice.id, device.id));

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking trusted device:", error);
    return false;
  }
}

/**
 * Get all trusted devices for the current user
 */
export async function getTrustedDevices(): Promise<GetTrustedDevicesResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get current device token hash for comparison
    const cookieStore = await cookies();
    const currentToken = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
    const currentTokenHash = currentToken ? hashDeviceToken(currentToken) : null;

    const now = new Date();
    const devices = await db
      .select({
        id: trustedDevice.id,
        deviceName: trustedDevice.deviceName,
        tokenHash: trustedDevice.tokenHash,
        lastUsedAt: trustedDevice.lastUsedAt,
        createdAt: trustedDevice.createdAt,
      })
      .from(trustedDevice)
      .where(
        and(
          eq(trustedDevice.userId, session.user.id),
          gt(trustedDevice.expiresAt, now)
        )
      )
      .orderBy(trustedDevice.lastUsedAt);

    return {
      success: true,
      devices: devices.map((d) => ({
        id: d.id,
        deviceName: d.deviceName,
        lastUsedAt: d.lastUsedAt,
        createdAt: d.createdAt,
        isCurrent: d.tokenHash === currentTokenHash,
      })),
    };
  } catch (error) {
    console.error("Error getting trusted devices:", error);
    return { success: false, error: "Failed to get trusted devices" };
  }
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(deviceId: string): Promise<RemoveTrustedDeviceResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Only allow removing own devices
    await db
      .delete(trustedDevice)
      .where(
        and(
          eq(trustedDevice.id, deviceId),
          eq(trustedDevice.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error removing trusted device:", error);
    return { success: false, error: "Failed to remove trusted device" };
  }
}

/**
 * Remove all trusted devices for the current user
 */
export async function removeAllTrustedDevices(): Promise<RemoveTrustedDeviceResult> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    await db
      .delete(trustedDevice)
      .where(eq(trustedDevice.userId, session.user.id));

    // Clear the current device cookie
    const cookieStore = await cookies();
    cookieStore.delete(TRUSTED_DEVICE_COOKIE);

    return { success: true };
  } catch (error) {
    console.error("Error removing trusted devices:", error);
    return { success: false, error: "Failed to remove trusted devices" };
  }
}
