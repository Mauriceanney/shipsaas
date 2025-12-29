/**
 * Admin utilities and access control
 */

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Check if user is admin and redirect if not
 * Use this in server components and server actions
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return session;
}

/**
 * Check if user is admin without redirecting
 * Use this for conditional rendering
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

/**
 * Get admin session or null
 * Use this when you need the session and want to handle non-admin case yourself
 */
export async function getAdminSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}
