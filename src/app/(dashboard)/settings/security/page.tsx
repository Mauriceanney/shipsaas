import { redirect } from "next/navigation";

import { LoginHistoryList } from "@/components/settings/login-history-list";
import { SessionsList } from "@/components/settings/sessions-list";
import { TwoFactorSettings } from "@/components/settings/two-factor-settings";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-8">
      <PageHeader
        title="Security"
        description="Manage your account security settings"
      />

      {/* Two-Factor Authentication */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
        </div>
        <TwoFactorSettings isEnabled={user?.twoFactorEnabled ?? false} />
      </section>

      {/* Password */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">
            Your account security status
          </p>
        </div>
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
      </section>

      {/* Active Sessions */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Active Sessions</h2>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions across devices
          </p>
        </div>
        <SessionsList />
      </section>

      {/* Login History */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Login History</h2>
          <p className="text-sm text-muted-foreground">
            Recent login attempts to your account
          </p>
        </div>
        <LoginHistoryList />
      </section>
    </div>
  );
}
