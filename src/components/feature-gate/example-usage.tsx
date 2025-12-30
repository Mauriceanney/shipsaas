/**
 * Example usage of FeatureGate component
 * This file is for documentation purposes only
 */

import { FeatureGate } from "./feature-gate";

// Example 1: Basic gating for a feature section
export function AnalyticsExample() {
  return (
    <div className="space-y-6">
      <h1>Analytics Dashboard</h1>

      {/* Always visible - free tier */}
      <BasicStatsCard />

      {/* PRO tier feature */}
      <FeatureGate plan="PRO">
        <AdvancedAnalyticsCard />
      </FeatureGate>

      {/* ENTERPRISE tier feature */}
      <FeatureGate plan="ENTERPRISE">
        <CustomReportsCard />
      </FeatureGate>
    </div>
  );
}

// Example 2: Custom fallback message
export function ExportExample() {
  return (
    <FeatureGate
      plan="PRO"
      fallback={
        <div className="rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Export to CSV is available on the Pro plan.
          </p>
        </div>
      }
    >
      <ExportButton />
    </FeatureGate>
  );
}

// Example 3: Inline button gating
export function ButtonExample() {
  return (
    <div className="flex gap-2">
      <button>Basic Action</button>

      <FeatureGate
        plan="PRO"
        fallback={
          <button disabled className="opacity-50">
            Premium Action (Pro)
          </button>
        }
      >
        <button>Premium Action</button>
      </FeatureGate>
    </div>
  );
}

// Placeholder components for examples
function BasicStatsCard() {
  return <div>Basic Stats</div>;
}

function AdvancedAnalyticsCard() {
  return <div>Advanced Analytics</div>;
}

function CustomReportsCard() {
  return <div>Custom Reports</div>;
}

function ExportButton() {
  return <button>Export to CSV</button>;
}
