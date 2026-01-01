"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

import { SocialLoginButtons } from "./social-login-buttons";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      tosAccepted: false,
    },
  });

  const tosAccepted = watch("tosAccepted");

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await registerAction(data);

      if (result.success) {
        toast.success("Account created! Check your email to verify.", {
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
      <SocialLoginButtons />

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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            disabled={isPending}
            data-testid="name"
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="name-error"
              className="text-sm text-destructive mt-1"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isPending}
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            disabled={isPending}
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
          {!errors.password && (
            <p className="text-xs text-muted-foreground">
              Must be 8+ characters with uppercase, lowercase, number, and special
              character.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            disabled={isPending}
            data-testid="confirmPassword"
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p
              id="confirmPassword-error"
              className="text-sm text-destructive mt-1"
              role="alert"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="tos"
            checked={tosAccepted}
            onCheckedChange={(checked) => setValue("tosAccepted", checked === true)}
            disabled={isPending}
            data-testid="tos-checkbox"
          />
          <label
            htmlFor="tos"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-primary underline hover:no-underline"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary underline hover:no-underline"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !tosAccepted}
          data-testid="register-button"
        >
          {isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
