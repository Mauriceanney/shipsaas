"use client";

import { useState, useEffect } from "react";
import { Smartphone, Monitor, Tablet, Trash2, Loader2 } from "lucide-react";
import {
  getTrustedDevices,
  removeTrustedDevice,
  removeAllTrustedDevices,
  type TrustedDeviceInfo,
} from "@/actions/auth/two-factor/trust-device";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getDeviceIcon(deviceName: string) {
  const name = deviceName.toLowerCase();
  if (name.includes("iphone") || name.includes("android")) {
    return Smartphone;
  }
  if (name.includes("ipad") || name.includes("tablet")) {
    return Tablet;
  }
  return Monitor;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function TrustedDevicesList() {
  const [devices, setDevices] = useState<TrustedDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDevices() {
      const result = await getTrustedDevices();
      if (isMounted) {
        if (result.success) {
          setDevices(result.devices);
        } else {
          setError(result.error);
        }
        setLoading(false);
      }
    }

    loadDevices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = async (deviceId: string) => {
    setRemovingId(deviceId);
    const result = await removeTrustedDevice(deviceId);
    if (result.success) {
      setDevices(devices.filter((d) => d.id !== deviceId));
    } else {
      setError(result.error);
    }
    setRemovingId(null);
  };

  const handleRemoveAll = async () => {
    if (!confirm("Are you sure you want to remove all trusted devices? You will need to verify with 2FA on your next login.")) {
      return;
    }
    setRemovingAll(true);
    const result = await removeAllTrustedDevices();
    if (result.success) {
      setDevices([]);
    } else {
      setError(result.error);
    }
    setRemovingAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trusted Devices</CardTitle>
            <CardDescription>
              Devices that can skip two-factor authentication
            </CardDescription>
          </div>
          {devices.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveAll}
              disabled={removingAll}
            >
              {removingAll ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Remove All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No trusted devices. When you sign in with 2FA, you can choose to trust that device.
          </p>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const Icon = getDeviceIcon(device.deviceName);
              return (
                <div
                  key={device.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {device.deviceName}
                        {device.isCurrent && (
                          <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last used: {formatDate(device.lastUsedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(device.id)}
                    disabled={removingId === device.id}
                  >
                    {removingId === device.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
