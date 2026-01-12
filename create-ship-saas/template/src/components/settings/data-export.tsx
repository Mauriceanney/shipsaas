"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  requestDataExport,
  getLatestDataExportRequest,
} from "@/actions/gdpr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "EXPIRED" | null;

interface ExportData {
  status: ExportStatus;
  downloadUrl: string | null;
  expiresAt: Date | null;
  completedAt: Date | null;
}

export function DataExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [exportData, setExportData] = useState<ExportData | null>(null);

  useEffect(() => {
    async function checkExistingExport() {
      try {
        const result = await getLatestDataExportRequest();
        if (result.success && result.data) {
          setExportData({
            status: result.data.status as ExportStatus,
            downloadUrl: result.data.downloadUrl,
            expiresAt: result.data.expiresAt,
            completedAt: result.data.completedAt,
          });
        }
      } catch {
        // No existing export, that's fine
      } finally {
        setIsChecking(false);
      }
    }

    checkExistingExport();
  }, []);

  async function handleExport() {
    setIsLoading(true);

    try {
      const result = await requestDataExport();

      if (result.success) {
        toast.success("Your data export is ready!");
        // Refresh export status
        const statusResult = await getLatestDataExportRequest();
        if (statusResult.success && statusResult.data) {
          setExportData({
            status: statusResult.data.status as ExportStatus,
            downloadUrl: statusResult.data.downloadUrl,
            expiresAt: statusResult.data.expiresAt,
            completedAt: statusResult.data.completedAt,
          });
        }
      } else {
        toast.error(result.error || "Failed to request data export");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownload() {
    if (exportData?.downloadUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = exportData.downloadUrl;
      link.download = `my-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    }
  }

  const isExpired =
    exportData?.expiresAt && new Date(exportData.expiresAt) < new Date();

  const canDownload =
    exportData?.status === "COMPLETED" &&
    exportData?.downloadUrl &&
    !isExpired;

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
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Account information (name, email)</li>
            <li>Connected accounts</li>
            <li>Login history</li>
            <li>Session data</li>
            <li>Subscription details</li>
          </ul>
        </div>

        {/* Export Status */}
        {!isChecking && exportData && (
          <div className="rounded-md border p-4">
            <div className="flex items-center gap-3">
              {exportData.status === "COMPLETED" && !isExpired && (
                <>
                  <CheckCircle2 className="size-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Export ready</p>
                    <p className="text-xs text-muted-foreground">
                      Available until{" "}
                      {new Date(exportData.expiresAt!).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
              {exportData.status === "PROCESSING" && (
                <>
                  <Clock className="size-5 animate-pulse text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Processing...</p>
                    <p className="text-xs text-muted-foreground">
                      Your export is being prepared
                    </p>
                  </div>
                </>
              )}
              {(exportData.status === "FAILED" || isExpired) && (
                <>
                  <AlertCircle className="size-5 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isExpired ? "Export expired" : "Export failed"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please request a new export
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {canDownload ? (
            <Button onClick={handleDownload}>
              <Download className="size-4" />
              Download Export
            </Button>
          ) : (
            <Button
              onClick={handleExport}
              disabled={isLoading || isChecking || exportData?.status === "PROCESSING"}
            >
              {isLoading || isChecking ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isLoading ? "Preparing Export..." : "Checking..."}
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  {exportData?.status === "PROCESSING"
                    ? "Export in Progress..."
                    : "Export My Data"}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
