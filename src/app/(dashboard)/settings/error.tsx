"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getErrorDescription,
  getErrorTitle,
  getUserFriendlyMessage,
  shouldShowTechnicalDetails,
} from "@/lib/errors/messages";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[Settings Error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{getErrorTitle("settings")}</CardTitle>
          <CardDescription>
            {getErrorDescription("settings")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {getUserFriendlyMessage(error)}
            </AlertDescription>
          </Alert>

          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          {shouldShowTechnicalDetails() && (
            <details className="rounded-md border p-3 text-xs">
              <summary className="cursor-pointer font-medium">
                Technical Details
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-muted-foreground">
                {error.message}
              </pre>
            </details>
          )}

          <Button onClick={reset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
