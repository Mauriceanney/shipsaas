import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { checkAndSendWelcomeEmail } from "@/actions/auth/send-welcome-email";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SessionValidationProvider } from "@/components/providers/session-validation-provider";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Send welcome email for OAuth users on first visit (non-blocking)
  checkAndSendWelcomeEmail().catch(() => {
    // Silently ignore errors - non-critical operation
  });

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <SessionProvider session={session}>
      <SessionValidationProvider>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar user={user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </SessionValidationProvider>
    </SessionProvider>
  );
}
