import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizePagination,
  calculatePaginationMeta,
} from "@/lib/db/pagination";

describe("Pagination Helpers", () => {
  describe("normalizePagination", () => {
    it("uses default values when no params provided", () => {
      const result = normalizePagination({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
    });

    it("accepts valid page and pageSize", () => {
      const result = normalizePagination({ page: 3, pageSize: 25 });

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(25);
    });

    it("enforces minimum page of 1", () => {
      const result = normalizePagination({ page: 0 });
      expect(result.page).toBe(1);

      const resultNegative = normalizePagination({ page: -5 });
      expect(resultNegative.page).toBe(1);
    });

    it("enforces minimum pageSize of 1", () => {
      const result = normalizePagination({ pageSize: 0 });
      expect(result.pageSize).toBe(1);

      const resultNegative = normalizePagination({ pageSize: -10 });
      expect(resultNegative.pageSize).toBe(1);
    });

    it("enforces maximum pageSize", () => {
      const result = normalizePagination({ pageSize: 500 });
      expect(result.pageSize).toBe(MAX_PAGE_SIZE);
    });

    it("calculates correct skip value", () => {
      const result = normalizePagination({ page: 3, pageSize: 20 });
      expect(result.skip).toBe(40); // (3-1) * 20

      const result2 = normalizePagination({ page: 1, pageSize: 10 });
      expect(result2.skip).toBe(0);
    });

    it("calculates correct take value", () => {
      const result = normalizePagination({ page: 1, pageSize: 15 });
      expect(result.take).toBe(15);
    });
  });

  describe("calculatePaginationMeta", () => {
    it("calculates correct totalPages", () => {
      const meta = calculatePaginationMeta({
        totalCount: 100,
        page: 1,
        pageSize: 20,
      });

      expect(meta.totalPages).toBe(5);
    });

    it("rounds up totalPages for partial pages", () => {
      const meta = calculatePaginationMeta({
        totalCount: 101,
        page: 1,
        pageSize: 20,
      });

      expect(meta.totalPages).toBe(6);
    });

    it("returns 0 totalPages for empty results", () => {
      const meta = calculatePaginationMeta({
        totalCount: 0,
        page: 1,
        pageSize: 20,
      });

      expect(meta.totalPages).toBe(0);
    });

    it("calculates hasNextPage correctly", () => {
      const metaWithNext = calculatePaginationMeta({
        totalCount: 100,
        page: 1,
        pageSize: 20,
      });
      expect(metaWithNext.hasNextPage).toBe(true);

      const metaLastPage = calculatePaginationMeta({
        totalCount: 100,
        page: 5,
        pageSize: 20,
      });
      expect(metaLastPage.hasNextPage).toBe(false);
    });

    it("calculates hasPreviousPage correctly", () => {
      const metaFirstPage = calculatePaginationMeta({
        totalCount: 100,
        page: 1,
        pageSize: 20,
      });
      expect(metaFirstPage.hasPreviousPage).toBe(false);

      const metaSecondPage = calculatePaginationMeta({
        totalCount: 100,
        page: 2,
        pageSize: 20,
      });
      expect(metaSecondPage.hasPreviousPage).toBe(true);
    });

    it("includes all metadata fields", () => {
      const meta = calculatePaginationMeta({
        totalCount: 55,
        page: 2,
        pageSize: 10,
      });

      expect(meta).toEqual({
        page: 2,
        pageSize: 10,
        totalCount: 55,
        totalPages: 6,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });
  });

  describe("constants", () => {
    it("exports DEFAULT_PAGE_SIZE", () => {
      expect(DEFAULT_PAGE_SIZE).toBe(20);
    });

    it("exports MAX_PAGE_SIZE", () => {
      expect(MAX_PAGE_SIZE).toBe(100);
    });
  });
});
