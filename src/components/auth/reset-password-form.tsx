"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, startTransition] = useTransition();

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">Invalid reset link.</p>
        <Link
          href="/forgot-password"
          className="font-medium text-primary hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    startTransition(async () => {
      const result = await resetPasswordAction({
        token,
        password,
        confirmPassword,
      });

      if (result.success) {
        toast.success("Password updated successfully!", {
          description: "Redirecting to login...",
        });
        // Redirect to login after 2 seconds
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isPending}
            data-testid="password"
          />
          <p className="text-xs text-muted-foreground">
            Must be 8+ characters with uppercase, lowercase, number, and special
            character.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            disabled={isPending}
            data-testid="confirmPassword"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="reset-password-button"
        >
          {isPending ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
