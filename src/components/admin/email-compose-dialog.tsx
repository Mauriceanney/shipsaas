"use client";

import { Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { sendEmailToUser } from "@/actions/admin/send-email";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EmailComposeDialogProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function EmailComposeDialog({
  userId,
  userName,
  userEmail,
}: EmailComposeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const displayName = userName || userEmail;

  function resetForm() {
    setSubject("");
    setBody("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await sendEmailToUser({
        userId,
        subject: subject.trim(),
        body,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Email sent successfully");
      resetForm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="mr-2 h-4 w-4" />
          Email User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Email to {displayName}</DialogTitle>
          <DialogDescription>
            Compose and send an email to this user. The email will be sent from
            your app&apos;s configured email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Subject</Label>
                <span className="text-xs text-muted-foreground">
                  {subject.length}/200
                </span>
              </div>
              <Input
                id="subject"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                disabled={isPending}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body">Message</Label>
                <span className="text-xs text-muted-foreground">
                  {body.length}/10000
                </span>
              </div>
              <Textarea
                id="body"
                placeholder="Enter your message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                maxLength={10000}
                required
                disabled={isPending}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !subject.trim() || !body.trim()}>
              {isPending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
