"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { toggleUserStatus } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
        toast.success(isDisabled ? "Account enabled" : "Account disabled");
      } catch {
        toast.error("Failed to update account status");
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
      {isDisabled ? (
        <Button
          variant="default"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
        >
          {isPending ? "Updating..." : "Enable Account"}
        </Button>
      ) : (
        <ConfirmDialog
          trigger={
            <Button variant="destructive" size="sm" disabled={isPending}>
              {isPending ? "Updating..." : "Disable Account"}
            </Button>
          }
          title="Disable User Account"
          description="This will prevent the user from accessing their account. They will not be able to log in until re-enabled."
          confirmText="Disable Account"
          onConfirm={handleToggle}
          disabled={isPending}
        />
      )}
    </div>
  );
}
