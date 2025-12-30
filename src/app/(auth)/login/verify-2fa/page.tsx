import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { TwoFactorVerifyForm } from "@/components/auth/two-factor-verify-form";

export const metadata = {
  title: "Verify Two-Factor Authentication",
  description: "Enter your authentication code to complete sign in",
};

export default function TwoFactorVerifyPage() {
  return (
    <AuthCard
      title="Two-Factor Authentication"
      description="Enter the 6-digit code from your authenticator app"
    >
      <Suspense fallback={<div>Loading...</div>}>
        <TwoFactorVerifyForm />
      </Suspense>
    </AuthCard>
  );
}
