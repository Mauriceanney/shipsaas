"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  requestAccountDeletion,
  cancelAccountDeletion,
  getAccountDeletionStatus,
} from "@/actions/gdpr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DeletionStatus {
  scheduledFor: Date;
  reason: string | null;
  createdAt: Date;
}

export function DeleteAccount() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [deletionStatus, setDeletionStatus] = useState<DeletionStatus | null>(
    null
  );

  const isConfirmed = confirmation === "DELETE";

  useEffect(() => {
    async function checkDeletionStatus() {
      try {
        const result = await getAccountDeletionStatus();
        if (result.success && result.data) {
          setDeletionStatus({
            scheduledFor: new Date(result.data.scheduledFor),
            reason: result.data.reason,
            createdAt: new Date(result.data.createdAt),
          });
        }
      } catch {
        // No deletion scheduled, that's fine
      }
    }

    checkDeletionStatus();
  }, []);

  async function handleDelete() {
    if (!isConfirmed) return;

    setIsLoading(true);

    try {
      const result = await requestAccountDeletion({
        confirmation,
        reason: reason || undefined,
      });

      if (result.success) {
        toast.warning(
          `Your account is scheduled for deletion on ${new Date(
            result.scheduledFor
          ).toLocaleDateString()}. You can cancel this by logging in before that date.`
        );
        setIsOpen(false);
        setConfirmation("");
        setReason("");
        setDeletionStatus({
          scheduledFor: new Date(result.scheduledFor),
          reason: reason || null,
          createdAt: new Date(),
        });
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setIsCanceling(true);

    try {
      const result = await cancelAccountDeletion();

      if (result.success) {
        toast.success("Account deletion has been canceled");
        setDeletionStatus(null);
      } else {
        toast.error(result.error || "Failed to cancel deletion");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsCanceling(false);
    }
  }

  // Show pending deletion status
  if (deletionStatus) {
    const daysRemaining = Math.ceil(
      (deletionStatus.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">
            Account Deletion Scheduled
          </CardTitle>
          <CardDescription>
            Your account is scheduled to be permanently deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-destructive/10 p-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Deletion scheduled for{" "}
                  {deletionStatus.scheduledFor.toLocaleDateString()}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {daysRemaining > 0
                    ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining to cancel`
                    : "Deletion will occur soon"}
                </p>
                {deletionStatus.reason && (
                  <p className="mt-2 text-muted-foreground">
                    Reason: {deletionStatus.reason}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleCancelDeletion}
            disabled={isCanceling}
          >
            {isCanceling ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Canceling...
              </>
            ) : (
              <>
                <XCircle className="size-4" />
                Cancel Deletion
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          has a 30-day grace period during which you can cancel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4 text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Warning</p>
              <p className="mt-1 text-muted-foreground">
                This will permanently delete your account, including:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
                <li>Your profile and account settings</li>
                <li>All connected accounts</li>
                <li>Your subscription (will be cancelled)</li>
                <li>All your data</li>
              </ul>
            </div>
          </div>
        </div>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              Delete My Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone after the 30-day grace period. Your
                account will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for leaving (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by sharing why you're leaving..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReason(e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <span className="font-mono font-bold">DELETE</span> to
                  confirm
                </Label>
                <Input
                  id="confirmation"
                  placeholder="DELETE"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setConfirmation("");
                  setReason("");
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!isConfirmed || isLoading}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
