"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { requestAccountDeletion } from "@/actions/gdpr";
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

export function AccountDeletionCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState("");

  const isConfirmed = confirmation === "DELETE";

  async function handleDelete() {
    if (!isConfirmed) return;

    setIsLoading(true);

    try {
      const result = await requestAccountDeletion({
        confirmation,
        reason: reason || undefined,
      });

      if (result.success && result.scheduledFor) {
        toast.warning(
          `Your account is scheduled for deletion on ${new Date(
            result.scheduledFor
          ).toLocaleDateString()}. You can cancel this by logging in before that date.`
        );
        setIsOpen(false);
        setConfirmation("");
        setReason("");
      } else {
        toast.error(result.error || "Failed to request account deletion");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
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
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Warning</p>
              <p className="text-muted-foreground mt-1">
                This will permanently delete your account, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
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
              <Trash2 className="mr-2 h-4 w-4" />
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
                <Label htmlFor="reason">
                  Reason for leaving (optional)
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by sharing why you're leaving..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
