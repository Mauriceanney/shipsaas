"use client";

import { Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Role } from "@prisma/client";

export type UserForTable = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  disabled: boolean;
  createdAt: Date;
  subscription: {
    plan: "FREE" | "PLUS" | "PRO";
    status: string;
  } | null;
};

interface UserTableProps {
  users: UserForTable[];
  currentAdminId: string;
  selectedUserIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

export function UserTable({
  users,
  currentAdminId,
  selectedUserIds,
  onSelectionChange,
}: UserTableProps) {
  // Filter out users that cannot be selected (current admin)
  const selectableUsers = users.filter((user) => user.id !== currentAdminId);

  const allSelectableSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedUserIds.has(user.id));

  const someSelected =
    selectableUsers.some((user) => selectedUserIds.has(user.id)) &&
    !allSelectableSelected;

  function handleSelectAll(checked: boolean) {
    if (checked) {
      const newSelection = new Set(selectedUserIds);
      selectableUsers.forEach((user) => newSelection.add(user.id));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedUserIds);
      selectableUsers.forEach((user) => newSelection.delete(user.id));
      onSelectionChange(newSelection);
    }
  }

  function handleSelectUser(userId: string, checked: boolean) {
    const newSelection = new Set(selectedUserIds);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    onSelectionChange(newSelection);
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No users found"
        description="No users match your current filters. Try adjusting your search criteria."
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelectableSelected}
                  ref={(el) => {
                    if (el) {
                      (el as unknown as { indeterminate: boolean }).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all users"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentAdmin = user.id === currentAdminId;
              const isSelected = selectedUserIds.has(user.id);

              return (
                <TableRow
                  key={user.id}
                  className={isSelected ? "bg-muted/50" : undefined}
                >
                  <TableCell>
                    {isCurrentAdmin ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Checkbox disabled aria-label="Cannot select yourself" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cannot select yourself</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSelectUser(user.id, checked as boolean)
                        }
                        aria-label={`Select ${user.email}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.name || "Unnamed"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.disabled ? "destructive" : "outline"}>
                      {user.disabled ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.subscription?.plan || "Free"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
