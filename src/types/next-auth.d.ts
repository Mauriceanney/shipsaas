import type { Plan, Role, SubscriptionStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
    subscription: {
      plan: Plan;
      status: SubscriptionStatus;
      stripeCurrentPeriodEnd: Date | null;
      statusChangedAt: Date | null;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    subscription: {
      plan: Plan;
      status: SubscriptionStatus;
      stripeCurrentPeriodEnd: Date | null;
      statusChangedAt: Date | null;
    };
  }
}
