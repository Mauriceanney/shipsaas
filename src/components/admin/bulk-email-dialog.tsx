"use client";

/**
 * Bulk Email Dialog
 * Compose and send emails to multiple selected users
 */

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { bulkSendEmail } from "@/actions/admin/bulk-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type SelectedUser = {
  id: string;
  email: string;
};

type BulkEmailDialogProps = {
  selectedUsers: SelectedUser[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function BulkEmailDialog({
  selectedUsers,
  isOpen,
  onOpenChange,
  onSuccess,
}: BulkEmailDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const userIds = selectedUsers.map((u) => u.id);

  function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required");
      return;
    }

    startTransition(async () => {
      const result = await bulkSendEmail({
        userIds,
        subject: subject.trim(),
        body: body.trim(),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { successCount, failureCount, errors } = result.data;

      if (failureCount === 0) {
        toast.success(`Email sent to ${successCount} user(s)`);
      } else {
        toast.warning(
          `Sent to ${successCount} user(s), ${failureCount} failed`
        );
        errors.forEach((e) => toast.error(`${e.email}: ${e.reason}`));
      }

      // Reset form
      setSubject("");
      setBody("");
      onOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Bulk Email</DialogTitle>
          <DialogDescription>
            Send an email to {selectedUsers.length} selected user(s).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Recipients ({selectedUsers.length})</Label>
            <ScrollArea className="h-24 rounded-md border p-2">
              <div className="flex flex-wrap gap-1">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs"
                  >
                    {user.email}
                  </span>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-subject">Subject</Label>
            <Input
              id="bulk-subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-body">Message</Label>
            <Textarea
              id="bulk-body"
              placeholder="Write your message here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              maxLength={10000}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {body.length}/10,000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending || !subject || !body}>
            {isPending ? "Sending..." : `Send to ${selectedUsers.length} user(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
