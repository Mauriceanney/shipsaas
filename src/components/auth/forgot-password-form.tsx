"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { forgotPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    startTransition(async () => {
      const result = await forgotPasswordAction({ email });
      toast.success(result.message);
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="forgot-password-button"
        >
          {isPending ? "Sending..." : "Send reset link"}
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
