"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureExceptionLazy } from "@/lib/sentry/lazy";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture exception in Sentry (lazy loaded)
    captureExceptionLazy(error);
    // Also log to console for development
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Something went wrong!
        </h1>
        <p className="mt-4 text-muted-foreground">
          An unexpected error has occurred. Please try again later.
        </p>
        {error.digest && (
          <p className="mt-2 text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
