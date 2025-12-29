import { Suspense } from "react";

import { AuthCard, RegisterForm } from "@/components/auth";
import { Skeleton } from "@/components/ui/skeleton";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create an account"
      description="Enter your details to get started"
    >
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}

function RegisterFormSkeleton() {
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
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
