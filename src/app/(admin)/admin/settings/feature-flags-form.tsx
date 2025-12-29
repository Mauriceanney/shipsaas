"use client";

import { useTransition } from "react";

import { toggleFeatureFlag } from "@/actions/admin/config";
import { Button } from "@/components/ui/button";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

interface FeatureFlagsFormProps {
  flags: FeatureFlag[];
}

export function FeatureFlagsForm({ flags }: FeatureFlagsFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (key: string) => {
    startTransition(async () => {
      await toggleFeatureFlag(key);
    });
  };

  if (flags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No feature flags configured. Add feature flags in the database to
        manage them here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toggle feature flags to enable or disable features across the
        application.
      </p>

      <div className="space-y-3">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <div className="font-medium capitalize">
                {flag.key.replace(/_/g, " ")}
              </div>
              {flag.description && (
                <div className="text-sm text-muted-foreground">
                  {flag.description}
                </div>
              )}
            </div>
            <Button
              variant={flag.enabled ? "default" : "outline"}
              size="sm"
              onClick={() => handleToggle(flag.key)}
              disabled={isPending}
            >
              {flag.enabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
