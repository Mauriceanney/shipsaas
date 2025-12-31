"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";

import { validateCouponAction } from "@/actions/coupon/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CouponInputProps {
  priceId: string;
  onApply: (promotionCodeId: string, discountInfo: string) => void;
  onRemove: () => void;
}

export function CouponInput({ priceId, onApply, onRemove }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    if (!code.trim()) {
      setError("Please enter a promo code");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await validateCouponAction({ code, priceId });

      if (!result.success) {
        setError(result.error);
        setAppliedDiscount(null);
        return;
      }

      setAppliedDiscount(result.data.discountInfo);
      onApply(result.data.promotionCodeId, result.data.discountInfo);
      setError(null);
    });
  };

  const handleRemove = () => {
    setCode("");
    setError(null);
    setAppliedDiscount(null);
    onRemove();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon-code">Promo Code</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            id="coupon-code"
            type="text"
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApply();
              }
            }}
            disabled={isPending || !!appliedDiscount}
            className={
              error
                ? "border-destructive"
                : appliedDiscount
                  ? "border-green-500"
                  : ""
            }
          />
        </div>
        {appliedDiscount ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            aria-label="Remove promo code"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleApply}
            disabled={isPending || !code.trim()}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating
              </>
            ) : (
              "Apply"
            )}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {appliedDiscount && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>Discount applied: {appliedDiscount}</span>
        </div>
      )}
    </div>
  );
}
