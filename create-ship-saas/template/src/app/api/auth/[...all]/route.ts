import { NextRequest, NextResponse } from "next/server"
import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"
import { rateLimiters, getClientIp, rateLimitHeaders } from "@/lib/rate-limit"

const { GET: betterAuthGET, POST: betterAuthPOST } = toNextJsHandler(auth)

export const GET = betterAuthGET

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const pathname = request.nextUrl.pathname

  // Rate limit password reset: 3 requests per 15 minutes
  if (pathname.includes("forgot-password") || pathname.includes("forget-password")) {
    const rateLimitResult = await rateLimiters.passwordReset(clientIp)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }
  }

  // Rate limit sign-in: 5 requests per minute
  if (pathname.includes("sign-in")) {
    const rateLimitResult = await rateLimiters.auth(clientIp)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) }
      )
    }
  }

  // Pass through to Better Auth
  return betterAuthPOST(request)
}
