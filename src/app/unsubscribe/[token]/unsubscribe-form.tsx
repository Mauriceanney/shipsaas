"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition, useEffect } from "react";

import {
  updateEmailPreferences,
  unsubscribeFromAll,
  type EmailPreferences,
} from "@/actions/email/unsubscribe";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface UnsubscribeFormProps {
  token: string;
  initialPreferences: EmailPreferences;
  isOneClick?: boolean;
}

export function UnsubscribeForm({
  token,
  initialPreferences,
  isOneClick = false,
}: UnsubscribeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState<EmailPreferences>(initialPreferences);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle one-click unsubscribe
  useEffect(() => {
    if (isOneClick) {
      startTransition(async () => {
        const result = await unsubscribeFromAll(token);
        if (result.success && result.preferences) {
          setPreferences(result.preferences);
          setSaved(true);
        } else {
          setError(result.error ?? "Failed to unsubscribe");
        }
      });
    }
  }, [isOneClick, token]);

  const handleSavePreferences = () => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateEmailPreferences(token, preferences);

      if (result.success) {
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to update preferences");
      }
    });
  };

  const handleUnsubscribeAll = () => {
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await unsubscribeFromAll(token);

      if (result.success && result.preferences) {
        setPreferences(result.preferences);
        setSaved(true);
      } else {
        setError(result.error ?? "Failed to unsubscribe");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which emails you&apos;d like to receive from us.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Your preferences have been saved.
          </div>
        )}

        {/* Marketing Emails */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing" className="text-base">
              Marketing Emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Promotions, special offers, and news about our products.
            </p>
          </div>
          <Switch
            id="marketing"
            checked={preferences.emailMarketingOptIn}
            onCheckedChange={(checked: boolean) =>
              setPreferences((prev) => ({ ...prev, emailMarketingOptIn: checked }))
            }
            disabled={isPending}
            data-testid="marketing-switch"
          />
        </div>

        {/* Product Updates */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="updates" className="text-base">
              Product Updates
            </Label>
            <p className="text-sm text-muted-foreground">
              New features, improvements, and product announcements.
            </p>
          </div>
          <Switch
            id="updates"
            checked={preferences.emailProductUpdates}
            onCheckedChange={(checked: boolean) =>
              setPreferences((prev) => ({ ...prev, emailProductUpdates: checked }))
            }
            disabled={isPending}
            data-testid="updates-switch"
          />
        </div>

        {/* Security Alerts */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="security" className="text-base">
              Security Alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Important security notifications about your account.
              <span className="block text-xs text-amber-600 dark:text-amber-400">
                Recommended to keep enabled for your security.
              </span>
            </p>
          </div>
          <Switch
            id="security"
            checked={preferences.emailSecurityAlerts}
            onCheckedChange={(checked: boolean) =>
              setPreferences((prev) => ({ ...prev, emailSecurityAlerts: checked }))
            }
            disabled={isPending}
            data-testid="security-switch"
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={handleUnsubscribeAll}
          disabled={isPending}
          data-testid="unsubscribe-all-btn"
        >
          Unsubscribe from All
        </Button>
        <Button
          onClick={handleSavePreferences}
          disabled={isPending}
          data-testid="save-preferences-btn"
        >
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
