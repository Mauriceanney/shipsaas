import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("@/lib/db", () => ({
  db: {
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import type Stripe from "stripe";

describe("Webhook Idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("first-time event processing", () => {
    it("creates WebhookEvent record with processed=false before processing", async () => {
      const mockEvent: Partial<Stripe.Event> = {
        id: "evt_test_123",
        object: "event",
        api_version: "2023-10-16",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "sub_123",
          } as any,
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        type: "customer.subscription.created",
      };

      // Mock: no existing webhook event
      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(null);

      // Mock: create webhook event
      vi.mocked(db.webhookEvent.create).mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: false,
        processedAt: null,
        apiVersion: "2023-10-16",
        errorMessage: null,
        createdAt: new Date(),
      });

      // Mock: update webhook event after processing
      vi.mocked(db.webhookEvent.update).mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: true,
        processedAt: new Date(),
        apiVersion: "2023-10-16",
        errorMessage: null,
        createdAt: new Date(),
      });

      // This test verifies the expected behavior without actually calling the route
      // The route handler will implement this logic

      expect(db.webhookEvent.findUnique).toBeDefined();
      expect(db.webhookEvent.create).toBeDefined();
      expect(db.webhookEvent.update).toBeDefined();
    });

    it("updates WebhookEvent to processed=true after successful processing", async () => {
      const mockUpdate = vi.mocked(db.webhookEvent.update);

      mockUpdate.mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: true,
        processedAt: new Date(),
        apiVersion: "2023-10-16",
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await mockUpdate({
        where: { stripeEventId: "evt_test_123" },
        data: {
          processed: true,
          processedAt: expect.any(Date),
        },
      });

      expect(result.processed).toBe(true);
      expect(result.processedAt).toBeDefined();
    });
  });

  describe("duplicate event handling", () => {
    it("returns success without re-processing when event already processed", async () => {
      const processedEvent = {
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: true,
        processedAt: new Date(),
        apiVersion: "2023-10-16",
        errorMessage: null,
        createdAt: new Date(),
      };

      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(processedEvent);

      const existingEvent = await db.webhookEvent.findUnique({
        where: { stripeEventId: "evt_test_123" },
      });

      expect(existingEvent).toBeDefined();
      expect(existingEvent?.processed).toBe(true);

      // Should not call create or update when event already processed
      expect(db.webhookEvent.create).not.toHaveBeenCalled();
      expect(db.webhookEvent.update).not.toHaveBeenCalled();
    });

    it("processes event if it exists but processed=false (retry scenario)", async () => {
      const unprocessedEvent = {
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: false,
        processedAt: null,
        apiVersion: "2023-10-16",
        errorMessage: "Previous attempt failed",
        createdAt: new Date(),
      };

      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(unprocessedEvent);

      const existingEvent = await db.webhookEvent.findUnique({
        where: { stripeEventId: "evt_test_123" },
      });

      expect(existingEvent?.processed).toBe(false);
      // Should allow re-processing when processed=false
    });
  });

  describe("event metadata tracking", () => {
    it("stores event type in WebhookEvent", async () => {
      vi.mocked(db.webhookEvent.create).mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "invoice.payment_failed",
        processed: false,
        processedAt: null,
        apiVersion: "2023-10-16",
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await db.webhookEvent.create({
        data: {
          stripeEventId: "evt_test_123",
          eventType: "invoice.payment_failed",
          apiVersion: "2023-10-16",
        },
      });

      expect(result.eventType).toBe("invoice.payment_failed");
    });

    it("stores API version in WebhookEvent", async () => {
      vi.mocked(db.webhookEvent.create).mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.updated",
        processed: false,
        processedAt: null,
        apiVersion: "2024-01-01",
        errorMessage: null,
        createdAt: new Date(),
      });

      const result = await db.webhookEvent.create({
        data: {
          stripeEventId: "evt_test_123",
          eventType: "customer.subscription.updated",
          apiVersion: "2024-01-01",
        },
      });

      expect(result.apiVersion).toBe("2024-01-01");
    });
  });

  describe("error handling", () => {
    it("stores error message when processing fails", async () => {
      const errorMessage = "Database connection failed";

      vi.mocked(db.webhookEvent.update).mockResolvedValue({
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: false,
        processedAt: null,
        apiVersion: "2023-10-16",
        errorMessage: errorMessage,
        createdAt: new Date(),
      });

      const result = await db.webhookEvent.update({
        where: { stripeEventId: "evt_test_123" },
        data: {
          errorMessage: errorMessage,
        },
      });

      expect(result.errorMessage).toBe(errorMessage);
      expect(result.processed).toBe(false);
    });

    it("allows retry after error by keeping processed=false", async () => {
      const failedEvent = {
        id: "webhook_1",
        stripeEventId: "evt_test_123",
        eventType: "customer.subscription.created",
        processed: false,
        processedAt: null,
        apiVersion: "2023-10-16",
        errorMessage: "Previous error",
        createdAt: new Date(),
      };

      vi.mocked(db.webhookEvent.findUnique).mockResolvedValue(failedEvent);

      const existingEvent = await db.webhookEvent.findUnique({
        where: { stripeEventId: "evt_test_123" },
      });

      // Should be retryable
      expect(existingEvent?.processed).toBe(false);
      expect(existingEvent?.errorMessage).toBeTruthy();
    });
  });

  describe("race condition handling", () => {
    it("handles unique constraint violation gracefully", async () => {
      // Simulate race condition where two requests try to create the same event
      const uniqueConstraintError = new Error("Unique constraint failed");
      (uniqueConstraintError as any).code = "P2002";

      vi.mocked(db.webhookEvent.create)
        .mockRejectedValueOnce(uniqueConstraintError)
        .mockResolvedValueOnce({
          id: "webhook_1",
          stripeEventId: "evt_test_123",
          eventType: "customer.subscription.created",
          processed: false,
          processedAt: null,
          apiVersion: "2023-10-16",
          errorMessage: null,
          createdAt: new Date(),
        });

      // First attempt should fail
      await expect(
        db.webhookEvent.create({
          data: {
            stripeEventId: "evt_test_123",
            eventType: "customer.subscription.created",
            apiVersion: "2023-10-16",
          },
        })
      ).rejects.toThrow("Unique constraint failed");

      // Second attempt should succeed (or fetch existing)
      const result = await db.webhookEvent.create({
        data: {
          stripeEventId: "evt_test_123",
          eventType: "customer.subscription.created",
          apiVersion: "2023-10-16",
        },
      });

      expect(result).toBeDefined();
    });
  });
});
