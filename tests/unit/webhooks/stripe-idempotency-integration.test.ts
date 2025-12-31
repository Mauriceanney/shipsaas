import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { db } from "@/lib/db";

/**
 * Integration tests for webhook idempotency
 *
 * These tests verify that the WebhookEvent model correctly prevents
 * duplicate processing of Stripe webhook events.
 */
describe("Webhook Idempotency Integration", () => {
  // Test event ID
  const testEventId = "evt_test_integration_" + Date.now();

  beforeEach(async () => {
    // Clean up any existing test events
    await db.webhookEvent.deleteMany({
      where: {
        stripeEventId: {
          startsWith: "evt_test_integration_",
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.webhookEvent.deleteMany({
      where: {
        stripeEventId: {
          startsWith: "evt_test_integration_",
        },
      },
    });
  });

  describe("WebhookEvent model", () => {
    it("creates a new webhook event record", async () => {
      const webhookEvent = await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: false,
        },
      });

      expect(webhookEvent).toBeDefined();
      expect(webhookEvent.stripeEventId).toBe(testEventId);
      expect(webhookEvent.eventType).toBe("customer.subscription.created");
      expect(webhookEvent.processed).toBe(false);
      expect(webhookEvent.processedAt).toBeNull();
    });

    it("enforces unique constraint on stripeEventId", async () => {
      // Create first event
      await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
        },
      });

      // Try to create duplicate - should fail
      await expect(
        db.webhookEvent.create({
          data: {
            stripeEventId: testEventId,
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
          },
        })
      ).rejects.toThrow();
    });

    it("allows updating processed status", async () => {
      const webhookEvent = await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: false,
        },
      });

      const updated = await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      expect(updated.processed).toBe(true);
      expect(updated.processedAt).toBeDefined();
      expect(updated.processedAt).toBeInstanceOf(Date);
    });

    it("stores error messages when processing fails", async () => {
      const webhookEvent = await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "invoice.payment_failed",
          apiVersion: "2023-10-16",
        },
      });

      const updated = await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          errorMessage: "Database connection failed",
        },
      });

      expect(updated.errorMessage).toBe("Database connection failed");
      expect(updated.processed).toBe(false);
    });

    it("finds events by stripeEventId", async () => {
      await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "customer.subscription.updated",
          apiVersion: "2023-10-16",
        },
      });

      const found = await db.webhookEvent.findUnique({
        where: { stripeEventId: testEventId },
      });

      expect(found).toBeDefined();
      expect(found?.stripeEventId).toBe(testEventId);
    });

    it("filters events by eventType", async () => {
      const eventId1 = `${testEventId}_1`;
      const eventId2 = `${testEventId}_2`;

      await db.webhookEvent.createMany({
        data: [
          {
            stripeEventId: eventId1,
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
          },
          {
            stripeEventId: eventId2,
            eventType: "invoice.paid",
            apiVersion: "2023-10-16",
          },
        ],
      });

      const subscriptionEvents = await db.webhookEvent.findMany({
        where: {
          eventType: "customer.subscription.created",
        },
      });

      const hasOurEvent = subscriptionEvents.some(
        (e) => e.stripeEventId === eventId1
      );
      expect(hasOurEvent).toBe(true);
    });

    it("filters processed events", async () => {
      const eventId1 = `${testEventId}_processed`;
      const eventId2 = `${testEventId}_unprocessed`;

      await db.webhookEvent.createMany({
        data: [
          {
            stripeEventId: eventId1,
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
            processed: true,
            processedAt: new Date(),
          },
          {
            stripeEventId: eventId2,
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
            processed: false,
          },
        ],
      });

      const unprocessedEvents = await db.webhookEvent.findMany({
        where: {
          processed: false,
        },
      });

      const hasUnprocessed = unprocessedEvents.some(
        (e) => e.stripeEventId === eventId2
      );
      expect(hasUnprocessed).toBe(true);
    });
  });

  describe("idempotency workflow", () => {
    it("simulates complete webhook processing workflow", async () => {
      const eventId = `${testEventId}_workflow`;

      // Step 1: Check if event exists (first request)
      let existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing).toBeNull();

      // Step 2: Create event record with processed=false
      const created = await db.webhookEvent.create({
        data: {
          stripeEventId: eventId,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: false,
        },
      });
      expect(created.processed).toBe(false);

      // Step 3: Process the webhook (simulated)
      // ... webhook processing logic ...

      // Step 4: Mark as processed
      const processed = await db.webhookEvent.update({
        where: { id: created.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });
      expect(processed.processed).toBe(true);

      // Step 5: Second request with same event ID
      existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing?.processed).toBe(true);

      // Should not process again
      if (existing?.processed) {
        console.log("Event already processed, skipping");
      }
    });

    it("simulates retry after failed processing", async () => {
      const eventId = `${testEventId}_retry`;

      // First attempt - create event
      const created = await db.webhookEvent.create({
        data: {
          stripeEventId: eventId,
          eventType: "invoice.payment_failed",
          apiVersion: "2023-10-16",
          processed: false,
        },
      });

      // Processing fails - update with error
      const failed = await db.webhookEvent.update({
        where: { id: created.id },
        data: {
          errorMessage: "Temporary database error",
        },
      });
      expect(failed.processed).toBe(false);
      expect(failed.errorMessage).toBeTruthy();

      // Retry - check if event exists
      const existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing).toBeDefined();
      expect(existing?.processed).toBe(false);

      // Should allow retry since processed=false
      if (!existing?.processed) {
        // Retry processing (simulated)
        const retried = await db.webhookEvent.update({
          where: { id: existing!.id },
          data: {
            processed: true,
            processedAt: new Date(),
            errorMessage: null,
          },
        });
        expect(retried.processed).toBe(true);
        expect(retried.errorMessage).toBeNull();
      }
    });
  });
});
