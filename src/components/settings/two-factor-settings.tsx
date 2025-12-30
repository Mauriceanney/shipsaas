"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { useState, useTransition } from "react";

import {
  setupTwoFactorAction,
  enableTwoFactorAction,
  disableTwoFactorAction,
} from "@/actions/auth/two-factor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TwoFactorSettingsProps {
  isEnabled: boolean;
}

export function TwoFactorSettings({ isEnabled: initialEnabled }: TwoFactorSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Setup dialog state
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
  } | null>(null);
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Disable dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  // Controlled input states for TOTP codes
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const handleDigitOnlyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Only allow digits
    setter(e.target.value.replace(/\D/g, ""));
  };

  const handleSetup = () => {
    setError(null);
    startTransition(async () => {
      const result = await setupTwoFactorAction();
      if (result.success) {
        setSetupData({ secret: result.secret, qrCode: result.qrCode });
        setSetupStep("qr");
        setShowSetupDialog(true);
      } else {
        setError(result.error);
      }
    });
  };

  const handleVerifySetup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await enableTwoFactorAction({ code: setupCode });
      if (result.success) {
        setBackupCodes(result.backupCodes);
        setSetupStep("backup");
        setIsEnabled(true);
        setSetupCode(""); // Clear the code
      } else {
        setError(result.error);
      }
    });
  };

  const handleDisable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await disableTwoFactorAction({ code: disableCode });
      if (result.success) {
        setIsEnabled(false);
        setShowDisableDialog(false);
        setDisableCode(""); // Clear the code
      } else {
        setError(result.error);
      }
    });
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
  };

  const handleDownloadBackupCodes = () => {
    const content = `Two-Factor Authentication Backup Codes\n${"=".repeat(40)}\n\nKeep these codes in a safe place. Each code can only be used once.\n\n${backupCodes.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2fa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Your account is protected with 2FA"
                : "Add an extra layer of security to your account"}
            </p>
          </div>
        </div>
        {isEnabled ? (
          <Button
            variant="destructive"
            onClick={() => setShowDisableDialog(true)}
            disabled={isPending}
          >
            Disable 2FA
          </Button>
        ) : (
          <Button onClick={handleSetup} disabled={isPending}>
            {isPending ? "Setting up..." : "Enable 2FA"}
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(open) => {
        setShowSetupDialog(open);
        if (!open) {
          setSetupCode("");
          setError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {setupStep === "qr" && "Scan QR Code"}
              {setupStep === "verify" && "Verify Setup"}
              {setupStep === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {setupStep === "qr" &&
                "Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)"}
              {setupStep === "verify" &&
                "Enter the 6-digit code from your authenticator app to verify"}
              {setupStep === "backup" &&
                "Save these backup codes in a safe place. You can use them to access your account if you lose your device."}
            </DialogDescription>
          </DialogHeader>

          {setupStep === "qr" && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  className="h-48 w-48"
                />
              </div>
              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <code className="block rounded bg-muted p-2 text-center text-sm">
                  {setupData.secret}
                </code>
              </div>
              <Button className="w-full" onClick={() => setSetupStep("verify")}>
                Continue
              </Button>
            </div>
          )}

          {setupStep === "verify" && (
            <form onSubmit={handleVerifySetup} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="setup-code">Verification Code</Label>
                <Input
                  id="setup-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  maxLength={6}
                  value={setupCode}
                  onChange={(e) => handleDigitOnlyChange(e, setSetupCode)}
                  required
                  disabled={isPending}
                  className="text-center text-lg tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSetupStep("qr")}
                  disabled={isPending}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? "Verifying..." : "Verify & Enable"}
                </Button>
              </div>
            </form>
          )}

          {setupStep === "backup" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="rounded bg-muted p-2 text-center text-sm font-mono"
                  >
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyBackupCodes}
                >
                  Copy
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadBackupCodes}
                >
                  Download
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setShowSetupDialog(false);
                  setSetupData(null);
                  setBackupCodes([]);
                  setSetupStep("qr");
                }}
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={(open) => {
        setShowDisableDialog(open);
        if (!open) {
          setDisableCode("");
          setError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authentication code to disable 2FA. This will make your
              account less secure.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDisable} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="disable-code">Verification Code</Label>
              <Input
                id="disable-code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="000000"
                maxLength={6}
                value={disableCode}
                onChange={(e) => handleDigitOnlyChange(e, setDisableCode)}
                required
                disabled={isPending}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? "Disabling..." : "Disable 2FA"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
