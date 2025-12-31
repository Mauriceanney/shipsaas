"use client";

/**
 * Impersonation Banner Component
 * Shows at the top of the page when an admin is impersonating a user
 */

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { endImpersonation, getImpersonationStatus } from "@/actions/admin/impersonation";
import { Button } from "@/components/ui/button";

type ImpersonationDetails = {
  originalAdminEmail: string;
  targetUserEmail: string;
  targetUserName: string | null;
  expiresAt: string;
};

export function ImpersonationBanner() {
  const [isPending, startTransition] = useTransition();
  const [impersonation, setImpersonation] = useState<ImpersonationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkImpersonation() {
      const result = await getImpersonationStatus();
      if (result.success && result.data.isImpersonating) {
        setImpersonation(result.data.impersonation);
      }
      setIsLoading(false);
    }
    checkImpersonation();
  }, []);

  function handleEndImpersonation() {
    startTransition(async () => {
      const result = await endImpersonation();

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Impersonation ended");

      // Force a full page navigation to restore admin session
      window.location.href = result.data.redirectUrl;
    });
  }

  if (isLoading || !impersonation) {
    return null;
  }

  const displayName = impersonation.targetUserName || impersonation.targetUserEmail;
  const expiresAt = new Date(impersonation.expiresAt);
  const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-2"
      role="alert"
      aria-live="polite"
    >
      <div className="container flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <span className="font-medium">
            Viewing as {displayName}
          </span>
          <span className="text-yellow-800 text-sm">
            ({timeRemaining} min remaining)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-yellow-950 hover:bg-yellow-600 hover:text-yellow-950"
          onClick={handleEndImpersonation}
          disabled={isPending}
        >
          {isPending ? (
            "Ending..."
          ) : (
            <>
              <X className="mr-1 h-4 w-4" aria-hidden="true" />
              End Impersonation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
