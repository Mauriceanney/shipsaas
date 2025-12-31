"use client";

import { Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { createCouponAction } from "@/actions/admin/coupon";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setCurrency("USD");
    setMaxRedemptions("");
    setExpiresAt("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createCouponAction({
        code,
        description: description || undefined,
        discountType,
        discountValue:
          discountType === "PERCENTAGE"
            ? parseInt(discountValue, 10)
            : parseInt(discountValue, 10) * 100, // Convert dollars to cents
        currency: discountType === "FIXED" ? currency : undefined,
        maxRedemptions: maxRedemptions
          ? parseInt(maxRedemptions, 10)
          : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        notes: notes || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Promo code created successfully");
      resetForm();
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Promo Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Create a new promotional discount code for your customers.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="SUMMER2024"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Summer sale discount"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(v) =>
                    setDiscountType(v as "PERCENTAGE" | "FIXED")
                  }
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="discountValue">
                  {discountType === "PERCENTAGE"
                    ? "Discount (%)"
                    : "Amount (USD)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min="1"
                  max={discountType === "PERCENTAGE" ? "100" : undefined}
                  placeholder={discountType === "PERCENTAGE" ? "20" : "10"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {discountType === "FIXED" && (
              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                <Input
                  id="maxRedemptions"
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiry
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Internal Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Notes for admins..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Promo Code"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
