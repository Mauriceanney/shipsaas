"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe/client";
import { sendRefundConfirmationEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";

const createRefundSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  reason: z
    .string()
    .min(1, "Refund reason is required")
    .max(500, "Reason must be less than 500 characters"),
  amount: z.number().int().positive().optional(),
});

export async function createRefund(input: unknown) {
  try {
    const session = await requireAdmin();

    const parsed = createRefundSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors[0]?.message ?? "Invalid input",
      } as const;
    }

    const { subscriptionId, reason, amount } = parsed.data;

    const subscription = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      return {
        success: false,
        error: "Subscription not found",
      } as const;
    }

    if (!subscription.stripeCustomerId) {
      return {
        success: false,
        error: "No Stripe customer found",
      } as const;
    }

    const paymentIntents = await stripe.paymentIntents.list({
      customer: subscription.stripeCustomerId,
      limit: 10,
    });

    const successfulPayment = paymentIntents.data.find(
      (pi) => pi.status === "succeeded"
    );

    if (!successfulPayment) {
      return {
        success: false,
        error: "No payments found to refund",
      } as const;
    }

    const refund = await stripe.refunds.create({
      payment_intent: successfulPayment.id,
      ...(amount && { amount }),
      reason: "requested_by_customer",
      metadata: {
        adminId: session.user.id,
        adminEmail: session.user.email ?? "unknown",
        reason,
        subscriptionId,
      },
    });

    const refundAmount = refund.amount ?? 0;
    const currency = refund.currency?.toUpperCase() ?? "USD";
    const formattedAmount = currency + " " + (refundAmount / 100).toFixed(2);

    try {
      if (subscription.user.email) {
        await sendRefundConfirmationEmail(subscription.user.email, {
          name: subscription.user.name ?? undefined,
          planName: subscription.plan,
          refundAmount: formattedAmount,
          reason,
        });
      }
    } catch (emailError) {
      console.error("[createRefund] Failed to send email:", emailError);
    }

    try {
      await createAuditLog({
        entityType: "Subscription",
        entityId: subscriptionId,
        action: "REFUND",
        changes: {
          refundId: refund.id,
          amount: refundAmount,
          reason,
        },
        userId: session.user.id,
        userEmail: session.user.email ?? "unknown",
      });
    } catch (auditError) {
      console.error("[createRefund] Failed to create audit log:", auditError);
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/users/" + subscription.userId);

    return {
      success: true,
      data: {
        refundId: refund.id,
        amount: refundAmount,
        currency,
      },
    } as const;
  } catch (error) {
    console.error("[createRefund] Error:", error);
    return {
      success: false,
      error: "Failed to process refund",
    } as const;
  }
}
