"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { signOut } from "@/lib/auth";

/**
 * Force logout action - used when session is revoked from another device.
 * Clears the session token cookie and signs out via Auth.js.
 */
export async function forceLogoutAction(): Promise<void> {
  // Clear the session token cookie
  const cookieStore = await cookies();
  cookieStore.delete("user-session-token");

  // Revalidate login page
  revalidatePath("/login");

  // Sign out via Auth.js and redirect to login with error message
  await signOut({ redirectTo: "/login?error=SessionRevoked" });
}
