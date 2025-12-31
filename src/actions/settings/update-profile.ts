"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validations/profile";

import type { UpdateProfileInput } from "@/lib/validations/profile";

export async function updateProfile(input: UpdateProfileInput) {
  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  // 2. Validation
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    } as const;
  }

  // 3. Update user profile
  try {
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    });

    // 4. Revalidate profile page
    revalidatePath("/settings/profile");

    return { success: true, data: updatedUser } as const;
  } catch (error) {
    console.error("[updateProfile]", error);
    return { success: false, error: "Failed to update profile" } as const;
  }
}
