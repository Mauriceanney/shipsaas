import { redirect } from "next/navigation";

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
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" as Route },
        ]}
      />

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar navigation */}
        <aside className="w-full lg:w-64 lg:shrink-0">
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
