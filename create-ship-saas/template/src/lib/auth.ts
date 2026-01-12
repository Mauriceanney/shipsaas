import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "./db"
import {
  sendEmail,
  renderVerifyEmail,
  renderPasswordResetEmail,
  getEmailConfig,
  EMAIL_CONSTANTS,
} from "./email"
import { user } from "./schema"

/**
 * Check if a user has 2FA enabled
 */
export async function checkUserHas2FA(userId: string): Promise<boolean> {
  const [userData] = await db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return userData?.twoFactorEnabled ?? false
}

/**
 * Get user 2FA status by email
 */
export async function getUserByEmail(email: string) {
  const [userData] = await db
    .select({
      id: user.id,
      email: user.email,
      twoFactorEnabled: user.twoFactorEnabled,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  return userData
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user: authUser, url }) => {
      try {
        const config = getEmailConfig()
        const { html, text } = await renderPasswordResetEmail({
          ...(authUser.name ? { name: authUser.name } : {}),
          resetUrl: url,
          expiresIn: EMAIL_CONSTANTS.PASSWORD_RESET_EXPIRY,
          appName: config.appName,
          appUrl: config.appUrl,
        })

        const result = await sendEmail({
          to: authUser.email,
          subject: `Reset your password for ${config.appName}`,
          html,
          text,
        })

        if (!result.success) {
          console.error("[sendResetPassword] Failed to send email:", result.error)
        }
      } catch (error) {
        console.error("[sendResetPassword] Error sending password reset email:", error)
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user: authUser, url }) => {
      try {
        const config = getEmailConfig()
        const { html, text } = await renderVerifyEmail({
          ...(authUser.name ? { name: authUser.name } : {}),
          verificationUrl: url,
          expiresIn: EMAIL_CONSTANTS.VERIFICATION_EXPIRY,
          appName: config.appName,
          appUrl: config.appUrl,
        })

        const result = await sendEmail({
          to: authUser.email,
          subject: `Verify your email for ${config.appName}`,
          html,
          text,
        })

        if (!result.success) {
          console.error("[sendVerificationEmail] Failed to send email:", result.error)
        }
      } catch (error) {
        console.error("[sendVerificationEmail] Error sending verification email:", error)
      }
    },
  },
})