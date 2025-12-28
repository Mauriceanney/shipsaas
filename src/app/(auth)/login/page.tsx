import { Suspense } from "react";
import { type Metadata } from "next";

import { AuthCard, LoginForm } from "@/components/auth";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your account to continue"
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
      <Skeleton className="h-4" />
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
