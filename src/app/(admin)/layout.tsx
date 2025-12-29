import { AdminSidebar } from "@/components/admin";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect all admin routes - redirects if not admin
  await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  );
}
