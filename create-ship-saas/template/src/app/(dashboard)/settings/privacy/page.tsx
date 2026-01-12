import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { DataExport, DeleteAccount, EmailPreferences } from "@/components/settings";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Privacy Settings",
  description: "Manage your privacy settings, data export, and account deletion",
};

export default async function PrivacySettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Shield className="size-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Privacy Settings</h1>
            <p className="text-muted-foreground">
              Manage your data, privacy preferences, and account
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Email Preferences */}
        <EmailPreferences />

        {/* Data Export */}
        <DataExport />

        {/* Delete Account */}
        <DeleteAccount />
      </div>
    </div>
  );
}
