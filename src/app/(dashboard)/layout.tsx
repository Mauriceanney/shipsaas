import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";

import { checkAndSendWelcomeEmail } from "@/actions/auth/send-welcome-email";
import { DunningBanner } from "@/components/billing/dunning-banner";
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

  const subscription = {
    plan: session.subscription?.plan ?? "FREE",
    status: session.subscription?.status ?? "INACTIVE",
  };

  return (
    <SessionProvider session={session}>
      <SessionValidationProvider>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar user={user} subscription={subscription} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
              <Suspense fallback={null}>
                <DunningBanner />
              </Suspense>
              {children}
            </div>
          </main>
        </div>
      </SessionValidationProvider>
    </SessionProvider>
  );
}
