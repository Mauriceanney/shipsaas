"use client";

import { Monitor, Smartphone, Tablet, LogOut, Loader2 } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { toast } from "sonner";

import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
  type UserSessionData,
} from "@/actions/session";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// No props needed - current session is determined server-side

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

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function SessionsList() {
  const [isPending, startTransition] = useTransition();
  const [sessions, setSessions] = useState<UserSessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      const result = await getActiveSessions();
      if (result.success) {
        setSessions(result.data);
      } else {
        setLoadError(result.error);
      }
      setIsLoading(false);
    };
    fetchSessions();
  }, []);

  const handleRevokeSession = (sessionId: string) => {
    setRevokingId(sessionId);
    startTransition(async () => {
      const result = await revokeSession({ sessionId });
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Session revoked successfully");
      } else {
        toast.error(result.error);
      }
      setRevokingId(null);
    });
  };

  const handleRevokeAllOther = () => {
    startTransition(async () => {
      const result = await revokeAllOtherSessions();
      if (result.success) {
        // Refetch to get the updated list
        const refreshResult = await getActiveSessions();
        if (refreshResult.success) {
          setSessions(refreshResult.data);
        }
        toast.success(`Revoked ${result.data.revokedCount} session(s)`);
      } else {
        toast.error(result.error);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active sessions found
      </div>
    );
  }

  const hasOtherSessions = sessions.length > 1;

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const DeviceIcon = getDeviceIcon(session.deviceName);

        return (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <DeviceIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {session.deviceName ?? "Unknown Device"}
                  </p>
                  {session.isCurrent && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.ipAddress ?? "Unknown IP"} •{" "}
                  {formatRelativeTime(new Date(session.lastActiveAt))}
                </p>
              </div>
            </div>
            {!session.isCurrent && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending && revokingId === session.id}
                  >
                    {isPending && revokingId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign out this device. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRevokeSession(session.id)}>
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      })}

      {hasOtherSessions && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Sign Out All Other Devices
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign Out All Other Devices</AlertDialogTitle>
              <AlertDialogDescription>
                This will sign out all devices except this one. You will need to sign
                in again on those devices.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevokeAllOther}>
                Sign Out All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
