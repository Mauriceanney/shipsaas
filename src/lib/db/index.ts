/**
 * Database utilities
 *
 * This module provides utilities for working with Prisma:
 * - Pagination helpers
 * - Transaction helpers
 * - Soft delete utilities
 */

// Re-export Prisma client
export { db } from "./client";

// Pagination
export {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  normalizePagination,
  calculatePaginationMeta,
  createPaginatedResult,
  type PaginationInput,
  type NormalizedPagination,
  type PaginationMeta,
  type PaginatedResult,
} from "./pagination";

// Transactions
export {
  DEFAULT_TRANSACTION_OPTIONS,
  DEFAULT_RETRY_OPTIONS,
  isTransientError,
  calculateRetryDelay,
  delay,
  type TransactionOptions,
  type RetryOptions,
} from "./transaction";

// Soft Delete
export {
  SOFT_DELETABLE_MODELS,
  isSoftDeleted,
  excludeDeletedFilter,
  onlyDeletedFilter,
  isSoftDeletableModel,
  type SoftDeletableModel,
  type SoftDeletable,
} from "./soft-delete";
