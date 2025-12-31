/**
 * Unit tests for usage metering service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    usage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock db
vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import {
  getCurrentPeriod,
  getOrCreateUsage,
  getUserUsage,
  incrementUsage,
  decrementUsage,
  canUseMetric,
  isApproachingLimit,
  getUsagePercentage,
} from "@/lib/usage";

describe("usage metering service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurrentPeriod", () => {
    it("returns period in YYYY-MM format", () => {
      const period = getCurrentPeriod();
      expect(period).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("getOrCreateUsage", () => {
    it("returns existing usage record if found", async () => {
      const existingUsage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 100,
        projectsCount: 2,
        storageBytes: BigInt(1000),
        teamMembers: 3,
      };
      mockDb.usage.findUnique.mockResolvedValue(existingUsage);

      const result = await getOrCreateUsage("user-1", "2024-01");

      expect(result).toEqual(existingUsage);
      expect(mockDb.usage.create).not.toHaveBeenCalled();
    });

    it("creates new usage record if not found", async () => {
      mockDb.usage.findUnique.mockResolvedValue(null);
      const newUsage = {
        id: "usage-new",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 0,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.create.mockResolvedValue(newUsage);

      const result = await getOrCreateUsage("user-1", "2024-01");

      expect(result).toEqual(newUsage);
      expect(mockDb.usage.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          period: "2024-01",
          apiCalls: 0,
          projectsCount: 0,
          storageBytes: BigInt(0),
          teamMembers: 0,
        },
      });
    });
  });

  describe("getUserUsage", () => {
    it("returns usage data with plan limits", async () => {
      const usage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 500,
        projectsCount: 1,
        storageBytes: BigInt(1000000),
        teamMembers: 1,
      };
      mockDb.usage.findUnique.mockResolvedValue(usage);

      const result = await getUserUsage("user-1", "FREE");

      expect(result.apiCalls.used).toBe(500);
      expect(result.apiCalls.limit).toBe(1000);
      expect(result.projects.used).toBe(1);
      expect(result.projects.limit).toBe(1);
    });

    it("returns unlimited limits for PLUS", async () => {
      const usage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 50000,
        projectsCount: 100,
        storageBytes: BigInt(1000000000),
        teamMembers: 50,
      };
      mockDb.usage.findUnique.mockResolvedValue(usage);

      const result = await getUserUsage("user-1", "PRO");

      expect(result.apiCalls.limit).toBe(-1); // Unlimited
      expect(result.projects.limit).toBe(-1);
      expect(result.storage.limit).toBe(-1);
      expect(result.teamMembers.limit).toBe(-1);
    });
  });

  describe("incrementUsage", () => {
    it("increments apiCalls by default amount", async () => {
      const existingUsage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 100,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(existingUsage);
      mockDb.usage.update.mockResolvedValue({
        ...existingUsage,
        apiCalls: 101,
      });

      await incrementUsage("user-1", "apiCalls");

      expect(mockDb.usage.update).toHaveBeenCalledWith({
        where: { id: "usage-1" },
        data: { apiCalls: { increment: 1 } },
      });
    });

    it("increments storageBytes with BigInt", async () => {
      const existingUsage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 0,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(existingUsage);
      mockDb.usage.update.mockResolvedValue({
        ...existingUsage,
        storageBytes: BigInt(1000),
      });

      await incrementUsage("user-1", "storageBytes", 1000);

      expect(mockDb.usage.update).toHaveBeenCalledWith({
        where: { id: "usage-1" },
        data: { storageBytes: { increment: BigInt(1000) } },
      });
    });
  });

  describe("decrementUsage", () => {
    it("decrements projectsCount", async () => {
      const existingUsage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 0,
        projectsCount: 5,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(existingUsage);
      mockDb.usage.update.mockResolvedValue({
        ...existingUsage,
        projectsCount: 4,
      });

      await decrementUsage("user-1", "projectsCount");

      expect(mockDb.usage.update).toHaveBeenCalledWith({
        where: { id: "usage-1" },
        data: { projectsCount: 4 },
      });
    });

    it("does not go below zero", async () => {
      const existingUsage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 0,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(existingUsage);
      mockDb.usage.update.mockResolvedValue({
        ...existingUsage,
        projectsCount: 0,
      });

      await decrementUsage("user-1", "projectsCount");

      expect(mockDb.usage.update).toHaveBeenCalledWith({
        where: { id: "usage-1" },
        data: { projectsCount: 0 },
      });
    });
  });

  describe("canUseMetric", () => {
    it("returns allowed true when within limit", async () => {
      const usage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 500,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(usage);

      const result = await canUseMetric("user-1", "FREE", "apiCalls");

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(500);
      expect(result.limit).toBe(1000);
    });

    it("returns allowed false when at limit", async () => {
      const usage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 1000,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(usage);

      const result = await canUseMetric("user-1", "FREE", "apiCalls");

      expect(result.allowed).toBe(false);
      expect(result.current).toBe(1000);
      expect(result.limit).toBe(1000);
    });

    it("returns allowed true for unlimited plan", async () => {
      const usage = {
        id: "usage-1",
        userId: "user-1",
        period: "2024-01",
        apiCalls: 100000,
        projectsCount: 0,
        storageBytes: BigInt(0),
        teamMembers: 0,
      };
      mockDb.usage.findUnique.mockResolvedValue(usage);

      const result = await canUseMetric("user-1", "PRO", "apiCalls");

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });
  });

  describe("isApproachingLimit", () => {
    it("returns false when under 80%", () => {
      expect(isApproachingLimit(70, 100)).toBe(false);
    });

    it("returns true when at 80%", () => {
      expect(isApproachingLimit(80, 100)).toBe(true);
    });

    it("returns true when over 80%", () => {
      expect(isApproachingLimit(90, 100)).toBe(true);
    });

    it("returns false for unlimited", () => {
      expect(isApproachingLimit(1000000, -1)).toBe(false);
    });
  });

  describe("getUsagePercentage", () => {
    it("calculates percentage correctly", () => {
      expect(getUsagePercentage(50, 100)).toBe(50);
      expect(getUsagePercentage(25, 100)).toBe(25);
      expect(getUsagePercentage(100, 100)).toBe(100);
    });

    it("caps at 100%", () => {
      expect(getUsagePercentage(150, 100)).toBe(100);
    });

    it("returns 0 for unlimited", () => {
      expect(getUsagePercentage(1000, -1)).toBe(0);
    });

    it("handles zero limit", () => {
      expect(getUsagePercentage(0, 0)).toBe(100);
    });
  });
});
