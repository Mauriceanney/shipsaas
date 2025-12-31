"use client";

/**
 * Notification Preferences Component
 * Allows users to manage their email notification settings
 */

import { useTransition } from "react";
import { toast } from "sonner";

import { updateNotificationPreferences } from "@/actions/settings/update-notification-preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationPreferencesProps {
  preferences: {
    emailMarketingOptIn: boolean;
    emailProductUpdates: boolean;
    emailSecurityAlerts: boolean;
  };
}

interface NotificationSetting {
  id: "emailMarketingOptIn" | "emailProductUpdates" | "emailSecurityAlerts";
  label: string;
  description: string;
  recommended?: boolean;
}

const notificationSettings: NotificationSetting[] = [
  {
    id: "emailMarketingOptIn",
    label: "Marketing emails",
    description: "Receive promotional offers, tips, and news about ShipSaaS",
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

export function NotificationPreferences({ preferences }: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (settingId: NotificationSetting["id"], checked: boolean) => {
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        [settingId]: checked,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Preferences updated");
    });
  };

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
              disabled={isPending}
              aria-label={`Toggle ${setting.label}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
