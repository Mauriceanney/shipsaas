import { Suspense } from "react";

import {
  getAppConfigs,
  getAuditLogs,
  getFeatureFlags,
} from "@/actions/admin/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";

import { AppConfigForm } from "./app-config-form";
import { AuditLogTable } from "./audit-log-table";
import { FeatureFlagsForm } from "./feature-flags-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "App Settings",
  description: "Configure application settings and feature flags",
  robots: { index: false, follow: false },
};

async function SettingsContent() {
  const [configs, flags, auditLogs] = await Promise.all([
    getAppConfigs(),
    getFeatureFlags(),
    getAuditLogs(20),
  ]);

  // Filter out feature flags from general configs
  const generalConfigs = configs.filter((c) => c.category !== "features");

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureFlagsForm flags={flags} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>App Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <AppConfigForm configs={generalConfigs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Configuration Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={auditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="App Settings"
        description="Configure application settings and feature flags."
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
