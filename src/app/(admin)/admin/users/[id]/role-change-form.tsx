"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateUserRole } from "@/actions/admin/users";
import { Button } from "@/components/ui/button";

interface RoleChangeFormProps {
  userId: string;
  currentRole: "USER" | "ADMIN";
}

export function RoleChangeForm({ userId, currentRole }: RoleChangeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);

  const handleRoleChange = (newRole: "USER" | "ADMIN") => {
    setRole(newRole);
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success(`User role updated to ${newRole}`);
      } catch {
        toast.error("Failed to update user role");
        setRole(currentRole); // Revert on error
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Change the user&apos;s role to grant or revoke admin privileges.
      </p>
      <div className="flex gap-2">
        <Button
          variant={role === "USER" ? "default" : "outline"}
          size="sm"
          onClick={() => handleRoleChange("USER")}
          disabled={isPending || role === "USER"}
        >
          User
        </Button>
        <Button
          variant={role === "ADMIN" ? "default" : "outline"}
          size="sm"
          onClick={() => handleRoleChange("ADMIN")}
          disabled={isPending || role === "ADMIN"}
        >
          Admin
        </Button>
      </div>
      {isPending && (
        <p className="text-sm text-muted-foreground">Updating role...</p>
      )}
    </div>
  );
}
