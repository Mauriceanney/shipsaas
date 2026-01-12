/**
 * Next.js Instrumentation
 * Runs once when the Next.js server starts
 * Used to initialize server-side observability (Sentry)
 */

export async function register() {
  // Only run on server
  if (typeof window !== "undefined") {
    return;
  }

  // Initialize Sentry for server-side error tracking
  if (process.env["NEXT_PUBLIC_SENTRY_DSN"]) {
    const { initServerSentry } = await import("./lib/sentry/server-init");
    initServerSentry();
  }
}
