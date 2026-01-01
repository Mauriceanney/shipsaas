"use client";

/**
 * Export Analytics Button
 * Downloads analytics data as CSV
 */

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ICON_SIZES } from "@/lib/constants/ui";

import type { AnalyticsData } from "@/actions/admin/analytics";

interface ExportAnalyticsButtonProps {
  data: AnalyticsData;
}

function convertToCSV(data: AnalyticsData): string {
  const rows: string[][] = [
    ["Metric", "Value"],
    [""],
    ["Revenue Metrics"],
    ["MRR", `$${data.revenue.mrr.toFixed(2)}`],
    ["ARR", `$${data.revenue.arr.toFixed(2)}`],
    [""],
    ["Revenue by Plan"],
    ["Free", `$${data.revenue.byPlan.FREE.toFixed(2)}`],
    ["Plus", `$${data.revenue.byPlan.PLUS.toFixed(2)}`],
    ["Pro", `$${data.revenue.byPlan.PRO.toFixed(2)}`],
    [""],
    ["Lifetime Value Metrics"],
    ["LTV", `$${data.ltv.value.toFixed(2)}`],
    ["ARPU (Monthly)", `$${data.ltv.arpu.toFixed(2)}`],
    ["Avg Customer Lifetime (Months)", data.ltv.avgLifetimeMonths.toFixed(1)],
    ["Paying Customers", data.ltv.payingCustomers.toString()],
    [""],
    ["MRR Movement (This Month)"],
    ["New MRR", `$${data.mrrMovement.new.toFixed(2)}`],
    ["Expansion MRR", `$${data.mrrMovement.expansion.toFixed(2)}`],
    ["Contraction MRR", `$${data.mrrMovement.contraction.toFixed(2)}`],
    ["Churned MRR", `$${data.mrrMovement.churned.toFixed(2)}`],
    ["Net MRR Movement", `$${data.mrrMovement.net.toFixed(2)}`],
    [""],
    ["Churn Metrics"],
    ["Churn Rate", `${data.churn.rate.toFixed(2)}%`],
    ["Churned Customers", data.churn.count.toString()],
    ["Total at Month Start", data.churn.total.toString()],
    [""],
    ["Subscription Status"],
    ["Active", data.subscriptions.active.toString()],
    ["Trialing", data.subscriptions.trialing.toString()],
    ["Past Due", data.subscriptions.pastDue.toString()],
    ["Canceled", data.subscriptions.canceled.toString()],
    [""],
    ["Signup Trends (Last 12 Months)"],
    ["Month", "Signups"],
    ...data.trends.signups.map((item) => [item.month, item.count.toString()]),
  ];

  return rows.map((row) => row.join(",")).join("\n");
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function ExportAnalyticsButton({ data }: ExportAnalyticsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const csv = convertToCSV(data);
      const date = new Date().toISOString().split("T")[0];
      downloadCSV(csv, `analytics-${date}.csv`);
      toast.success("Analytics exported successfully");
    } catch (error) {
      console.error("[ExportAnalytics]", error);
      toast.error("Failed to export analytics");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={isExporting} variant="outline">
      <Download className={ICON_SIZES.sm + " mr-2"} />
      {isExporting ? "Exporting..." : "Export to CSV"}
    </Button>
  );
}
