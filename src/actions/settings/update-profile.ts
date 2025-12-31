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

  // 3. Build update data
  const updateData: { name: string; email?: string } = {
    name: parsed.data.name,
  };

  // 4. Handle email update (only for credential users)
  if (parsed.data.email) {
    // Check if user is a credential user (has password)
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, email: true },
    });

    if (!user?.password) {
      return {
        success: false,
        error: "Email can only be changed for credential accounts",
      } as const;
    }

    // Check if email is already taken by another user
    if (parsed.data.email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (existingUser) {
        return {
          success: false,
          error: "Email is already in use",
        } as const;
      }

      updateData.email = parsed.data.email;
    }
  }

  // 5. Update user profile
  try {
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    // 6. Revalidate profile page
    revalidatePath("/settings/profile");
    revalidatePath("/dashboard");

    return { success: true, data: updatedUser } as const;
  } catch (error) {
    console.error("[updateProfile]", error);
    return { success: false, error: "Failed to update profile" } as const;
  }
}
