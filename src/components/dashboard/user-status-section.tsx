import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { UpgradeBanner } from "@/components/feature-gate";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function UserStatusSection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Get user data for onboarding and subscription
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      onboardingCompleted: true,
      subscription: {
        select: {
          status: true,
          plan: true,
        },
      },
    },
  });

  if (!user) return null;

  const showOnboarding = !user.onboardingCompleted;
  const hasSubscription =
    user.subscription?.status === "ACTIVE" ||
    user.subscription?.status === "TRIALING";
  const isFreePlan = !hasSubscription || user.subscription?.plan === "FREE";

  // Onboarding takes priority
  if (showOnboarding) {
    return (
      <OnboardingChecklist
        user={{ name: user.name, image: user.image }}
        hasSubscription={hasSubscription}
      />
    );
  }

  // Show upgrade banner for free plan users
  if (isFreePlan) {
    return (
      <UpgradeBanner
        feature="Advanced Analytics"
        description="Get detailed insights, custom reports, and real-time metrics with Pro."
        dismissible
        variant="gradient"
      />
    );
  }

  // No status to show for pro users with completed onboarding
  return null;
}
