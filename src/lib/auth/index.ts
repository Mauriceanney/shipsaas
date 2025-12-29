import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { db } from "@/lib/db";

import { authConfig } from "./config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  ...authConfig,
});
