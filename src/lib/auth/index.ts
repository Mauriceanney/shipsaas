import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { db } from "@/lib/db";

import { authConfig } from "./config";

import type { Adapter } from "next-auth/adapters";

/**
 * NextAuth configuration with Prisma adapter.
 *
 * Note: The type assertion to `Adapter` is required due to a known type mismatch
 * between @auth/prisma-adapter and next-auth. PrismaAdapter returns `Adapter` from
 * @auth/core/adapters, but NextAuth expects `Adapter` from next-auth/adapters.
 * These types are compatible at runtime but TypeScript can't verify this.
 * See: https://github.com/nextauthjs/next-auth/issues/9493
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db) as Adapter,
  session: { strategy: "jwt" },
  ...authConfig,
});
