"use client";

import { useState, useTransition } from "react";

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
      await updateUserRole(userId, newRole);
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
