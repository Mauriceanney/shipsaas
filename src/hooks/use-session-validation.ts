"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";

const VALIDATION_INTERVAL = 30000; // Check every 30 seconds

export function useSessionValidation() {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const validateSession = useCallback(async () => {
    try {
      const response = await fetch("/api/session/validate");
      const data = await response.json();

      if (!data.valid) {
        // Session is no longer valid, redirect to login
        router.push("/login?error=SessionRevoked");
      }
    } catch (error) {
      // On network error, don't redirect - might be temporary
      console.error("[useSessionValidation] Error:", error);
    }
  }, [router]);

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
