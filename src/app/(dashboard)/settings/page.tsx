import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Settings",
  description: "Manage your general preferences",
};

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="General Settings"
        description="Customize your application experience"
      />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
