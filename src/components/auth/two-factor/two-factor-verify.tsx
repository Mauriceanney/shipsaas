"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TwoFactorVerifyProps {
  onSuccess?: () => void;
  showBackupCodeOption?: boolean;
}

export function TwoFactorVerify({
  onSuccess,
  showBackupCodeOption = true,
}: TwoFactorVerifyProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/complete-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          type: mode,
          trustThisDevice: trustDevice,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.remainingBackupCodes !== undefined && data.remainingBackupCodes < 3) {
          // Warn about low backup codes
          alert(`Warning: You only have ${data.remainingBackupCodes} backup codes remaining. Please regenerate them in your security settings.`);
        }
        onSuccess?.();
        router.push(data.redirectTo || "/dashboard");
      } else {
        setError(data.error || "Verification failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="size-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app"
            : "Enter one of your backup codes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            {mode === "totp" ? (
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
                autoComplete="one-time-code"
                autoFocus
              />
            ) : (
              <Input
                type="text"
                maxLength={9}
                placeholder="XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-center text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="trust-device"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="trust-device" className="text-sm text-muted-foreground">
              Trust this device for 30 days
            </label>
          </div>

          <Button
            type="submit"
            disabled={loading || (mode === "totp" ? code.length !== 6 : code.length < 8)}
            className="w-full"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Verify
          </Button>

          {showBackupCodeOption && (
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setMode(mode === "totp" ? "backup" : "totp");
                setCode("");
                setError(null);
              }}
            >
              {mode === "totp" ? "Use a backup code instead" : "Use authenticator app instead"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
