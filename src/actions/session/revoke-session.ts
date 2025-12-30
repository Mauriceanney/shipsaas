"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revokeSessionSchema } from "@/lib/validations/session";

type Result = { success: true } | { success: false; error: string };

export async function revokeSession(input: unknown): Promise<Result> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = revokeSessionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Invalid input",
      };
    }

    const { sessionId } = parsed.data;

    const userSession = await db.userSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!userSession) {
      return { success: false, error: "Session not found" };
    }

    if (userSession.revokedAt) {
      return { success: false, error: "Session already revoked" };
    }

    await db.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    revalidatePath("/dashboard/settings/security");

    return { success: true };
  } catch (error) {
    console.error("[revokeSession]", error);
    return { success: false, error: "Failed to revoke session" };
  }
}
