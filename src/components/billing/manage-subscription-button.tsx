"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ManageSubscriptionButtonProps {
  hasSubscription: boolean;
}

export function ManageSubscriptionButton({
  hasSubscription,
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!hasSubscription) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open portal");
      }

      // Redirect to Stripe Portal
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  if (!hasSubscription) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? "Loading..." : "Manage Subscription"}
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}
