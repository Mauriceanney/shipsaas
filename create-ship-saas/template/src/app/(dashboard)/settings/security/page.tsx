"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ShieldCheck, ShieldOff, Key, Loader2 } from "lucide-react";
import { disableTwoFactor } from "@/actions/auth/two-factor/disable";
import { regenerateBackupCodes } from "@/actions/auth/two-factor/regenerate-backup-codes";
import {
  TwoFactorSetup,
  BackupCodesDisplay,
  TrustedDevicesList,
} from "@/components/auth/two-factor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface UserSecurityStatus {
  twoFactorEnabled: boolean;
}

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<UserSecurityStatus | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/auth/2fa-status");
        const data = await response.json();
        setStatus(data);
      } catch {
        setError("Failed to load security settings");
      }
      setLoading(false);
    };

    fetchStatus();
  }, []);

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const result = await disableTwoFactor(disableCode);

    if (result.success) {
      setStatus({ twoFactorEnabled: false });
      setShowDisable(false);
      setDisableCode("");
    } else {
      setError(result.error);
    }

    setActionLoading(false);
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);

    const result = await regenerateBackupCodes(regenerateCode);

    if (result.success) {
      setNewBackupCodes(result.backupCodes);
      setShowRegenerate(false);
      setRegenerateCode("");
    } else {
      setError(result.error);
    }

    setActionLoading(false);
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    setStatus({ twoFactorEnabled: true });
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="container max-w-md py-8">
        <TwoFactorSetup
          onComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      </div>
    );
  }

  if (newBackupCodes) {
    return (
      <div className="container max-w-md py-8">
        <BackupCodesDisplay
          codes={newBackupCodes}
          onComplete={() => setNewBackupCodes(null)}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your account security and two-factor authentication
        </p>
      </div>

      <div className="space-y-6">
        {/* 2FA Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {status?.twoFactorEnabled ? (
                <ShieldCheck className="size-6 text-green-500" />
              ) : (
                <Shield className="size-6 text-muted-foreground" />
              )}
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  {status?.twoFactorEnabled
                    ? "Your account is protected with two-factor authentication"
                    : "Add an extra layer of security to your account"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 text-sm text-destructive">{error}</p>
            )}

            {status?.twoFactorEnabled ? (
              <div className="space-y-4">
                {showDisable ? (
                  <form onSubmit={handleDisable} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter your authenticator code to disable two-factor authentication.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                      className="max-w-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowDisable(false);
                          setDisableCode("");
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={actionLoading || disableCode.length !== 6}
                      >
                        {actionLoading && <Loader2 className="size-4 animate-spin" />}
                        Disable 2FA
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowDisable(true)}
                    >
                      <ShieldOff className="size-4" />
                      Disable 2FA
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={() => setShowSetup(true)}>
                <Shield className="size-4" />
                Enable Two-Factor Authentication
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Backup Codes Card (only if 2FA is enabled) */}
        {status?.twoFactorEnabled && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Key className="size-6 text-muted-foreground" />
                <div>
                  <CardTitle>Backup Codes</CardTitle>
                  <CardDescription>
                    Recovery codes to use if you lose access to your authenticator
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showRegenerate ? (
                <form onSubmit={handleRegenerate} className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your authenticator code to generate new backup codes. This will
                    invalidate all existing backup codes.
                  </p>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={regenerateCode}
                    onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ""))}
                    className="max-w-[200px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRegenerate(false);
                        setRegenerateCode("");
                        setError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={actionLoading || regenerateCode.length !== 6}
                    >
                      {actionLoading && <Loader2 className="size-4 animate-spin" />}
                      Generate New Codes
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerate(true)}
                >
                  <Key className="size-4" />
                  Regenerate Backup Codes
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trusted Devices (only if 2FA is enabled) */}
        {status?.twoFactorEnabled && <TrustedDevicesList />}
      </div>
    </div>
  );
}
