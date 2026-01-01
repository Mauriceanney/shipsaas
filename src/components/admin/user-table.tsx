"use client";

import type { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { Users } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { EmptyState } from "@/components/ui/empty-state";
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
  const rowSelection: RowSelectionState = useMemo(() => {
    const selection: RowSelectionState = {};
    users.forEach((user, index) => {
      if (selectedUserIds.has(user.id)) {
        selection[index] = true;
      }
    });
    return selection;
  }, [users, selectedUserIds]);

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
    const newSelection = typeof updaterOrValue === 'function'
      ? updaterOrValue(rowSelection)
      : updaterOrValue;

    const newSelectedIds = new Set<string>();
    Object.keys(newSelection).forEach((indexStr) => {
      const index = parseInt(indexStr, 10);
      if (newSelection[index] && users[index]) {
        newSelectedIds.add(users[index].id);
      }
    });
    onSelectionChange(newSelectedIds);
  };

  const columns: ColumnDef<UserForTable>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          const isCurrentAdmin = user.id === currentAdminId;

          if (isCurrentAdmin) {
            return (
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
            );
          }

          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label={'Select ' + user.email}
            />
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name") || "Unnamed"}</span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Role" />
        ),
        cell: ({ row }) => {
          const role = row.getValue("role") as Role;
          return (
            <Badge variant={role === "ADMIN" ? "default" : "secondary"}>
              {role}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant={user.disabled ? "destructive" : "outline"}>
              {user.disabled ? "Disabled" : "Active"}
            </Badge>
          );
        },
      },
      {
        id: "plan",
        header: "Plan",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <Badge variant="outline">
              {user.subscription?.plan || "Free"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Joined" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              <Link
                href={`/admin/users/${user.id}` as never}
                className="text-sm text-primary hover:underline"
              >
                View
              </Link>
            </div>
          );
        },
      },
    ],
    [currentAdminId]
  );

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
        <DataTable
          columns={columns}
          data={users}
          searchKey="email"
          searchPlaceholder="Search users..."
          rowSelection={rowSelection}
          onRowSelectionChange={handleRowSelectionChange}
          enableRowSelection={(row) => row.original.id !== currentAdminId}
        />
      </div>
    </TooltipProvider>
  );
}
