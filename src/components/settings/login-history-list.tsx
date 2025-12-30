"use client";

import {
  CheckCircle,
  XCircle,
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

import { getLoginHistory, type LoginHistoryData } from "@/actions/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getDeviceIcon(deviceName: string | null) {
  const name = deviceName?.toLowerCase() ?? "";
  if (name.includes("iphone") || name.includes("android") || name.includes("mobile")) {
    return Smartphone;
  }
  if (name.includes("ipad") || name.includes("tablet")) {
    return Tablet;
  }
  return Monitor;
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function getFailReasonLabel(reason: string | null): string {
  if (!reason) return "Unknown";
  switch (reason) {
    case "invalid_credentials":
      return "Invalid credentials";
    case "account_disabled":
      return "Account disabled";
    case "2fa_failed":
      return "2FA failed";
    case "email_not_verified":
      return "Email not verified";
    default:
      return reason;
  }
}

function getProviderLabel(provider: string): string {
  switch (provider) {
    case "credentials":
      return "Email/Password";
    case "google":
      return "Google";
    case "github":
      return "GitHub";
    case "two-factor":
      return "2FA Verification";
    default:
      return provider;
  }
}

export function LoginHistoryList() {
  const [history, setHistory] = useState<LoginHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const result = await getLoginHistory();
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error);
      }
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No login history found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Device</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((entry) => {
            const DeviceIcon = getDeviceIcon(entry.deviceName);
            return (
              <TableRow key={entry.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {entry.success ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">Success</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          {getFailReasonLabel(entry.failReason)}
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {entry.deviceName ?? "Unknown"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {entry.ipAddress ?? "Unknown"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {getProviderLabel(entry.provider)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
