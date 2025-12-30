"use server";

import { cookies } from "next/headers";

import { signOut } from "@/lib/auth";
import { revokeUserSession } from "@/lib/auth/session-tracking";

export async function logoutAction(): Promise<void> {
  // Revoke the current user session
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("user-session-token")?.value;

  if (sessionToken) {
    await revokeUserSession(sessionToken);
    cookieStore.delete("user-session-token");
  }

  await signOut({ redirectTo: "/login" });
}
