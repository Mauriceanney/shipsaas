"use client";


import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { verifyTwoFactorAction } from "@/actions/auth/two-factor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { asDynamicRoute, navigateAndRefresh } from "@/lib/navigation";

// Create a modified schema that doesn't transform the code (for react-hook-form)
const formSchema = z.object({
  code: z
    .string()
    .min(6, "Code is required")
    .max(10, "Code is too long"),
  userId: z.string().min(1, "User ID is required"),
  rememberDevice: z.boolean().optional().default(false),
});

type FormInput = z.infer<typeof formSchema>;

export function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    _register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      userId: userId || "",
      rememberDevice: false,
    },
  });

  const code = watch("code");
  const rememberDevice = watch("rememberDevice");

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (useBackupCode) {
      // Backup codes: allow alphanumeric and hyphens, uppercase
      setValue("code", value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
    } else {
      // TOTP: digits only
      setValue("code", value.replace(/\D/g, ""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");

    if (useBackupCode) {
      // Backup codes: extract alphanumeric and hyphens, uppercase, limit to 9 chars
      const cleaned = pastedText
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "")
        .slice(0, 9);
      setValue("code", cleaned);
    } else {
      // TOTP: extract only digits, limit to 6
      const digits = pastedText.replace(/\D/g, "").slice(0, 6);
      setValue("code", digits);
    }
  };

  if (!userId) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive">Invalid verification request.</p>
        <Link href="/login" className="text-primary hover:underline">
          Return to login
        </Link>
      </div>
    );
  }

  const onSubmit = async (data: FormInput) => {
    const result = await verifyTwoFactorAction({
      code: data.code,
      userId: data.userId,
      rememberDevice: data.rememberDevice,
    });

    if (result.success) {
      navigateAndRefresh(router, asDynamicRoute(callbackUrl));
    } else {
      // Use setValue to show error (react-hook-form doesn't have a direct error setter)
      // We'll handle this differently - set a form-level error
    }
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setValue("code", ""); // Clear code when switching modes
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">
            {useBackupCode ? "Backup Code" : "Authentication Code"}
          </Label>
          <Input
            id="code"
            type="text"
            inputMode={useBackupCode ? "text" : "numeric"}
            pattern={useBackupCode ? "[A-Z0-9-]+" : "[0-9]{6}"}
            placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
            maxLength={useBackupCode ? 9 : 6}
            value={code || ""}
            onChange={handleCodeChange}
            onPaste={handlePaste}
            disabled={isSubmitting}
            autoComplete="one-time-code"
            className="text-center text-lg tracking-widest"
            required
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? "code-error" : "code-description"}
          />
          {errors.code && (
            <p
              id="code-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.code.message}
            </p>
          )}
          {!errors.code && (
            <p id="code-description" className="text-xs text-muted-foreground">
              {useBackupCode
                ? "Enter one of your backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberDevice"
            checked={rememberDevice}
            onCheckedChange={(checked) =>
              setValue("rememberDevice", checked === true)
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor="rememberDevice"
            className="text-sm font-normal text-muted-foreground cursor-pointer"
          >
            Remember this device for 30 days
          </Label>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={handleToggleBackupCode}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {useBackupCode ? "Use authenticator app instead" : "Use a backup code"}
        </button>
      </div>

      <div className="text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-primary">
          Cancel and return to login
        </Link>
      </div>
    </div>
  );
}
