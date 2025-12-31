import Link from "next/link";

import { AccountDeletionCard } from "@/components/settings/account-deletion-card";
import { DataExportCard } from "@/components/settings/data-export-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Settings",
  description: "Manage your data and privacy settings",
};

export default function PrivacySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy Settings"
        description="Manage your data and exercise your privacy rights"
      />

      {/* Privacy Policy Link */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>
            Learn about how we collect, use, and protect your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/privacy"
            className="text-primary underline hover:no-underline"
          >
            View our Privacy Policy
          </Link>
        </CardContent>
      </Card>

      {/* Data Export */}
      <DataExportCard />

      {/* Account Deletion */}
      <AccountDeletionCard />
    </div>
  );
}
