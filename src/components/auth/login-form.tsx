

"use client";


import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { asDynamicRoute, navigateAndRefresh, navigateTo } from "@/lib/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  // Show toast for URL error params and clear from URL
  useEffect(() => {
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      toast.warning(ERROR_MESSAGES[errorParam]);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [errorParam]);

  const onSubmit = async (data: LoginInput) => {
    const result = await loginAction(data);

    if (result.success) {
      toast.success("Welcome back!");
      navigateAndRefresh(router, asDynamicRoute(callbackUrl));
    } else if ("requires2FA" in result && result.requires2FA) {
      navigateTo(router, asDynamicRoute(`/login/verify-2fa?userId=${result.userId}&callbackUrl=${encodeURIComponent(callbackUrl)}`));
    } else if ("error" in result) {
      toast.error(result.error);
    }
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            data-testid="email"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-sm text-destructive mt-1"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
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
            type="password"
            disabled={isSubmitting}
            data-testid="password"
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p
              id="password-error"
              className="text-sm text-destructive mt-1"
              role="alert"
            >
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          data-testid="login-button"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
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
