import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";

import { authConfig } from "./config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = NextAuth({
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  ...authConfig,
});
