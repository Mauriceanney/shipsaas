"use client";

import { useState } from "react";
import { Copy, Check, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BackupCodesDisplayProps {
  codes: string[];
  onComplete?: (() => void) | undefined;
  isInitialSetup?: boolean;
}

export function BackupCodesDisplay({
  codes,
  onComplete,
  isInitialSetup = false,
}: BackupCodesDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const copyToClipboard = async () => {
    const text = codes.join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCodes = () => {
    const text = `Two-Factor Authentication Backup Codes
=====================================
Generated: ${new Date().toLocaleString()}

Keep these codes in a safe place. Each code can only be used once.

${codes.join("\n")}

=====================================
If you lose access to your authenticator app, you can use one of these
codes to sign in to your account.
`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-500" />
          Save Your Backup Codes
        </CardTitle>
        <CardDescription>
          {isInitialSetup
            ? "Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device."
            : "These are your new backup codes. Your previous codes are no longer valid."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-4">
          {codes.map((code, index) => (
            <code
              key={index}
              className="rounded bg-background px-2 py-1 text-center font-mono text-sm"
            >
              {code}
            </code>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={downloadCodes}
          >
            <Download className="size-4" />
            Download
          </Button>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> Each backup code can only be used once. Store them
            securely and don&apos;t share them with anyone.
          </p>
        </div>

        {isInitialSetup && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-saved"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="confirm-saved" className="text-sm">
                I have saved my backup codes in a secure location
              </label>
            </div>

            <Button
              onClick={onComplete}
              disabled={!confirmed}
              className="w-full"
            >
              Complete Setup
            </Button>
          </div>
        )}

        {!isInitialSetup && onComplete && (
          <Button onClick={onComplete} className="w-full">
            Done
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
