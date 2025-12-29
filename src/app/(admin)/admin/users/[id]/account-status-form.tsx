"use client";

import { useTransition } from "react";

import { toggleUserStatus } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";

interface AccountStatusFormProps {
  userId: string;
  isDisabled: boolean;
}

export function AccountStatusForm({
  userId,
  isDisabled,
}: AccountStatusFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleUserStatus(userId);
      } catch (error) {
        // Handle error (e.g., can't disable own account)
        console.error(error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isDisabled
          ? "This account is currently disabled. The user cannot log in."
          : "This account is active. Disabling will prevent the user from logging in."}
      </p>
      <Button
        variant={isDisabled ? "default" : "destructive"}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
      >
        {isPending
          ? "Updating..."
          : isDisabled
            ? "Enable Account"
            : "Disable Account"}
      </Button>
    </div>
  );
}
