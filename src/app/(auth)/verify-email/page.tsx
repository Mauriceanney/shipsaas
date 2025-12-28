import Link from "next/link";
import { type Metadata } from "next";

import { verifyEmailAction } from "@/actions/auth";
import { AuthCard } from "@/components/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthCard
        title="Invalid link"
        description="The verification link is invalid or missing"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Please check your email for the correct verification link.
          </p>
          <Button asChild>
            <Link href="/login">Go to login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  const result = await verifyEmailAction({ token });

  return (
    <AuthCard
      title={result.success ? "Email verified" : "Verification failed"}
      description={result.success ? result.message : result.error}
    >
      <div className="space-y-4 text-center">
        {result.success ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              You can now sign in to your account.
            </p>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XIcon className="h-6 w-6 text-destructive" />
            </div>
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
          </>
        )}
      </div>
    </AuthCard>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
