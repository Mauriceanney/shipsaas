"use server";

import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe/client";

/**
 * Input validation schema for getInvoices
 */
const getInvoicesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(12),
});

/**
 * Invoice data returned to client
 */
export type InvoiceData = {
  id: string;
  number: string | null;
  amountPaid: number;
  currency: string;
  status: string | null;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

/**
 * Get user's payment invoices from Stripe
 *
 * @param input - Optional configuration with limit
 * @returns Success with invoice list or error
 */
export async function getInvoices(input?: unknown) {
  const context = { action: "getInvoices", input };

  // 1. Authentication
  const session = await auth();
  if (!session?.user?.id) {
    logger.warn(context, "Unauthorized invoice access attempt");
    return { success: false, error: "Unauthorized" } as const;
  }

  // 2. Validation
  const parsed = getInvoicesSchema.safeParse(input ?? {});
  if (!parsed.success) {
    logger.warn(
      {
        ...context,
        userId: session.user.id,
        errors: parsed.error.errors,
      },
      "Invalid input for getInvoices"
    );
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Invalid input",
    } as const;
  }

  // 3. Get customer ID from subscription
  try {
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true },
    });

    // Return empty list if no subscription or customer ID
    if (!subscription?.stripeCustomerId) {
      logger.info(
        {
          ...context,
          userId: session.user.id,
        },
        "No subscription found for user"
      );
      return { success: true, data: [] } as const;
    }

    // 4. Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: parsed.data.limit,
    });

    // 5. Transform invoice data for client
    const data: InvoiceData[] = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
    }));

    logger.info(
      {
        action: "getInvoices",
        userId: session.user.id,
        count: data.length,
      },
      "Successfully fetched invoices"
    );

    return { success: true, data } as const;
  } catch (error) {
    logger.error(
      {
        ...context,
        userId: session.user.id,
        err: error instanceof Error ? error : new Error(String(error)),
      },
      "Failed to fetch invoices from Stripe"
    );
    return { success: false, error: "Failed to fetch invoices" } as const;
  }
}
