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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
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
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </SessionValidationProvider>
  );
}
