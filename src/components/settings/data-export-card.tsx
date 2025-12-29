"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { requestDataExport } from "@/actions/gdpr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DataExportCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleExport() {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await requestDataExport();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Your data export has been initiated. Check back in a few minutes to download.",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to request data export",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>
          Download a copy of your personal data in JSON format. This includes
          your profile, preferences, and activity history.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Your export will include:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Account information (name, email)</li>
            <li>Connected accounts</li>
            <li>Subscription details</li>
          </ul>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <Button onClick={handleExport} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export My Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
