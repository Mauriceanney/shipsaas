"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { SocialLoginButtons } from "./social-login-buttons";

const ERROR_MESSAGES: Record<string, string> = {
  SessionRevoked: "Your session was ended from another device. Please sign in again.",
  AccountDisabled: "Your account has been disabled. Contact support for help.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(
    errorParam ? ERROR_MESSAGES[errorParam] ?? null : null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await loginAction({ email, password });

      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(callbackUrl as any);
        router.refresh();
      } else if ("requires2FA" in result && result.requires2FA) {
        // Redirect to 2FA verification page with userId
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(`/login/verify-2fa?userId=${result.userId}&callbackUrl=${encodeURIComponent(callbackUrl)}` as any);
      } else if ("error" in result) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <SocialLoginButtons callbackUrl={callbackUrl} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={isPending}
            data-testid="email"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            data-testid="password"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="login-button"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
