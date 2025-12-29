import { Suspense } from "react";

import {
  getAppConfigs,
  getAuditLogs,
  getFeatureFlags,
} from "@/actions/admin/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AppConfigForm } from "./app-config-form";
import { AuditLogTable } from "./audit-log-table";
import { FeatureFlagsForm } from "./feature-flags-form";

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and feature flags.
        </p>
      </div>

      <Suspense
        fallback={<div className="py-8 text-center">Loading settings...</div>}
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
