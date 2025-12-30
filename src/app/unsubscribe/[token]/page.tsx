import { notFound } from "next/navigation";

import { getEmailPreferences } from "@/actions/email/unsubscribe";

import { UnsubscribeForm } from "./unsubscribe-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Preferences",
  description: "Manage your email subscription preferences",
};

interface UnsubscribePageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function UnsubscribePage({
  params,
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await params;
  const { action } = await searchParams;

  const result = await getEmailPreferences(token);

  if (!result.success || !result.preferences) {
    notFound();
  }

  // Mask email for privacy (show first 2 chars and domain)
  const maskedEmail = result.email
    ? `${result.email.slice(0, 2)}***@${result.email.split("@")[1]}`
    : "your email";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Email Preferences</h1>
          <p className="text-muted-foreground">
            Manage email preferences for {maskedEmail}
          </p>
        </div>

        <UnsubscribeForm
          token={token}
          initialPreferences={result.preferences}
          isOneClick={action === "unsubscribe"}
        />

        <p className="text-center text-xs text-muted-foreground">
          You can update your preferences at any time using the link in our emails.
        </p>
      </div>
    </div>
  );
}
