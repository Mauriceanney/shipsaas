"use client";

/**
 * Bulk Actions Toolbar
 * Shows when users are selected in the admin user table
 */

import { Ban, CheckCircle, Mail, Shield, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  bulkChangeUserRole,
  bulkDisableUsers,
  bulkEnableUsers,
} from "@/actions/admin/bulk-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { BulkEmailDialog } from "./bulk-email-dialog";

import type { Role } from "@prisma/client";

type SelectedUser = {
  id: string;
  email: string;
  role: Role;
  disabled: boolean;
};

type BulkActionsToolbarProps = {
  selectedUsers: SelectedUser[];
  onClearSelection: () => void;
  onOperationComplete: () => void;
};

type ConfirmDialogState = {
  isOpen: boolean;
  action: "disable" | "enable" | "role" | null;
  targetRole?: Role;
};

export function BulkActionsToolbar({
  selectedUsers,
  onClearSelection,
  onOperationComplete,
}: BulkActionsToolbarProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    action: null,
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const userIds = selectedUsers.map((u) => u.id);
  const enabledUsers = selectedUsers.filter((u) => !u.disabled);
  const disabledUsers = selectedUsers.filter((u) => u.disabled);

  function handleDisable() {
    setConfirmDialog({ isOpen: true, action: "disable" });
  }

  function handleEnable() {
    setConfirmDialog({ isOpen: true, action: "enable" });
  }

  function handleRoleChange(role: Role) {
    setConfirmDialog({ isOpen: true, action: "role", targetRole: role });
  }

  function handleConfirm() {
    startTransition(async () => {
      let result;

      switch (confirmDialog.action) {
        case "disable":
          result = await bulkDisableUsers({ userIds });
          break;
        case "enable":
          result = await bulkEnableUsers({ userIds });
          break;
        case "role":
          result = await bulkChangeUserRole({
            userIds,
            role: confirmDialog.targetRole!,
          });
          break;
        default:
          return;
      }

      if (!result.success) {
        toast.error(result.error);
      } else {
        const { successCount, failureCount, errors } = result.data;
        if (failureCount === 0) {
          toast.success(`Successfully updated ${successCount} user(s)`);
        } else {
          toast.warning(
            `Updated ${successCount} user(s), ${failureCount} failed`
          );
          errors.forEach((e) => toast.error(`${e.email}: ${e.reason}`));
        }
        onOperationComplete();
        onClearSelection();
      }

      setConfirmDialog({ isOpen: false, action: null });
    });
  }

  function getConfirmMessage() {
    switch (confirmDialog.action) {
      case "disable":
        return `Are you sure you want to disable ${enabledUsers.length} user(s)? They will no longer be able to sign in.`;
      case "enable":
        return `Are you sure you want to enable ${disabledUsers.length} user(s)? They will be able to sign in again.`;
      case "role":
        return `Are you sure you want to change the role of ${selectedUsers.length} user(s) to ${confirmDialog.targetRole}?`;
      default:
        return "";
    }
  }

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedUsers.length} user(s) selected
        </span>

        <div className="flex items-center gap-2">
          {enabledUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={isPending}
            >
              <Ban className="mr-2 h-4 w-4" aria-hidden="true" />
              Disable ({enabledUsers.length})
            </Button>
          )}

          {disabledUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnable}
              disabled={isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Enable ({disabledUsers.length})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                <Shield className="mr-2 h-4 w-4" aria-hidden="true" />
                Change Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleRoleChange("USER")}>
                Set to User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRoleChange("ADMIN")}>
                Set to Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEmailDialogOpen(true)}
            disabled={isPending}
          >
            <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
            Send Email
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isPending}
          >
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, action: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>{getConfirmMessage()}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Email Dialog */}
      <BulkEmailDialog
        selectedUsers={selectedUsers}
        isOpen={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSuccess={() => {
          onOperationComplete();
          onClearSelection();
        }}
      />
    </>
  );
}
