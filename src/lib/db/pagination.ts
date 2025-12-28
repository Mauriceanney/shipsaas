/**
 * Pagination utilities for Prisma queries
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Normalizes pagination input with defaults and constraints
 */
export function normalizePagination(
  input: PaginationInput
): NormalizedPagination {
  // Ensure page is at least 1
  const page = Math.max(1, input.page ?? 1);

  // Ensure pageSize is between 1 and MAX_PAGE_SIZE
  let pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  pageSize = Math.max(1, pageSize);
  pageSize = Math.min(MAX_PAGE_SIZE, pageSize);

  // Calculate skip and take
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { page, pageSize, skip, take };
}

/**
 * Calculates pagination metadata from query results
 */
export function calculatePaginationMeta(params: {
  totalCount: number;
  page: number;
  pageSize: number;
}): PaginationMeta {
  const { totalCount, page, pageSize } = params;

  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

/**
 * Creates a paginated result from items and metadata
 */
export function createPaginatedResult<T>(
  items: T[],
  meta: PaginationMeta
): PaginatedResult<T> {
  return { items, meta };
}
