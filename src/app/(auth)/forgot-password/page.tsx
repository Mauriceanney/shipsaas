import { type Metadata } from "next";

import { AuthCard, ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset link"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
