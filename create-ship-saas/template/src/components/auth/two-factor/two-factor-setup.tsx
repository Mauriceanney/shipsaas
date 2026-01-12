"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { enableTwoFactor } from "@/actions/auth/two-factor/enable";
import { setupTwoFactor } from "@/actions/auth/two-factor/setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BackupCodesDisplay } from "./backup-codes-display";

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"initial" | "setup" | "verify" | "backup">("initial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);

    const result = await setupTwoFactor();

    if (result.success) {
      setSetupData({
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      });
      setStep("setup");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await enableTwoFactor(verificationCode);

    if (result.success) {
      setStep("backup");
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  if (step === "initial") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by enabling two-factor authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You will need an authenticator app like Google Authenticator, Authy, or 1Password to
            scan a QR code and generate verification codes.
          </p>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSetup} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Get Started
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "setup") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {setupData && (
            <>
              <div className="flex justify-center">
                <div className="rounded-lg border bg-white p-4">
                  <Image
                    src={setupData.qrCode}
                    alt="2FA QR Code"
                    width={200}
                    height={200}
                    unoptimized
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Can&apos;t scan? Enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                    {showSecret ? setupData.secret : "••••••••••••••••"}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copySecret}
                  >
                    {secretCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep("verify")} className="w-full">
                Continue
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === "verify") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to verify setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
                autoComplete="one-time-code"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("setup")}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "backup" && setupData) {
    return (
      <BackupCodesDisplay
        codes={setupData.backupCodes}
        onComplete={onComplete ?? undefined}
        isInitialSetup
      />
    );
  }

  return null;
}
