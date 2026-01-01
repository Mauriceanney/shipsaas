"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
/**
 * Check and send welcome email for OAuth users on first dashboard visit
 * This runs in Node.js runtime (not Edge), so nodemailer works
 */
export async function checkAndSendWelcomeEmail(): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return;
    }

    // Check if user needs welcome email
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        welcomeEmailSent: true,
      },
    });

    if (!user || user.welcomeEmailSent || !user.email) {
      return;
    }

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name ?? "there");

    // Mark as sent
    await db.user.update({
      where: { id: user.id },
      data: { welcomeEmailSent: true },
    });

    logger.info(
      { userId: user?.id || session?.user?.id },
      "Welcome email sent to OAuth user: user.email"
    );
  } catch (error) {
    logger.error(
      { err: error, userId: session?.user?.id },
      "Failed to send welcome email"
    );
    // Don't throw - this is a non-critical operation
  }
}
