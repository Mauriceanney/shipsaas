import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings",
  description: "Manage your general preferences",
};

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Customize your application experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
