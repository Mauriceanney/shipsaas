import { redirect } from "next/navigation";

import { SettingsMobileNav } from "@/components/settings/settings-mobile-nav";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { auth } from "@/lib/auth";

import type { Route } from "next";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Mobile header with navigation */}
      <div className="flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold">Settings</h1>
        <SettingsMobileNav />
      </div>

      {/* Desktop breadcrumb */}
      <div className="hidden md:block">
        <Breadcrumb
          items={[
            { label: "Settings", href: "/settings" as Route },
          ]}
        />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar navigation - desktop only */}
        <aside className="hidden md:block w-full lg:w-64 lg:shrink-0">
          <SettingsNav />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
