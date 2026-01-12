import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  requestPasswordReset,
  resetPassword,
  sendVerificationEmail,
} = authClient

/**
 * Custom sign-in that handles 2FA flow
 * Returns a special response if 2FA is required
 */
export async function signInWithCredentials(
  email: string,
  password: string,
  options?: { rememberMe?: boolean }
): Promise<
  | { success: true; requires2FA: false }
  | { success: true; requires2FA: true; redirectTo: string }
  | { success: false; error: string }
> {
  try {
    // First, check if user has 2FA enabled
    const check2FAResponse = await fetch("/api/auth/check-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const check2FAData = await check2FAResponse.json()

    if (check2FAData.has2FA) {
      // Verify password first, then redirect to 2FA
      const verifyResponse = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyData.success) {
        return { success: false, error: verifyData.error || "Invalid credentials" }
      }

      return {
        success: true,
        requires2FA: true,
        redirectTo: "/login/verify-2fa",
      }
    }

    // No 2FA, proceed with normal sign-in
    const result = await signIn.email({
      email,
      password,
      rememberMe: options?.rememberMe,
    })

    if (result.error) {
      return { success: false, error: result.error.message || "Sign in failed" }
    }

    return { success: true, requires2FA: false }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}