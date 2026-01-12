"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateEmailPreferences,
  getEmailPreferences,
  type EmailPreferences as EmailPreferencesType,
} from "@/actions/gdpr";
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
  id: keyof EmailPreferencesType;
  label: string;
  description: string;
  recommended?: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "emailMarketingOptIn",
    label: "Marketing emails",
    description: "Receive promotional offers, tips, and news",
  },
  {
    id: "emailProductUpdates",
    label: "Product updates",
    description: "Get notified about new features, improvements, and updates",
  },
  {
    id: "emailSecurityAlerts",
    label: "Security alerts",
    description: "Important security notifications about your account",
    recommended: true,
  },
];

export function EmailPreferences() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<EmailPreferencesType>({
    emailMarketingOptIn: false,
    emailProductUpdates: false,
    emailSecurityAlerts: true,
  });

  useEffect(() => {
    async function loadPreferences() {
      try {
        const result = await getEmailPreferences();
        if (result.success) {
          setPreferences(result.preferences);
        }
      } catch {
        toast.error("Failed to load email preferences");
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  async function handleToggle(
    settingId: keyof EmailPreferencesType,
    checked: boolean
  ) {
    setIsPending(settingId);

    // Optimistically update
    const previousValue = preferences[settingId];
    setPreferences((prev) => ({ ...prev, [settingId]: checked }));

    try {
      const result = await updateEmailPreferences({
        [settingId]: checked,
      });

      if (!result.success) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [settingId]: previousValue }));
        toast.error(result.error || "Failed to update preferences");
        return;
      }

      toast.success("Preferences updated");
    } catch {
      // Revert on error
      setPreferences((prev) => ({ ...prev, [settingId]: previousValue }));
      toast.error("Failed to update preferences");
    } finally {
      setIsPending(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose which emails you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which emails you want to receive from us
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {setting.label}
                {setting.recommended && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Recommended)
                  </span>
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
      </CardContent>
    </Card>
  );
}
