"use client";

import { useState, useTransition } from "react";

import { updatePlanConfig } from "@/actions/admin/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { PlanConfig } from "@prisma/client";

interface PlanConfigFormProps {
  configs: PlanConfig[];
}

interface FormData {
  name: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string;
}

const defaultPlans = [
  { plan: "FREE" as const, name: "Free", monthlyPrice: 0, yearlyPrice: 0 },
  { plan: "PRO" as const, name: "Pro", monthlyPrice: 2900, yearlyPrice: 29000 },
  {
    plan: "ENTERPRISE" as const,
    name: "Enterprise",
    monthlyPrice: 9900,
    yearlyPrice: 99000,
  },
];

const emptyFormData: FormData = {
  name: "",
  monthlyPriceId: "",
  yearlyPriceId: "",
  monthlyPrice: "0",
  yearlyPrice: "0",
  features: "",
};

export function PlanConfigForm({ configs }: PlanConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);

  // Merge configs with defaults
  const configMap = configs.reduce(
    (acc, config) => {
      acc[config.plan] = config;
      return acc;
    },
    {} as Record<string, PlanConfig>
  );

  const handleEdit = (plan: string) => {
    const config = configMap[plan];
    setFormData({
      name: config?.name || plan,
      monthlyPriceId: config?.monthlyPriceId || "",
      yearlyPriceId: config?.yearlyPriceId || "",
      monthlyPrice: String((config?.monthlyPrice || 0) / 100),
      yearlyPrice: String((config?.yearlyPrice || 0) / 100),
      features: config?.features?.join("\n") || "",
    });
    setEditingPlan(plan);
  };

  const handleSave = () => {
    if (!editingPlan) return;

    startTransition(async () => {
      await updatePlanConfig(editingPlan as "FREE" | "PRO" | "ENTERPRISE", {
        name: formData.name,
        monthlyPriceId: formData.monthlyPriceId || undefined,
        yearlyPriceId: formData.yearlyPriceId || undefined,
        monthlyPrice: Math.round(parseFloat(formData.monthlyPrice || "0") * 100),
        yearlyPrice: Math.round(parseFloat(formData.yearlyPrice || "0") * 100),
        features: formData.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      });
      setEditingPlan(null);
    });
  };

  const handleToggle = (plan: string) => {
    const config = configMap[plan];
    startTransition(async () => {
      await updatePlanConfig(plan as "FREE" | "PRO" | "ENTERPRISE", {
        isActive: !config?.isActive,
      });
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure plan details and map Stripe Price IDs. Prices should be
        created in the Stripe Dashboard first.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Monthly Price ID</TableHead>
            <TableHead>Yearly Price ID</TableHead>
            <TableHead>Display Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {defaultPlans.map(({ plan }) => {
            const config = configMap[plan];
            const isEditing = editingPlan === plan;

            return (
              <TableRow key={plan}>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-32"
                    />
                  ) : (
                    config?.name || plan
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={formData.monthlyPriceId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyPriceId: e.target.value,
                        })
                      }
                      placeholder="price_..."
                      className="w-40"
                    />
                  ) : (
                    <code className="text-xs">
                      {config?.monthlyPriceId || "-"}
                    </code>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={formData.yearlyPriceId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearlyPriceId: e.target.value,
                        })
                      }
                      placeholder="price_..."
                      className="w-40"
                    />
                  ) : (
                    <code className="text-xs">
                      {config?.yearlyPriceId || "-"}
                    </code>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <span>$</span>
                      <Input
                        value={formData.monthlyPrice}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthlyPrice: e.target.value,
                          })
                        }
                        className="w-20"
                      />
                      <span>/mo</span>
                    </div>
                  ) : (
                    `$${((config?.monthlyPrice || 0) / 100).toFixed(0)}/mo`
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant={config?.isActive !== false ? "outline" : "secondary"}
                    size="sm"
                    onClick={() => handleToggle(plan)}
                    disabled={isPending}
                  >
                    {config?.isActive !== false ? "Active" : "Disabled"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPlan(null)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isPending}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
