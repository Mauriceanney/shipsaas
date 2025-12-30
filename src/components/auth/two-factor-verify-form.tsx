"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { verifyTwoFactorAction } from "@/actions/auth/two-factor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TwoFactorVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState("");

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (useBackupCode) {
      // Backup codes: allow alphanumeric and hyphens, uppercase
      setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
    } else {
      // TOTP: digits only
      setCode(value.replace(/\D/g, ""));
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await verifyTwoFactorAction({ code, userId });

      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.push(callbackUrl as any);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode(""); // Clear code when switching modes
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">
            {useBackupCode ? "Backup Code" : "Authentication Code"}
          </Label>
          <Input
            id="code"
            name="code"
            type="text"
            inputMode={useBackupCode ? "text" : "numeric"}
            pattern={useBackupCode ? "[A-Z0-9-]+" : "[0-9]{6}"}
            placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
            maxLength={useBackupCode ? 9 : 6}
            value={code}
            onChange={handleCodeChange}
            required
            disabled={isPending}
            autoComplete="one-time-code"
            className="text-center text-lg tracking-widest"
          />
          <p className="text-xs text-muted-foreground">
            {useBackupCode
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verifying..." : "Verify"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={handleToggleBackupCode}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {useBackupCode
            ? "Use authenticator app instead"
            : "Use a backup code"}
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
