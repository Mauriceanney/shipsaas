/**
 * Pricing Page
 *
 * Displays available plans and pricing.
 */

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ALL_PLANS } from "@/lib/stripe/config";
import { PricingCard } from "./pricing-card";

export const metadata = {
  title: "Pricing",
  description: "Choose the perfect plan for your needs",
};

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Choose the plan that works best for you. All plans include a 14-day
          free trial.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
        {ALL_PLANS.map((plan) => (
          <PricingCard
            key={plan.plan}
            plan={plan}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-3xl text-center">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-6 text-left">
          <div>
            <h3 className="font-semibold">Can I switch plans later?</h3>
            <p className="mt-1 text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              take effect immediately, and we will prorate your billing.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">What payment methods do you accept?</h3>
            <p className="mt-1 text-muted-foreground">
              We accept all major credit cards including Visa, Mastercard,
              American Express, and Discover.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Is there a free trial?</h3>
            <p className="mt-1 text-muted-foreground">
              Yes, all paid plans include a 14-day free trial. No credit card
              required to start.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Can I cancel anytime?</h3>
            <p className="mt-1 text-muted-foreground">
              Absolutely. You can cancel your subscription at any time, and you
              will continue to have access until the end of your billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
