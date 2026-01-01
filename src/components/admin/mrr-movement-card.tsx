"use client";

/**
 * MRR Movement Card Component
 * Displays breakdown of Monthly Recurring Revenue changes
 */

import { TrendingUp, TrendingDown, Plus, Minus, Activity } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ICON_SIZES } from "@/lib/constants/ui";

interface MrrMovementCardProps {
  newMrr: number;
  expansion: number;
  contraction: number;
  churned: number;
  net: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMovement(amount: number, isPositive: boolean): string {
  const sign = isPositive ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

export function MrrMovementCard({
  newMrr,
  expansion,
  contraction,
  churned,
  net,
}: MrrMovementCardProps) {
  const isNetPositive = net >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">MRR Movement</CardTitle>
        <Activity className={ICON_SIZES.sm + " text-muted-foreground"} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Net Movement - Primary Metric */}
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm font-medium">Net Movement</span>
            <div className="flex items-center gap-1">
              {isNetPositive ? (
                <TrendingUp className={ICON_SIZES.sm + " text-green-600"} />
              ) : (
                <TrendingDown className={ICON_SIZES.sm + " text-red-600"} />
              )}
              <span
                className={`text-lg font-bold ${
                  isNetPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatMovement(net, isNetPositive)}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            {/* New MRR */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className={ICON_SIZES.sm + " text-green-600"} />
                <span className="text-muted-foreground">New</span>
              </div>
              <span className="font-medium text-green-600">
                {formatMovement(newMrr, true)}
              </span>
            </div>

            {/* Expansion MRR */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className={ICON_SIZES.sm + " text-green-600"} />
                <span className="text-muted-foreground">Expansion</span>
              </div>
              <span className="font-medium text-green-600">
                {formatMovement(expansion, true)}
              </span>
            </div>

            {/* Contraction MRR */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className={ICON_SIZES.sm + " text-orange-600"} />
                <span className="text-muted-foreground">Contraction</span>
              </div>
              <span className="font-medium text-orange-600">
                {formatMovement(contraction, false)}
              </span>
            </div>

            {/* Churned MRR */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className={ICON_SIZES.sm + " text-red-600"} />
                <span className="text-muted-foreground">Churned</span>
              </div>
              <span className="font-medium text-red-600">
                {formatMovement(churned, false)}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          {expansion === 0 && contraction === 0 && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Expansion/Contraction tracking requires subscription history
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
