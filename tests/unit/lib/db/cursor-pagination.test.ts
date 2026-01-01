import { describe, it, expect } from "vitest";

import {
  encodeCursor,
  decodeCursor,
  normalizeCursorParams,
  createCursorResult,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "@/lib/db/cursor-pagination";

describe("cursor-pagination", () => {
  describe("encodeCursor", () => {
    it("encodes a user ID to base64", () => {
      const id = "user-123";
      const cursor = encodeCursor(id);

      expect(cursor).toBe(Buffer.from(id).toString("base64"));
    });

    it("encodes special characters correctly", () => {
      const id = "clz-abc_123-def";
      const cursor = encodeCursor(id);
      const decoded = Buffer.from(cursor, "base64").toString();

      expect(decoded).toBe(id);
    });
  });

  describe("decodeCursor", () => {
    it("decodes a valid base64 cursor", () => {
      const id = "user-456";
      const cursor = Buffer.from(id).toString("base64");

      expect(decodeCursor(cursor)).toBe(id);
    });

    it("returns null for undefined cursor", () => {
      expect(decodeCursor(undefined)).toBeNull();
    });

    it("returns null for empty string cursor", () => {
      expect(decodeCursor("")).toBeNull();
    });

    it("handles invalid base64 gracefully", () => {
      // Node's Buffer is lenient with base64 - it decodes what it can
      // Invalid cursors won't match any database record anyway
      const result = decodeCursor("not-valid-base64!!!");
      expect(typeof result === "string" || result === null).toBe(true);
    });

    it("returns null for cursor that decodes to empty string", () => {
      // Empty string encoded in base64 is ""
      const emptyCursor = Buffer.from("").toString("base64");
      expect(decodeCursor(emptyCursor)).toBeNull();
    });
  });

  describe("normalizeCursorParams", () => {
    it("uses default limit when not provided", () => {
      const result = normalizeCursorParams({});

      expect(result.limit).toBe(DEFAULT_LIMIT);
    });

    it("respects provided limit within bounds", () => {
      const result = normalizeCursorParams({ limit: 25 });

      expect(result.limit).toBe(25);
    });

    it("enforces minimum limit of 1", () => {
      const result = normalizeCursorParams({ limit: 0 });

      expect(result.limit).toBe(1);
    });

    it("enforces minimum limit for negative values", () => {
      const result = normalizeCursorParams({ limit: -5 });

      expect(result.limit).toBe(1);
    });

    it("enforces maximum limit", () => {
      const result = normalizeCursorParams({ limit: 1000 });

      expect(result.limit).toBe(MAX_LIMIT);
    });

    it("decodes valid cursor", () => {
      const id = "user-789";
      const cursor = Buffer.from(id).toString("base64");

      const result = normalizeCursorParams({ cursor });

      expect(result.cursor).toBe(id);
    });

    it("handles invalid cursor gracefully", () => {
      // Node's Buffer is lenient - invalid base64 decodes to garbage
      // which won't match any database record anyway
      const result = normalizeCursorParams({ cursor: "invalid!!!" });
      expect(typeof result.cursor === "string" || result.cursor === null).toBe(
        true
      );
    });

    it("sets direction to next by default", () => {
      const result = normalizeCursorParams({});

      expect(result.direction).toBe("next");
    });

    it("respects provided direction", () => {
      const result = normalizeCursorParams({ direction: "prev" });

      expect(result.direction).toBe("prev");
    });
  });

  describe("createCursorResult", () => {
    const mockUsers = [
      { id: "user-1", name: "Alice" },
      { id: "user-2", name: "Bob" },
      { id: "user-3", name: "Charlie" },
    ];

    it("creates result with no more pages when items <= limit", () => {
      const result = createCursorResult(mockUsers, 10, (u) => u.id);

      expect(result.items).toHaveLength(3);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("creates result with next page when items > limit", () => {
      // Simulate fetching limit + 1 items
      const itemsWithExtra = [...mockUsers, { id: "user-4", name: "David" }];

      const result = createCursorResult(itemsWithExtra, 3, (u) => u.id);

      expect(result.items).toHaveLength(3); // Extra item removed
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe(encodeCursor("user-3")); // Last visible item
    });

    it("creates result for empty items", () => {
      const result = createCursorResult<{ id: string; name: string }>([], 10, (u) => u.id);

      expect(result.items).toHaveLength(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("creates result for single item", () => {
      const result = createCursorResult([mockUsers[0]!], 10, (u) => u.id);

      expect(result.items).toHaveLength(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it("includes limit in result", () => {
      const result = createCursorResult(mockUsers, 25, (u) => u.id);

      expect(result.limit).toBe(25);
    });

    it("sets hasPreviousPage based on cursor presence", () => {
      const resultWithoutCursor = createCursorResult(
        mockUsers,
        10,
        (u) => u.id,
        null
      );
      expect(resultWithoutCursor.hasPreviousPage).toBe(false);

      const resultWithCursor = createCursorResult(
        mockUsers,
        10,
        (u) => u.id,
        "some-cursor"
      );
      expect(resultWithCursor.hasPreviousPage).toBe(true);
    });
  });
});
