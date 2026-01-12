"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, Loader2, AlertCircle, Shield } from "lucide-react";
import {
  getEmailPreferencesByToken,
  updateEmailPreferencesByToken,
  unsubscribeFromAll,
  type EmailPreferences,
} from "@/actions/gdpr";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSetting {
  id: keyof EmailPreferences;
  label: string;
  description: string;
  recommended?: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "emailMarketingOptIn",
    label: "Marketing emails",
    description: "Promotional offers, tips, and news",
  },
  {
    id: "emailProductUpdates",
    label: "Product updates",
    description: "New features, improvements, and updates",
  },
  {
    id: "emailSecurityAlerts",
    label: "Security alerts",
    description: "Important security notifications",
    recommended: true,
  },
];

type Status = "loading" | "loaded" | "success" | "error" | "invalid";

interface PageParams {
  token: string;
}

export default function UnsubscribePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string>("");
  const [preferences, setPreferences] = useState<EmailPreferences>({
    emailMarketingOptIn: false,
    emailProductUpdates: false,
    emailSecurityAlerts: true,
  });
  const [isPending, setIsPending] = useState<string | null>(null);
  const [isUnsubscribingAll, setIsUnsubscribingAll] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const result = await getEmailPreferencesByToken(token);
        if (result.success) {
          setEmail(result.email);
          setPreferences(result.preferences);
          setStatus("loaded");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("error");
      }
    }

    if (token) {
      loadPreferences();
    } else {
      setStatus("invalid");
    }
  }, [token]);

  async function handleToggle(
    settingId: keyof EmailPreferences,
    checked: boolean
  ) {
    setIsPending(settingId);

    // Optimistically update
    const previousValue = preferences[settingId];
    setPreferences((prev) => ({ ...prev, [settingId]: checked }));

    try {
      const result = await updateEmailPreferencesByToken(token, {
        [settingId]: checked,
      });

      if (!result.success) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [settingId]: previousValue }));
      }
    } catch {
      // Revert on error
      setPreferences((prev) => ({ ...prev, [settingId]: previousValue }));
    } finally {
      setIsPending(null);
    }
  }

  async function handleUnsubscribeAll() {
    setIsUnsubscribingAll(true);

    try {
      const result = await unsubscribeFromAll(token);
      if (result.success) {
        setPreferences(result.preferences);
        setStatus("success");
      }
    } catch {
      // Keep current state on error
    } finally {
      setIsUnsubscribingAll(false);
    }
  }

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This unsubscribe link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              If you need to manage your email preferences, please log in to
              your account.
            </p>
            <Button asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="size-6 text-destructive" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We couldn&apos;t load your preferences. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (after unsubscribing from all)
  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="size-6 text-green-500" />
            </div>
            <CardTitle>You&apos;ve been unsubscribed</CardTitle>
            <CardDescription>
              We&apos;ve updated your email preferences for {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              You will no longer receive marketing or product update emails. We
              will still send you important security alerts.
            </p>
            <Button
              variant="outline"
              onClick={() => setStatus("loaded")}
            >
              Manage Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loaded state - show preferences
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage email preferences for {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationSettings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between space-x-4"
            >
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={setting.id}
                  className="flex items-center gap-2 text-sm font-medium leading-none"
                >
                  {setting.label}
                  {setting.recommended && (
                    <Shield className="size-3 text-muted-foreground" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
              </div>
              <Switch
                id={setting.id}
                checked={preferences[setting.id]}
                onCheckedChange={(checked) => handleToggle(setting.id, checked)}
                disabled={isPending === setting.id}
                aria-label={`Toggle ${setting.label}`}
              />
            </div>
          ))}

          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleUnsubscribeAll}
              disabled={isUnsubscribingAll}
            >
              {isUnsubscribingAll ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                "Unsubscribe from all (except security)"
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Security alerts cannot be disabled as they contain important
            information about your account security.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
