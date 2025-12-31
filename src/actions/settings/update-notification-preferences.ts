"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateNotificationPreferencesSchema = z.object({
  emailMarketingOptIn: z.boolean().optional(),
  emailProductUpdates: z.boolean().optional(),
  emailSecurityAlerts: z.boolean().optional(),
});

type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

export async function updateNotificationPreferences(input: UpdateNotificationPreferencesInput) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  const parsed = updateNotificationPreferencesSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Invalid input" } as const;
  }

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });

    revalidatePath("/settings/notifications");

    return { success: true } as const;
  } catch (error) {
    console.error("[updateNotificationPreferences]", error);
    return { success: false, error: "Failed to update preferences" } as const;
  }
}
