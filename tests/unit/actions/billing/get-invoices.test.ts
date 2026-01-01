/**
 * Tests for getInvoices server action
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies BEFORE imports using hoisted scope
const { mockAuth, mockDb, mockStripe, mockLogger } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDb: {
    subscription: {
      findUnique: vi.fn(),
    },
  },
  mockStripe: {
    invoices: {
      list: vi.fn(),
    },
  },
  mockLogger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/stripe/client", () => ({
  stripe: mockStripe,
}));

vi.mock("@/lib/logger", () => ({
  logger: mockLogger,
}));

import { getInvoices } from "@/actions/billing/get-invoices";

describe("getInvoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe("authentication", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await getInvoices();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const result = await getInvoices();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unauthorized");
      }
    });

    it("returns error when session has no user ID", async () => {
      mockAuth.mockResolvedValue({ user: { id: null } });

      const result = await getInvoices();

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // VALIDATION TESTS
  // ============================================

  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ 
        user: { id: "user-1" } 
      });
    });

    it("accepts valid limit", async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);

      const result = await getInvoices({ limit: 10 });

      expect(result.success).toBe(true);
    });

    it("returns error for limit less than 1", async () => {
      const result = await getInvoices({ limit: 0 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Number must be greater");
      }
    });

    it("returns error for limit greater than 100", async () => {
      const result = await getInvoices({ limit: 101 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Number must be less");
      }
    });

    it("uses default limit of 12 when not provided", async () => {
      mockDb.subscription.findUnique.mockResolvedValue({
        userId: "user-1",
        stripeCustomerId: "cus_123",
      });

      mockStripe.invoices.list.mockResolvedValue({
        data: [],
      });

      await getInvoices();

      expect(mockStripe.invoices.list).toHaveBeenCalledWith({
        customer: "cus_123",
        limit: 12,
      });
    });
  });

  // ============================================
  // NO SUBSCRIPTION TESTS
  // ============================================

  describe("no subscription", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ 
        user: { id: "user-1" } 
      });
    });

    it("returns empty array when user has no subscription", async () => {
      mockDb.subscription.findUnique.mockResolvedValue(null);

      const result = await getInvoices();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("returns empty array when subscription has no customer ID", async () => {
      mockDb.subscription.findUnique.mockResolvedValue({
        userId: "user-1",
        stripeCustomerId: null,
      });

      const result = await getInvoices();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  // ============================================
  // SUCCESS TESTS
  // ============================================

  describe("success cases", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ 
        user: { id: "user-1" } 
      });

      mockDb.subscription.findUnique.mockResolvedValue({
        userId: "user-1",
        stripeCustomerId: "cus_123",
      });
    });

    it("fetches and returns invoices from Stripe", async () => {
      const mockInvoices = [
        {
          id: "in_1",
          number: "INV-001",
          amount_paid: 1999,
          currency: "usd",
          status: "paid",
          created: 1704067200,
          hosted_invoice_url: "https://invoice.stripe.com/1",
          invoice_pdf: "https://invoice.stripe.com/1/pdf",
        },
        {
          id: "in_2",
          number: "INV-002",
          amount_paid: 1999,
          currency: "usd",
          status: "paid",
          created: 1706745600,
          hosted_invoice_url: "https://invoice.stripe.com/2",
          invoice_pdf: "https://invoice.stripe.com/2/pdf",
        },
      ];

      mockStripe.invoices.list.mockResolvedValue({
        data: mockInvoices,
      });

      const result = await getInvoices({ limit: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toEqual({
          id: "in_1",
          number: "INV-001",
          amountPaid: 1999,
          currency: "usd",
          status: "paid",
          created: 1704067200,
          hostedInvoiceUrl: "https://invoice.stripe.com/1",
          invoicePdf: "https://invoice.stripe.com/1/pdf",
        });
      }

      expect(mockStripe.invoices.list).toHaveBeenCalledWith({
        customer: "cus_123",
        limit: 10,
      });
    });

    it("handles empty invoice list", async () => {
      mockStripe.invoices.list.mockResolvedValue({
        data: [],
      });

      const result = await getInvoices();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ 
        user: { id: "user-1" } 
      });

      mockDb.subscription.findUnique.mockResolvedValue({
        userId: "user-1",
        stripeCustomerId: "cus_123",
      });
    });

    it("handles Stripe API errors gracefully", async () => {
      mockStripe.invoices.list.mockRejectedValue(
        new Error("Stripe API error")
      );

      const result = await getInvoices();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch invoices");
      }
    });

    it("handles network errors gracefully", async () => {
      mockStripe.invoices.list.mockRejectedValue(
        new Error("Network timeout")
      );

      const result = await getInvoices();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch invoices");
      }
    });
  });
});
