import Link from "next/link";

import { AdminMobileNav, AdminSidebar } from "@/components/admin";
import { SessionValidationProvider } from "@/components/providers/session-validation-provider";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all admin routes - redirects if not admin
  await requireAdmin();

  return (
    <SessionValidationProvider>
      <div className="flex h-screen flex-col md:flex-row overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <Link href="/admin" className="font-semibold text-lg">
            Admin Panel
          </Link>
          <AdminMobileNav />
        </header>

        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </SessionValidationProvider>
  );
}
