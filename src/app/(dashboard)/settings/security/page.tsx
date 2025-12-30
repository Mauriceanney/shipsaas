import { History, Key, Monitor, Shield } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginHistoryList } from "@/components/settings/login-history-list";
import { SessionsList } from "@/components/settings/sessions-list";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Settings",
  description: "Manage your security settings",
};

export default async function SecurityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's 2FA status
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground">
          Manage your account security settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TwoFactorSettings isEnabled={user?.twoFactorEnabled ?? false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Your account security status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Password Authentication</p>
              <p className="text-sm text-muted-foreground">
                Secured with OAuth or credentials
              </p>
            </div>
            <Button variant="outline" disabled>
              Change Password
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Password changes should be made through your authentication provider or forgot password flow.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Monitor className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active sessions across devices
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SessionsList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                Recent login attempts to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <LoginHistoryList />
        </CardContent>
      </Card>
    </div>
  );
}
