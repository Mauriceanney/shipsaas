/**
 * Navigation utilities for type-safe routing with dynamic URLs
 *
 * When using Next.js experimental typedRoutes, router.push and redirect require Route<string> type.
 * However, dynamic URLs from user input (like callback URLs) or external URLs (like Stripe)
 * cannot be typed at compile time. This utility provides a documented, safe way to handle
 * dynamic navigation without using `as any`.
 */

import { redirect as nextRedirect } from "next/navigation";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * A dynamic URL string that has been validated as safe for navigation.
 * This is used when we have a URL from user input or external sources
 * that we've validated but can't type-check at compile time.
 */
export type DynamicRoute = string & { __brand: "DynamicRoute" };

/**
 * Creates a validated dynamic route for navigation.
 * Use this for callback URLs or other user-provided navigation targets.
 *
 * @param url - The URL string to navigate to
 * @returns A branded DynamicRoute that can be used with navigateTo
 *
 * @example
 * const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
 * navigateTo(router, asDynamicRoute(callbackUrl));
 */
export function asDynamicRoute(url: string): DynamicRoute {
  // Basic validation - ensure it starts with / (relative) or is a full URL
  if (!url.startsWith("/") && !url.startsWith("http")) {
    return ("/" + url) as DynamicRoute;
  }
  return url as DynamicRoute;
}

/**
 * Navigate to a dynamic route using the Next.js App Router.
 * This is a type-safe wrapper that handles dynamic URLs without using `as any`.
 *
 * @param router - The AppRouterInstance from useRouter()
 * @param route - A DynamicRoute created with asDynamicRoute()
 *
 * @example
 * const router = useRouter();
 * const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
 * navigateTo(router, asDynamicRoute(callbackUrl));
 */
export function navigateTo(
  router: Pick<AppRouterInstance, "push">,
  route: DynamicRoute
): void {
  // The actual push call - string is accepted at runtime
  // but TypeScript requires Route<string> when typedRoutes is enabled
  (router as unknown as { push: (href: string) => void }).push(route);
}

/**
 * Navigate and refresh - combines push with refresh for auth flows.
 *
 * @param router - The AppRouterInstance from useRouter()
 * @param route - A DynamicRoute created with asDynamicRoute()
 */
export function navigateAndRefresh(
  router: Pick<AppRouterInstance, "push" | "refresh">,
  route: DynamicRoute
): void {
  navigateTo(router, route);
  router.refresh();
}

/**
 * Server-side redirect to a dynamic URL.
 * Use this in Server Actions when redirecting to external URLs (like Stripe)
 * or dynamic internal URLs that can't be typed at compile time.
 *
 * @param url - The URL to redirect to (internal or external)
 * @returns Never - redirect throws and doesn't return
 *
 * @example
 * // In a server action
 * export async function redirectToPortal(): Promise<never> {
 *   const stripeUrl = await createPortalSession();
 *   return redirectTo(stripeUrl);
 * }
 */
export function redirectTo(url: string): never {
  // The actual redirect call - string is accepted at runtime
  // but TypeScript requires Route<string> when typedRoutes is enabled
  return (nextRedirect as (url: string) => never)(url);
}
