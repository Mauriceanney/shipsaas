"use client";

import { DollarSign } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createRefund } from "@/actions/admin/refund";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface RefundDialogProps {
  subscriptionId: string;
  customerEmail: string;
  children: React.ReactNode;
}

export function RefundDialog({
  subscriptionId,
  customerEmail,
  children,
}: RefundDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [isFullRefund, setIsFullRefund] = useState(true);
  const [partialAmount, setPartialAmount] = useState("");

  function resetForm() {
    setReason("");
    setIsFullRefund(true);
    setPartialAmount("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    startTransition(async () => {
      const input: {
        subscriptionId: string;
        reason: string;
        amount?: number;
      } = {
        subscriptionId,
        reason: reason.trim(),
      };

      // Add partial refund amount if not full refund
      if (!isFullRefund && partialAmount) {
        const amount = parseFloat(partialAmount);
        if (isNaN(amount) || amount <= 0) {
          toast.error("Please enter a valid refund amount");
          return;
        }
        // Convert dollars to cents
        input.amount = Math.round(amount * 100);
      }

      const result = await createRefund(input);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const formattedAmount = `${result.data.currency} ${(result.data.amount / 100).toFixed(2)}`;
      toast.success(`Refund processed: ${formattedAmount}`);
      resetForm();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Issue a refund for {customerEmail}. The customer will receive a
            confirmation email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reason">Reason</Label>
                <span className="text-xs text-muted-foreground">
                  {reason.length}/500
                </span>
              </div>
              <Textarea
                id="reason"
                placeholder="e.g., Customer requested refund due to service issues..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                required
                disabled={isPending}
                className="resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullRefund"
                checked={isFullRefund}
                onCheckedChange={(checked) => setIsFullRefund(checked === true)}
                disabled={isPending}
              />
              <Label
                htmlFor="fullRefund"
                className="text-sm font-normal cursor-pointer"
              >
                Full refund (refund entire payment)
              </Label>
            </div>

            {!isFullRefund && (
              <div className="grid gap-2">
                <Label htmlFor="amount">Partial Refund Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    disabled={isPending}
                    className="pl-9"
                    required={!isFullRefund}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the amount to refund. Must be less than or equal to the
                  original payment amount.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !reason.trim()}
            >
              {isPending ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
