import { PostHog } from "posthog-node";
import { analyticsConfig } from "./config";

let posthogClient: PostHog | null = null;

/**
 * Get or create PostHog server client
 * Singleton pattern for server-side tracking
 */
export function getPostHogClient(): PostHog | null {
  if (!analyticsConfig.posthogKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(analyticsConfig.posthogKey, {
      host: analyticsConfig.posthogHost,
      flushAt: 20,
      flushInterval: 10000,
    });
  }

  return posthogClient;
}

/**
 * Track server-side event
 */
export function trackServerEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, unknown>
): void {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId: userId,
    event: eventName,
    ...(properties && { properties }),
  });
}

/**
 * Identify user server-side
 */
export function identifyUserServer(
  userId: string,
  properties: Record<string, unknown>
): void {
  const client = getPostHogClient();
  if (!client) return;

  client.identify({
    distinctId: userId,
    properties,
  });
}

/**
 * Graceful shutdown - flush pending events
 */
export async function shutdownAnalytics(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
}
