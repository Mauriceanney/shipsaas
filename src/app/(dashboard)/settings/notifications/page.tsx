import { redirect } from "next/navigation";

import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notification Preferences",
  description: "Manage your email notification settings",
};

export default async function NotificationsSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      emailMarketingOptIn: true,
      emailProductUpdates: true,
      emailSecurityAlerts: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <NotificationPreferences preferences={user} />
    </div>
  );
}
