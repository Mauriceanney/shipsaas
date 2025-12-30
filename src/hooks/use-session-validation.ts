"use client";

import { useEffect, useRef, useCallback, useState } from "react";

import { forceLogoutAction } from "@/actions/auth/force-logout";

const VALIDATION_INTERVAL = 30000; // Check every 30 seconds

export function useSessionValidation() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const validateSession = useCallback(async () => {
    // Prevent multiple logout attempts
    if (isLoggingOut) return;

    try {
      const response = await fetch("/api/session/validate");
      const data = await response.json();

      if (!data.valid) {
        setIsLoggingOut(true);
        // Clear interval to prevent more checks
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        // Session is no longer valid, force logout
        await forceLogoutAction();
      }
    } catch (error) {
      // On network error, don't redirect - might be temporary
      console.error("[useSessionValidation] Error:", error);
    }
  }, [isLoggingOut]);

  useEffect(() => {
    // Start polling
    intervalRef.current = setInterval(validateSession, VALIDATION_INTERVAL);

    // Also validate immediately on mount
    validateSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [validateSession]);
}
