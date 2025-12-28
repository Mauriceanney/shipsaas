"use server";

import { signOut } from "@/lib/auth";

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
