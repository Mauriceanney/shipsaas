import { auth } from "@/lib/auth";

/**
 * Next.js Middleware for route protection
 *
 * Authentication is handled by Auth.js `authorized` callback in config.ts
 * This wrapper ensures the auth check runs on every request matching the config.
 *
 * Protected routes (require authentication):
 * - /dashboard/**
 * - /settings/**
 * - /admin/**
 * - /checkout/**
 *
 * Public routes (no auth required):
 * - / (home)
 * - /pricing
 * - /blog/**
 * - /login, /signup, /forgot-password, /reset-password, /verify-email
 *
 * API routes handle their own authentication.
 */
export default auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
