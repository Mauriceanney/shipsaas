"use client";

/**
 * Onboarding Checklist Component
 * Guides new users through initial setup steps
 */

import { Check, ChevronRight, Sparkles, User, CreditCard, Settings, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { toast } from "sonner";

import { dismissOnboarding, completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import type { Route } from "next";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: Route;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
}

interface OnboardingChecklistProps {
  user: {
    name?: string | null;
    image?: string | null;
  };
  hasSubscription: boolean;
}

export function OnboardingChecklist({ user, hasSubscription }: OnboardingChecklistProps) {
  const _router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      title: "Complete your profile",
      description: "Add your name to personalize your experience",
      href: "/settings/profile" as Route,
      icon: User,
      isComplete: !!user.name && user.name.trim().length > 0,
    },
    {
      id: "avatar",
      title: "Add a profile picture",
      description: "Upload an avatar to make your account recognizable",
      href: "/settings/profile" as Route,
      icon: User,
      isComplete: !!user.image,
    },
    {
      id: "subscription",
      title: "Choose a plan",
      description: "Select a subscription plan that fits your needs",
      href: "/pricing" as Route,
      icon: CreditCard,
      isComplete: hasSubscription,
    },
    {
      id: "settings",
      title: "Explore settings",
      description: "Customize notifications and preferences",
      href: "/settings" as Route,
      icon: Settings,
      isComplete: false, // This will be marked complete when they visit settings
    },
  ];

  const completedSteps = steps.filter((step) => step.isComplete).length;
  const totalSteps = steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);
  const allComplete = completedSteps === totalSteps;

  // Show confetti when all steps are complete
  useEffect(() => {
    if (allComplete && !showConfetti) {
      setShowConfetti(true);
      // Auto-complete onboarding after celebration
      const timer = setTimeout(() => {
        handleComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete]);

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await dismissOnboarding();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setIsVisible(false);
      toast.success("Onboarding dismissed. You can always find help in settings.");
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeOnboarding();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setIsVisible(false);
    });
  };

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden">
      {/* Confetti effect when complete */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-0 left-1/4 animate-bounce delay-100">
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="absolute top-0 right-1/4 animate-bounce delay-200">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="absolute top-0 left-1/2 animate-bounce">
            <Sparkles className="h-8 w-8 text-green-500" />
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {allComplete ? (
                <>
                  <Sparkles className="h-5 w-5 text-primary" />
                  All done!
                </>
              ) : (
                "Getting Started"
              )}
            </CardTitle>
            <CardDescription>
              {allComplete
                ? "You've completed all the steps. Welcome aboard!"
                : "Complete these steps to get the most out of ShipSaaS"}
            </CardDescription>
          </div>
          {!allComplete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={handleDismiss}
              disabled={isPending}
              aria-label="Dismiss onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps} of {totalSteps} complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                step.isComplete
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                  : "border-border hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  step.isComplete
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.isComplete && "text-green-700 dark:text-green-400"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              {!step.isComplete && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </Link>
          );
        })}

        {allComplete && (
          <Button
            className="w-full mt-4"
            onClick={handleComplete}
            disabled={isPending}
          >
            {isPending ? "Finishing..." : "Finish Setup"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
