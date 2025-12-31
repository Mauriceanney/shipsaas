import { Suspense } from "react";

import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { MetricsGridSkeleton } from "@/components/dashboard/metrics-grid-skeleton";
import { UserStatusSection } from "@/components/dashboard/user-status-section";
import { UserStatusSkeleton } from "@/components/dashboard/user-status-skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your personal dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name ?? "User"}!`}
      />

      {/* User status section (onboarding or upgrade banner) */}
      <Suspense fallback={<UserStatusSkeleton />}>
        <UserStatusSection />
      </Suspense>

      {/* Metrics grid with streaming */}
      <Suspense fallback={<MetricsGridSkeleton />}>
        <MetricsGrid />
      </Suspense>
    </div>
  );
}
