import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and feature flags.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              General application settings will be available here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Feature flags configuration will be available here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Email service configuration will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
