"use client";

/**
 * Impersonate Button Component
 * Allows admins to start impersonating a user
 */

import { UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { startImpersonation } from "@/actions/admin/impersonation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ImpersonateButtonProps = {
  userId: string;
  userName: string | null;
  userEmail: string;
};

export function ImpersonateButton({
  userId,
  userName,
  userEmail,
}: ImpersonateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  function handleImpersonate() {
    startTransition(async () => {
      const result = await startImpersonation({
        targetUserId: userId,
        reason: reason || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`Now viewing as ${userName || userEmail}`);
      setIsOpen(false);

      // Force a full page navigation to pick up the new session
      window.location.href = result.data.redirectUrl;
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Impersonate User</DialogTitle>
          <DialogDescription>
            You are about to view the application as{" "}
            <strong>{userName || userEmail}</strong>. This session will expire
            in 1 hour.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Customer support request, debugging issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be logged for audit purposes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleImpersonate} disabled={isPending}>
            {isPending ? "Starting..." : "Start Impersonation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
