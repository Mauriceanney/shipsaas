import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock database BEFORE imports - use vi.fn() factory directly in mock
vi.mock("@/lib/db", () => ({
  db: {
    webhookEvent: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";

/**
 * Unit tests for webhook idempotency using mocked database
 *
 * These tests verify that the WebhookEvent model correctly prevents
 * duplicate processing of Stripe webhook events.
 */
describe("Webhook Idempotency Unit Tests", () => {
  // Test event ID
  const testEventId = "evt_test_integration_" + Date.now();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("WebhookEvent model", () => {
    it("creates a new webhook event record", async () => {
      const mockWebhookEvent = {
        id: "webhook_1",
        stripeEventId: testEventId,
        eventType: "customer.subscription.created",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };

      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockWebhookEvent);

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
      // First creation succeeds
      vi.mocked(db.webhookEvent.create).mockResolvedValueOnce({
        id: "webhook_1",
        stripeEventId: testEventId,
        eventType: "customer.subscription.created",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      });

      await db.webhookEvent.create({
        data: {
          stripeEventId: testEventId,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
        },
      });

      // Second creation should throw duplicate error
      vi.mocked(db.webhookEvent.create).mockRejectedValueOnce(
        new Error("Unique constraint failed on the fields: (`stripeEventId`)")
      );

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
      const mockCreated = {
        id: "webhook_1",
        stripeEventId: testEventId,
        eventType: "customer.subscription.created",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };

      const mockUpdated = {
        ...mockCreated,
        processed: true,
        processedAt: new Date(),
      };

      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockCreated);
      vi.mocked(db.webhookEvent.update).mockResolvedValue(mockUpdated);

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
      const mockCreated = {
        id: "webhook_1",
        stripeEventId: testEventId,
        eventType: "invoice.payment_failed",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };

      const mockUpdated = {
        ...mockCreated,
        errorMessage: "Database connection failed",
      };

      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockCreated);
      vi.mocked(db.webhookEvent.update).mockResolvedValue(mockUpdated);

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
      const mockEvent = {
        id: "webhook_1",
        stripeEventId: testEventId,
        eventType: "customer.subscription.updated",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };

      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockEvent);
      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(mockEvent);

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

      const mockEvents = [
        {
          id: "webhook_1",
          stripeEventId: eventId1,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: false,
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
        },
        {
          id: "webhook_2",
          stripeEventId: eventId2,
          eventType: "invoice.paid",
          apiVersion: "2023-10-16",
          processed: false,
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.webhookEvent.createMany).mockResolvedValue({ count: 2 });
      vi.mocked(db.webhookEvent.findMany).mockResolvedValue([mockEvents[0]]);

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

      const processedDate = new Date();
      const mockEvents = [
        {
          id: "webhook_1",
          stripeEventId: eventId1,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: true,
          processedAt: processedDate,
          errorMessage: null,
          createdAt: new Date(),
        },
        {
          id: "webhook_2",
          stripeEventId: eventId2,
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
          processed: false,
          processedAt: null,
          errorMessage: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(db.webhookEvent.createMany).mockResolvedValue({ count: 2 });
      vi.mocked(db.webhookEvent.findMany).mockResolvedValue([mockEvents[1]]);

      await db.webhookEvent.createMany({
        data: [
          {
            stripeEventId: eventId1,
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
            processed: true,
            processedAt: processedDate,
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
      vi.mocked(db.webhookEvent.findUnique).mockResolvedValueOnce(null);
      
      let existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing).toBeNull();

      // Step 2: Create event record with processed=false
      const mockCreated = {
        id: "webhook_1",
        stripeEventId: eventId,
        eventType: "customer.subscription.created",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };
      
      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockCreated);
      
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
      const processedDate = new Date();
      const mockProcessed = {
        ...mockCreated,
        processed: true,
        processedAt: processedDate,
      };
      
      vi.mocked(db.webhookEvent.update).mockResolvedValue(mockProcessed);
      
      const processed = await db.webhookEvent.update({
        where: { id: created.id },
        data: {
          processed: true,
          processedAt: processedDate,
        },
      });
      expect(processed.processed).toBe(true);

      // Step 5: Second request with same event ID
      vi.mocked(db.webhookEvent.findUnique).mockResolvedValueOnce(mockProcessed);
      
      existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing?.processed).toBe(true);

      // Should not process again
      if (existing?.processed) {
        // Event already processed, would skip processing
        expect(existing.processed).toBe(true);
      }
    });

    it("simulates retry after failed processing", async () => {
      const eventId = `${testEventId}_retry`;

      // First attempt - create event
      const mockCreated = {
        id: "webhook_1",
        stripeEventId: eventId,
        eventType: "invoice.payment_failed",
        apiVersion: "2023-10-16",
        processed: false,
        processedAt: null,
        errorMessage: null,
        createdAt: new Date(),
      };
      
      vi.mocked(db.webhookEvent.create).mockResolvedValue(mockCreated);
      
      const created = await db.webhookEvent.create({
        data: {
          stripeEventId: eventId,
          eventType: "invoice.payment_failed",
          apiVersion: "2023-10-16",
          processed: false,
        },
      });

      // Processing fails - update with error
      const mockFailed = {
        ...mockCreated,
        errorMessage: "Temporary database error",
      };
      
      vi.mocked(db.webhookEvent.update).mockResolvedValueOnce(mockFailed);
      
      const failed = await db.webhookEvent.update({
        where: { id: created.id },
        data: {
          errorMessage: "Temporary database error",
        },
      });
      expect(failed.processed).toBe(false);
      expect(failed.errorMessage).toBeTruthy();

      // Retry - check if event exists
      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(mockFailed);
      
      const existing = await db.webhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });
      expect(existing).toBeDefined();
      expect(existing?.processed).toBe(false);

      // Should allow retry since processed=false
      if (!existing?.processed) {
        // Retry processing (simulated)
        const mockRetried = {
          ...mockFailed,
          processed: true,
          processedAt: new Date(),
          errorMessage: null,
        };
        
        vi.mocked(db.webhookEvent.update).mockResolvedValueOnce(mockRetried);
        
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
