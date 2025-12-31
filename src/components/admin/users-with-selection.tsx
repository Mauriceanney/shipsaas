"use client";

/**
 * Users Table with Selection State
 * Client wrapper that manages selection and bulk actions
 */

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { UserTable } from "./user-table";

import type { UserForTable } from "./user-table";
import type { Role } from "@prisma/client";

type UsersWithSelectionProps = {
  users: UserForTable[];
  currentAdminId: string;
};

export function UsersWithSelection({
  users,
  currentAdminId,
}: UsersWithSelectionProps) {
  const router = useRouter();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const selectedUsers = useMemo(() => {
    return users
      .filter((user) => selectedUserIds.has(user.id))
      .map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role as Role,
        disabled: user.disabled,
      }));
  }, [users, selectedUserIds]);

  function handleClearSelection() {
    setSelectedUserIds(new Set());
  }

  function handleOperationComplete() {
    // Refresh the page data
    router.refresh();
  }

  return (
    <>
      <UserTable
        users={users}
        currentAdminId={currentAdminId}
        selectedUserIds={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
      />

      <BulkActionsToolbar
        selectedUsers={selectedUsers}
        onClearSelection={handleClearSelection}
        onOperationComplete={handleOperationComplete}
      />
    </>
  );
}
