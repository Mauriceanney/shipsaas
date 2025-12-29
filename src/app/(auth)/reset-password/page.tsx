import { Suspense } from "react";

import { AuthCard, ResetPasswordForm } from "@/components/auth";
import { Skeleton } from "@/components/ui/skeleton";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Enter your new password below"
    >
      <Suspense fallback={<ResetPasswordFormSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}

function ResetPasswordFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );
}
