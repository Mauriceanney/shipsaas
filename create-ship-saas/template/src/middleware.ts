/**
 * Next.js middleware for request correlation and logging
 * Adds request ID header to all requests for tracing
 */

import { NextResponse, type NextRequest } from "next/server";
import { generateRequestId } from "@/lib/request-context";

/**
 * Request ID header name
 * Standard header for distributed tracing
 */
const REQUEST_ID_HEADER = "x-request-id";

export function middleware(request: NextRequest) {
  // Use existing request ID from header (forwarded from load balancer) or generate new one
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();

  // Clone the request headers and add request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  // Create response with request ID header
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response headers for debugging
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}

/**
 * Configure which paths the middleware runs on
 * Exclude static files and internal Next.js paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
