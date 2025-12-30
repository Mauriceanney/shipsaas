"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type Result =
  | { success: true; data: { revokedCount: number } }
  | { success: false; error: string };

export async function revokeAllOtherSessions(): Promise<Result> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const cookieStore = await cookies();
    // Handle both secure (HTTPS) and non-secure cookie names
    const currentSessionToken =
      cookieStore.get("__Secure-authjs.session-token")?.value ??
      cookieStore.get("authjs.session-token")?.value;

    // Build the where clause - only exclude current session if token exists
    const whereClause: {
      userId: string;
      revokedAt: null;
      sessionToken?: { not: string };
    } = {
      userId: session.user.id,
      revokedAt: null,
    };

    if (currentSessionToken) {
      whereClause.sessionToken = { not: currentSessionToken };
    }

    const result = await db.userSession.updateMany({
      where: whereClause,
      data: { revokedAt: new Date() },
    });

    revalidatePath("/dashboard/settings/security");

    return { success: true, data: { revokedCount: result.count } };
  } catch (error) {
    console.error("[revokeAllOtherSessions]", error);
    return { success: false, error: "Failed to revoke sessions" };
  }
}
