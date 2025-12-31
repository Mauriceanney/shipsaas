# Epic 3: Database Utilities - Technical Architecture Document

**Version**: 1.0
**Last Updated**: 2025-12-28
**Status**: Ready for Implementation

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Type Definitions](#3-type-definitions)
4. [Pagination Helpers](#4-pagination-helpers)
5. [Transaction Helpers](#5-transaction-helpers)
6. [Soft Delete Support](#6-soft-delete-support)
7. [Additional Indexes](#7-additional-indexes)
8. [Enhanced Seeds](#8-enhanced-seeds)
9. [Test Fixtures](#9-test-fixtures)
10. [Integration Points](#10-integration-points)
11. [Testing Strategy](#11-testing-strategy)
12. [Implementation Checklist](#12-implementation-checklist)

---

## 1. Overview

### 1.1 Purpose

This document outlines the technical architecture for database utilities that enhance the existing Prisma setup. These utilities provide:

- Type-safe pagination for list queries
- Transaction management with retry logic for transient failures
- Soft delete functionality via Prisma Client Extensions
- Performance optimization through strategic indexing
- Comprehensive seed data for development and testing
- Factory functions for creating test data

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Runtime | Node.js | 20.x |
| Testing | Vitest | 2.x |
| TypeScript | TypeScript | 5.x |

### 1.3 Design Principles

1. **Type Safety**: All utilities must be fully typed with TypeScript generics
2. **Composability**: Utilities should work together seamlessly
3. **Testability**: All code must be unit-testable with mocked dependencies
4. **Performance**: Minimize database round trips and optimize queries
5. **Developer Experience**: Intuitive APIs with good error messages

---

## 2. File Structure

```
src/
├── lib/
│   └── db/
│       ├── index.ts              # Main db export (existing, enhanced)
│       ├── client.ts             # Extended Prisma client with soft delete
│       ├── pagination.ts         # Generic pagination utilities
│       ├── transactions.ts       # Transaction wrapper with retry
│       ├── soft-delete.ts        # Soft delete extension
│       └── types.ts              # Database utility types

prisma/
├── schema.prisma                 # Schema with soft delete fields & indexes
├── migrations/                   # Generated migrations
└── seeds/
    ├── index.ts                  # Main seed orchestrator (existing)
    ├── base.ts                   # Base/essential data (existing, enhanced)
    ├── demo.ts                   # Demo data (existing, enhanced)
    ├── test.ts                   # Test-specific seed data
    └── utils.ts                  # Seed helper utilities

tests/
├── setup.ts                      # Test setup (existing, enhanced)
├── fixtures/
│   ├── index.ts                  # Main fixtures export
│   ├── user.fixture.ts           # User factory functions
│   ├── subscription.fixture.ts   # Subscription factory functions
│   └── helpers.ts                # Test helper utilities
├── unit/
│   └── lib/
│       └── db/
│           ├── pagination.test.ts
│           ├── transactions.test.ts
│           └── soft-delete.test.ts
└── integration/
    └── db/
        ├── pagination.integration.test.ts
        └── transactions.integration.test.ts
```

---

## 3. Type Definitions

### 3.1 Database Utility Types (`src/lib/db/types.ts`)

```typescript
import type { Prisma, PrismaClient } from "@prisma/client";

// ============================================
// PAGINATION TYPES
// ============================================

/**
 * Input parameters for pagination
 */
export interface PaginationInput {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Maximum allowed page size (default: 100) */
  maxPageSize?: number;
}

/**
 * Normalized pagination parameters after validation
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/**
 * Paginated result wrapper with metadata
 */
export interface PaginatedResult<T> {
  /** Array of items for current page */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNextPage: boolean;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Cursor-based pagination input
 */
export interface CursorPaginationInput {
  /** Cursor for the starting point */
  cursor?: string;
  /** Number of items to fetch */
  take?: number;
  /** Direction of pagination */
  direction?: "forward" | "backward";
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginatedResult<T> {
  items: T[];
  /** Cursor for the next page */
  nextCursor: string | null;
  /** Cursor for the previous page */
  previousCursor: string | null;
  /** Whether there are more items */
  hasMore: boolean;
}

// ============================================
// TRANSACTION TYPES
// ============================================

/**
 * Transaction options for withTransaction
 */
export interface TransactionOptions {
  /** Maximum wait time for acquiring a transaction lock (ms) */
  maxWait?: number;
  /** Transaction timeout (ms) */
  timeout?: number;
  /** Isolation level for the transaction */
  isolationLevel?: Prisma.TransactionIsolationLevel;
  /** Number of retry attempts on transient errors */
  retries?: number;
  /** Base delay between retries (ms), with exponential backoff */
  retryDelay?: number;
}

/**
 * Transaction callback function type
 */
export type TransactionCallback<T> = (
  tx: Prisma.TransactionClient
) => Promise<T>;

/**
 * Error types that are considered transient and retryable
 */
export type TransientErrorCode =
  | "P2034"  // Transaction conflict
  | "P2028"  // Transaction API error
  | "P1017"  // Server closed connection
  | "P1001"  // Can't reach database server
  | "P1002"; // Timeout

// ============================================
// SOFT DELETE TYPES
// ============================================

/**
 * Fields required for soft delete support
 */
export interface SoftDeletable {
  deletedAt: Date | null;
}

/**
 * Query options for soft delete filtering
 */
export interface SoftDeleteQueryOptions {
  /** Include soft-deleted records */
  includeDeleted?: boolean;
  /** Only return soft-deleted records */
  onlyDeleted?: boolean;
}

/**
 * Models that support soft delete
 */
export type SoftDeletableModel = "User" | "Subscription";

/**
 * Extended Prisma client with soft delete methods
 */
export interface SoftDeleteExtension {
  softDelete: <T extends SoftDeletableModel>(
    model: T,
    where: Prisma.Args<PrismaClient[Uncapitalize<T>], "delete">["where"]
  ) => Promise<void>;

  restore: <T extends SoftDeletableModel>(
    model: T,
    where: Prisma.Args<PrismaClient[Uncapitalize<T>], "update">["where"]
  ) => Promise<void>;
}

// ============================================
// SEED & FIXTURE TYPES
// ============================================

/**
 * User creation input for factories
 */
export interface CreateUserInput {
  email?: string;
  name?: string;
  password?: string;
  role?: "USER" | "ADMIN";
  emailVerified?: boolean;
}

/**
 * Subscription creation input for factories
 */
export interface CreateSubscriptionInput {
  userId: string;
  status?: "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";
  plan?: "FREE" | "PLUS" | "PRO";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Factory function result with cleanup
 */
export interface FactoryResult<T> {
  data: T;
  cleanup: () => Promise<void>;
}

/**
 * Batch factory result
 */
export interface BatchFactoryResult<T> {
  data: T[];
  cleanup: () => Promise<void>;
}
```

### 3.2 Update Existing Types (`src/types/index.ts`)

The existing `src/types/index.ts` already defines `PaginationParams` and `PaginatedResult`. We will:
1. Keep backward compatibility with existing interfaces
2. Export new detailed types from `src/lib/db/types.ts`
3. Create type aliases where needed

```typescript
// Add to existing src/types/index.ts

// Re-export database utility types for convenience
export type {
  PaginationInput,
  PaginationMeta,
  CursorPaginationInput,
  CursorPaginatedResult,
  TransactionOptions,
  TransactionCallback,
  SoftDeleteQueryOptions,
} from "@/lib/db/types";
```

---

## 4. Pagination Helpers

### 4.1 Implementation (`src/lib/db/pagination.ts`)

```typescript
import type {
  PaginationInput,
  PaginationParams,
  PaginatedResult,
  PaginationMeta,
  CursorPaginationInput,
  CursorPaginatedResult,
} from "./types";

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MAX_PAGE_SIZE = 100;

// ============================================
// OFFSET PAGINATION
// ============================================

/**
 * Normalizes and validates pagination input
 *
 * @param input - Raw pagination input
 * @returns Normalized pagination parameters
 *
 * @example
 * const params = normalizePagination({ page: 2, pageSize: 10 });
 * // { page: 2, pageSize: 10, skip: 10, take: 10 }
 */
export function normalizePagination(input: PaginationInput = {}): PaginationParams {
  const {
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
    maxPageSize = DEFAULT_MAX_PAGE_SIZE,
  } = input;

  // Validate and clamp values
  const validPage = Math.max(1, Math.floor(page));
  const validPageSize = Math.min(
    Math.max(1, Math.floor(pageSize)),
    maxPageSize
  );

  return {
    page: validPage,
    pageSize: validPageSize,
    skip: (validPage - 1) * validPageSize,
    take: validPageSize,
  };
}

/**
 * Creates pagination metadata from count and params
 *
 * @param total - Total number of items
 * @param params - Pagination parameters
 * @returns Pagination metadata
 */
export function createPaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const totalPages = Math.ceil(total / params.pageSize);

  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };
}

/**
 * Generic pagination function for Prisma queries
 *
 * @param queryFn - Function to execute the query
 * @param countFn - Function to get total count
 * @param input - Pagination input
 * @returns Paginated result with items and metadata
 *
 * @example
 * const result = await paginate(
 *   (params) => db.user.findMany({
 *     skip: params.skip,
 *     take: params.take,
 *     orderBy: { createdAt: 'desc' },
 *   }),
 *   () => db.user.count(),
 *   { page: 1, pageSize: 10 }
 * );
 */
export async function paginate<T>(
  queryFn: (params: PaginationParams) => Promise<T[]>,
  countFn: () => Promise<number>,
  input: PaginationInput = {}
): Promise<PaginatedResult<T>> {
  const params = normalizePagination(input);

  // Execute query and count in parallel
  const [items, total] = await Promise.all([
    queryFn(params),
    countFn(),
  ]);

  const meta = createPaginationMeta(total, params);

  return { items, meta };
}

/**
 * Paginate with where clause support for common patterns
 *
 * @param model - Prisma model delegate
 * @param options - Query options including where, orderBy, include
 * @param input - Pagination input
 * @returns Paginated result
 *
 * @example
 * const result = await paginateModel(db.user, {
 *   where: { role: 'USER' },
 *   orderBy: { createdAt: 'desc' },
 *   include: { subscription: true },
 * }, { page: 1 });
 */
export async function paginateModel<T, W, O, I>(
  model: {
    findMany: (args: { skip?: number; take?: number; where?: W; orderBy?: O; include?: I }) => Promise<T[]>;
    count: (args: { where?: W }) => Promise<number>;
  },
  options: {
    where?: W;
    orderBy?: O;
    include?: I;
  } = {},
  input: PaginationInput = {}
): Promise<PaginatedResult<T>> {
  const params = normalizePagination(input);

  const [items, total] = await Promise.all([
    model.findMany({
      skip: params.skip,
      take: params.take,
      where: options.where,
      orderBy: options.orderBy,
      include: options.include,
    }),
    model.count({ where: options.where }),
  ]);

  const meta = createPaginationMeta(total, params);

  return { items, meta };
}

// ============================================
// CURSOR PAGINATION
// ============================================

const DEFAULT_CURSOR_TAKE = 20;
const MAX_CURSOR_TAKE = 100;

/**
 * Paginate using cursor-based pagination
 *
 * @param queryFn - Function to execute the query with cursor params
 * @param input - Cursor pagination input
 * @returns Cursor paginated result
 *
 * @example
 * const result = await paginateCursor(
 *   ({ cursor, take }) => db.user.findMany({
 *     take: take + 1, // Fetch one extra to determine hasMore
 *     cursor: cursor ? { id: cursor } : undefined,
 *     skip: cursor ? 1 : 0,
 *     orderBy: { id: 'asc' },
 *   }),
 *   { cursor: 'clx123', take: 10 }
 * );
 */
export async function paginateCursor<T extends { id: string }>(
  queryFn: (params: { cursor?: string; take: number }) => Promise<T[]>,
  input: CursorPaginationInput = {}
): Promise<CursorPaginatedResult<T>> {
  const take = Math.min(
    Math.max(1, input.take ?? DEFAULT_CURSOR_TAKE),
    MAX_CURSOR_TAKE
  );

  // Fetch one extra item to determine if there are more
  const items = await queryFn({
    cursor: input.cursor,
    take: take + 1,
  });

  const hasMore = items.length > take;
  const resultItems = hasMore ? items.slice(0, take) : items;

  const firstItem = resultItems[0];
  const lastItem = resultItems[resultItems.length - 1];

  return {
    items: resultItems,
    nextCursor: hasMore && lastItem ? lastItem.id : null,
    previousCursor: input.cursor && firstItem ? firstItem.id : null,
    hasMore,
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate page number for a specific item index
 */
export function getPageForIndex(index: number, pageSize: number): number {
  return Math.floor(index / pageSize) + 1;
}

/**
 * Get page range for display (e.g., "1 2 3 ... 10")
 */
export function getPageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): (number | "...")[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = currentPage - half;
  let end = currentPage + half;

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > totalPages) {
    end = totalPages;
    start = totalPages - maxVisible + 1;
  }

  const pages: (number | "...")[] = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}
```

### 4.2 Usage Examples

```typescript
// Example 1: Basic pagination with paginate helper
import { paginate } from "@/lib/db/pagination";
import { db } from "@/lib/db";

async function getUsers(page: number, pageSize: number) {
  return paginate(
    (params) => db.user.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
      include: { subscription: true },
    }),
    () => db.user.count(),
    { page, pageSize }
  );
}

// Example 2: Using paginateModel for simpler cases
import { paginateModel } from "@/lib/db/pagination";

async function getActiveUsers(page: number) {
  return paginateModel(
    db.user,
    {
      where: { emailVerified: { not: null } },
      orderBy: { createdAt: "desc" },
    },
    { page, pageSize: 20 }
  );
}

// Example 3: Cursor pagination for infinite scroll
import { paginateCursor } from "@/lib/db/pagination";

async function getUsersFeed(cursor?: string) {
  return paginateCursor(
    ({ cursor, take }) => db.user.findMany({
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
    }),
    { cursor, take: 20 }
  );
}
```

---

## 5. Transaction Helpers

### 5.1 Implementation (`src/lib/db/transactions.ts`)

```typescript
import { Prisma, PrismaClient } from "@prisma/client";
import type {
  TransactionOptions,
  TransactionCallback,
  TransientErrorCode,
} from "./types";

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_WAIT = 5000; // 5 seconds
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 100; // 100ms base delay

/**
 * Error codes that indicate transient failures worth retrying
 */
const TRANSIENT_ERROR_CODES: TransientErrorCode[] = [
  "P2034", // Transaction conflict (write conflict or deadlock)
  "P2028", // Transaction API error
  "P1017", // Server closed the connection
  "P1001", // Can't reach database server
  "P1002", // Database server timeout
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Checks if an error is a transient Prisma error that should be retried
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_ERROR_CODES.includes(error.code as TransientErrorCode);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true; // Connection errors are retryable
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Add jitter (random 0-50% of delay)
  const jitter = exponentialDelay * Math.random() * 0.5;

  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// MAIN TRANSACTION WRAPPER
// ============================================

/**
 * Executes a callback within a Prisma transaction with retry support
 *
 * @param prisma - Prisma client instance
 * @param callback - Function to execute within the transaction
 * @param options - Transaction options
 * @returns The result of the callback
 * @throws The last error if all retries fail
 *
 * @example
 * // Basic usage
 * const result = await withTransaction(db, async (tx) => {
 *   const user = await tx.user.create({ data: { email: 'test@example.com' } });
 *   const subscription = await tx.subscription.create({
 *     data: { userId: user.id, status: 'ACTIVE' }
 *   });
 *   return { user, subscription };
 * });
 *
 * @example
 * // With custom options
 * const result = await withTransaction(
 *   db,
 *   async (tx) => {
 *     // Critical operation
 *     await tx.user.update({ where: { id }, data: { balance: { decrement: 100 } } });
 *     await tx.transaction.create({ data: { userId: id, amount: -100 } });
 *   },
 *   {
 *     isolationLevel: 'Serializable',
 *     retries: 5,
 *     timeout: 30000,
 *   }
 * );
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    maxWait = DEFAULT_MAX_WAIT,
    timeout = DEFAULT_TIMEOUT,
    isolationLevel,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await prisma.$transaction(callback, {
        maxWait,
        timeout,
        isolationLevel,
      });

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const isRetryable = isTransientError(error);
      const hasRetriesLeft = attempt < retries;

      if (isRetryable && hasRetriesLeft) {
        const delay = calculateRetryDelay(attempt, retryDelay);
        console.warn(
          `Transaction failed with transient error (attempt ${attempt + 1}/${retries + 1}), ` +
          `retrying in ${Math.round(delay)}ms...`,
          { error: (error as Error).message }
        );
        await sleep(delay);
        continue;
      }

      // Non-retryable error or no retries left
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

// ============================================
// SPECIALIZED TRANSACTION HELPERS
// ============================================

/**
 * Execute a read-only transaction with Serializable isolation
 * Useful for consistent reads across multiple queries
 */
export async function withReadTransaction<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Omit<TransactionOptions, "isolationLevel"> = {}
): Promise<T> {
  return withTransaction(prisma, callback, {
    ...options,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

/**
 * Execute a transaction with ReadCommitted isolation
 * Good balance between consistency and performance
 */
export async function withReadCommittedTransaction<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Omit<TransactionOptions, "isolationLevel"> = {}
): Promise<T> {
  return withTransaction(prisma, callback, {
    ...options,
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  });
}

/**
 * Execute operations that must succeed together or all fail
 * Uses higher retry count and Serializable isolation
 */
export async function withCriticalTransaction<T>(
  prisma: PrismaClient,
  callback: TransactionCallback<T>,
  options: Omit<TransactionOptions, "isolationLevel" | "retries"> = {}
): Promise<T> {
  return withTransaction(prisma, callback, {
    ...options,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    retries: 5,
    timeout: 30000,
  });
}

// ============================================
// TRANSACTION CONTEXT HELPER
// ============================================

/**
 * Creates a transaction context that can be passed around
 * Useful for service-layer architecture
 */
export function createTransactionContext(prisma: PrismaClient) {
  return {
    /**
     * Run callback in transaction
     */
    run: <T>(callback: TransactionCallback<T>, options?: TransactionOptions) =>
      withTransaction(prisma, callback, options),

    /**
     * Run callback in read-only transaction
     */
    readOnly: <T>(callback: TransactionCallback<T>) =>
      withReadTransaction(prisma, callback),

    /**
     * Run critical operation in transaction
     */
    critical: <T>(callback: TransactionCallback<T>) =>
      withCriticalTransaction(prisma, callback),
  };
}

export type TransactionContext = ReturnType<typeof createTransactionContext>;
```

### 5.2 Usage Examples

```typescript
// Example 1: Basic transaction
import { withTransaction } from "@/lib/db/transactions";
import { db } from "@/lib/db";

async function createUserWithSubscription(email: string) {
  return withTransaction(db, async (tx) => {
    const user = await tx.user.create({
      data: { email, name: "New User" },
    });

    const subscription = await tx.subscription.create({
      data: {
        userId: user.id,
        status: "TRIALING",
        plan: "FREE",
      },
    });

    return { user, subscription };
  });
}

// Example 2: Critical financial transaction
import { withCriticalTransaction } from "@/lib/db/transactions";

async function processPayment(userId: string, amount: number) {
  return withCriticalTransaction(db, async (tx) => {
    // Deduct from user balance
    const user = await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    if (user.balance < 0) {
      throw new Error("Insufficient funds");
    }

    // Record transaction
    await tx.paymentTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: "DEBIT",
      },
    });

    return user;
  });
}

// Example 3: Using transaction context in service
import { createTransactionContext } from "@/lib/db/transactions";

class UserService {
  private txContext;

  constructor(prisma: PrismaClient) {
    this.txContext = createTransactionContext(prisma);
  }

  async deleteUserCompletely(userId: string) {
    return this.txContext.critical(async (tx) => {
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });
  }
}
```

---

## 6. Soft Delete Support

### 6.1 Schema Changes (`prisma/schema.prisma`)

Add `deletedAt` field to models that support soft delete:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(USER)

  // Soft delete field
  deletedAt     DateTime?

  accounts     Account[]
  sessions     Session[]
  subscription Subscription?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([deletedAt])  // Index for efficient soft delete queries
}

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  user                 User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  stripeCurrentPeriodEnd DateTime?
  status               SubscriptionStatus @default(INACTIVE)
  plan                 Plan               @default(FREE)

  // Soft delete field
  deletedAt            DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([stripeCustomerId])
  @@index([stripeSubscriptionId])
  @@index([deletedAt])  // Index for efficient soft delete queries
}
```

### 6.2 Soft Delete Extension (`src/lib/db/soft-delete.ts`)

```typescript
import { Prisma, PrismaClient } from "@prisma/client";
import type { SoftDeletableModel, SoftDeleteQueryOptions } from "./types";

// ============================================
// SOFT DELETE EXTENSION
// ============================================

/**
 * Creates a Prisma client extension that adds soft delete functionality
 *
 * Features:
 * - Automatically filters out soft-deleted records in queries
 * - Provides softDelete() method instead of delete()
 * - Provides restore() method to undelete records
 * - Allows querying deleted records when needed
 */
export function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    name: "softDelete",

    model: {
      // User model extensions
      user: {
        /**
         * Soft delete a user by setting deletedAt
         */
        async softDelete(
          this: { update: Function },
          where: Prisma.UserWhereUniqueInput
        ) {
          return this.update({
            where,
            data: { deletedAt: new Date() },
          });
        },

        /**
         * Restore a soft-deleted user
         */
        async restore(
          this: { update: Function },
          where: Prisma.UserWhereUniqueInput
        ) {
          return this.update({
            where,
            data: { deletedAt: null },
          });
        },

        /**
         * Find many users including or excluding deleted
         */
        async findManyWithDeleted(
          this: { findMany: Function },
          args: Prisma.UserFindManyArgs & SoftDeleteQueryOptions = {}
        ) {
          const { includeDeleted, onlyDeleted, ...rest } = args;

          let where = rest.where || {};

          if (onlyDeleted) {
            where = { ...where, deletedAt: { not: null } };
          } else if (!includeDeleted) {
            where = { ...where, deletedAt: null };
          }

          return this.findMany({ ...rest, where });
        },

        /**
         * Count users including or excluding deleted
         */
        async countWithDeleted(
          this: { count: Function },
          args: Prisma.UserCountArgs & SoftDeleteQueryOptions = {}
        ) {
          const { includeDeleted, onlyDeleted, ...rest } = args;

          let where = rest.where || {};

          if (onlyDeleted) {
            where = { ...where, deletedAt: { not: null } };
          } else if (!includeDeleted) {
            where = { ...where, deletedAt: null };
          }

          return this.count({ ...rest, where });
        },

        /**
         * Hard delete - actually remove from database
         */
        async hardDelete(
          this: { delete: Function },
          where: Prisma.UserWhereUniqueInput
        ) {
          return this.delete({ where });
        },
      },

      // Subscription model extensions
      subscription: {
        async softDelete(
          this: { update: Function },
          where: Prisma.SubscriptionWhereUniqueInput
        ) {
          return this.update({
            where,
            data: { deletedAt: new Date() },
          });
        },

        async restore(
          this: { update: Function },
          where: Prisma.SubscriptionWhereUniqueInput
        ) {
          return this.update({
            where,
            data: { deletedAt: null },
          });
        },

        async findManyWithDeleted(
          this: { findMany: Function },
          args: Prisma.SubscriptionFindManyArgs & SoftDeleteQueryOptions = {}
        ) {
          const { includeDeleted, onlyDeleted, ...rest } = args;

          let where = rest.where || {};

          if (onlyDeleted) {
            where = { ...where, deletedAt: { not: null } };
          } else if (!includeDeleted) {
            where = { ...where, deletedAt: null };
          }

          return this.findMany({ ...rest, where });
        },

        async countWithDeleted(
          this: { count: Function },
          args: Prisma.SubscriptionCountArgs & SoftDeleteQueryOptions = {}
        ) {
          const { includeDeleted, onlyDeleted, ...rest } = args;

          let where = rest.where || {};

          if (onlyDeleted) {
            where = { ...where, deletedAt: { not: null } };
          } else if (!includeDeleted) {
            where = { ...where, deletedAt: null };
          }

          return this.count({ ...rest, where });
        },

        async hardDelete(
          this: { delete: Function },
          where: Prisma.SubscriptionWhereUniqueInput
        ) {
          return this.delete({ where });
        },
      },
    },

    // Query extensions to automatically filter soft-deleted records
    query: {
      user: {
        async findMany({ args, query }) {
          // By default, exclude soft-deleted records
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findUnique({ args, query }) {
          // findUnique doesn't need filtering - explicit lookup
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
      },
      subscription: {
        async findMany({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
        async findUnique({ args, query }) {
          return query(args);
        },
        async count({ args, query }) {
          args.where = { ...args.where, deletedAt: null };
          return query(args);
        },
      },
    },
  });
}

// ============================================
// SOFT DELETE MIDDLEWARE (Alternative approach)
// ============================================

/**
 * Creates middleware for soft delete functionality
 * Use this if you need more control or compatibility
 */
export function createSoftDeleteMiddleware(): Prisma.Middleware {
  const softDeleteModels: SoftDeletableModel[] = ["User", "Subscription"];

  return async (params, next) => {
    const model = params.model as SoftDeletableModel | undefined;

    if (!model || !softDeleteModels.includes(model)) {
      return next(params);
    }

    // Intercept delete and turn into soft delete
    if (params.action === "delete") {
      params.action = "update";
      params.args.data = { deletedAt: new Date() };
      return next(params);
    }

    // Intercept deleteMany and turn into soft delete
    if (params.action === "deleteMany") {
      params.action = "updateMany";
      if (params.args.data !== undefined) {
        params.args.data.deletedAt = new Date();
      } else {
        params.args.data = { deletedAt: new Date() };
      }
      return next(params);
    }

    // Add default filter to exclude soft-deleted records
    if (["findFirst", "findMany", "count", "aggregate"].includes(params.action)) {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }

    return next(params);
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Add soft delete filter to existing where clause
 */
export function excludeDeleted<T extends { deletedAt?: unknown }>(
  where: T
): T & { deletedAt: null } {
  return { ...where, deletedAt: null };
}

/**
 * Add filter to only include deleted records
 */
export function onlyDeleted<T extends { deletedAt?: unknown }>(
  where: T
): T & { deletedAt: { not: null } } {
  return { ...where, deletedAt: { not: null } };
}

/**
 * Check if a record is soft-deleted
 */
export function isSoftDeleted(record: { deletedAt: Date | null }): boolean {
  return record.deletedAt !== null;
}
```

### 6.3 Extended Client (`src/lib/db/client.ts`)

```typescript
import { PrismaClient } from "@prisma/client";
import { createSoftDeleteExtension } from "./soft-delete";

/**
 * Create an extended Prisma client with soft delete support
 */
function createExtendedClient() {
  const baseClient = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Apply soft delete extension
  return baseClient.$extends(createSoftDeleteExtension());
}

// Type for the extended client
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

// Singleton pattern for extended client
const globalForPrisma = globalThis as unknown as {
  prismaExtended: ExtendedPrismaClient | undefined;
};

export const dbExtended: ExtendedPrismaClient =
  globalForPrisma.prismaExtended ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaExtended = dbExtended;
}
```

### 6.4 Updated Main Export (`src/lib/db/index.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

// Original client for backward compatibility
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Re-export utilities
export * from "./pagination";
export * from "./transactions";
export * from "./soft-delete";
export * from "./types";

// Export extended client
export { dbExtended, type ExtendedPrismaClient } from "./client";
```

---

## 7. Additional Indexes

### 7.1 Schema Index Additions

Add these indexes to `prisma/schema.prisma` for query optimization:

```prisma
model User {
  // ... existing fields ...

  @@index([email])                    // Existing
  @@index([deletedAt])                // For soft delete filtering
  @@index([createdAt])                // For sorting by creation date
  @@index([role])                     // For filtering by role
  @@index([emailVerified])            // For filtering verified users
  @@index([role, emailVerified])      // Composite for common query patterns
}

model Account {
  // ... existing fields ...

  @@id([provider, providerAccountId])  // Existing composite primary key
  @@index([userId])                    // Existing
}

model Session {
  // ... existing fields ...

  @@index([userId])                    // Existing
  @@index([expires])                   // For session cleanup queries
  @@index([userId, expires])           // Composite for active session queries
}

model Subscription {
  // ... existing fields ...

  @@index([stripeCustomerId])          // Existing
  @@index([stripeSubscriptionId])      // Existing
  @@index([deletedAt])                 // For soft delete filtering
  @@index([status])                    // For filtering by status
  @@index([plan])                      // For filtering by plan
  @@index([status, plan])              // Composite for common queries
  @@index([stripeCurrentPeriodEnd])    // For expiration queries
}

model PasswordResetToken {
  // ... existing fields ...

  @@index([email])                     // For lookup by email
  @@index([token])                     // For token validation
  @@index([expires])                   // For cleanup of expired tokens
}

model VerificationToken {
  // ... existing fields ...

  @@id([identifier, token])            // Existing composite primary key
  @@index([expires])                   // For cleanup of expired tokens
}
```

### 7.2 Index Rationale

| Index | Purpose | Common Query Pattern |
|-------|---------|---------------------|
| `User.deletedAt` | Soft delete filtering | `WHERE deletedAt IS NULL` |
| `User.createdAt` | Pagination ordering | `ORDER BY createdAt DESC` |
| `User.role` | Role-based filtering | `WHERE role = 'ADMIN'` |
| `User.emailVerified` | Verification filtering | `WHERE emailVerified IS NOT NULL` |
| `Session.expires` | Session cleanup | `WHERE expires < NOW()` |
| `Subscription.status` | Status filtering | `WHERE status = 'ACTIVE'` |
| `Subscription.plan` | Plan filtering | `WHERE plan = 'PLUS'` |

---

## 8. Enhanced Seeds

### 8.1 Seed Utilities (`prisma/seeds/utils.ts`)

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// ============================================
// PASSWORD UTILITIES
// ============================================

/**
 * Hash a password for seeding
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ============================================
// UNIQUE ID UTILITIES
// ============================================

/**
 * Generate a unique email for testing
 */
export function uniqueEmail(prefix: string = "user"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}@test.local`;
}

/**
 * Generate a unique Stripe customer ID for testing
 */
export function uniqueStripeCustomerId(): string {
  return `cus_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generate a unique Stripe subscription ID for testing
 */
export function uniqueStripeSubscriptionId(): string {
  return `sub_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get a date in the past
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Get a date in the future
 */
export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Clean up all seeded test data
 */
export async function cleanupTestData(prisma: PrismaClient): Promise<void> {
  // Delete in order respecting foreign keys
  await prisma.subscription.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.account.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: "@test.local" } },
  });
  await prisma.verificationToken.deleteMany({
    where: { identifier: { contains: "@test.local" } },
  });
  await prisma.passwordResetToken.deleteMany({
    where: { email: { contains: "@test.local" } },
  });
}

/**
 * Clean up all data (use with caution!)
 */
export async function cleanupAllData(prisma: PrismaClient): Promise<void> {
  await prisma.subscription.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.user.deleteMany({});
}

// ============================================
// BATCH CREATION UTILITIES
// ============================================

/**
 * Create multiple records with progress logging
 */
export async function batchCreate<T>(
  label: string,
  count: number,
  createFn: (index: number) => Promise<T>
): Promise<T[]> {
  console.log(`  Creating ${count} ${label}...`);

  const results: T[] = [];
  for (let i = 0; i < count; i++) {
    results.push(await createFn(i));

    // Log progress every 10 items
    if ((i + 1) % 10 === 0) {
      console.log(`    ${i + 1}/${count} created`);
    }
  }

  console.log(`  ✓ ${count} ${label} created`);
  return results;
}
```

### 8.2 Enhanced Base Seed (`prisma/seeds/base.ts`)

```typescript
import { type PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils";

export async function seedBase(prisma: PrismaClient) {
  console.log("  Creating base data...");

  // Create system admin user (if not exists)
  const adminEmail = "admin@system.local";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPassword = await hashPassword(
      process.env.ADMIN_PASSWORD || "Admin123!"
    );
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "System Administrator",
        password: adminPassword,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log("    ✓ System admin created");
  } else {
    console.log("    - System admin already exists");
  }

  console.log("  ✓ Base data created");
}
```

### 8.3 Enhanced Demo Seed (`prisma/seeds/demo.ts`)

```typescript
import { Plan, PrismaClient, Role, SubscriptionStatus } from "@prisma/client";
import {
  hashPassword,
  daysAgo,
  daysFromNow,
  uniqueStripeCustomerId,
  uniqueStripeSubscriptionId,
} from "./utils";

const prisma = new PrismaClient();

async function seedDemo() {
  console.log("🎭 Seeding demo data...");

  // ============================================
  // DEMO USERS
  // ============================================

  // Free tier user
  const freePassword = await hashPassword("free123!");
  const freeUser = await prisma.user.upsert({
    where: { email: "free@demo.local" },
    update: {},
    create: {
      email: "free@demo.local",
      name: "Free User",
      password: freePassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          plan: Plan.FREE,
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Free user created:", freeUser.email);

  // Pro tier user
  const proPassword = await hashPassword("pro123!");
  const proUser = await prisma.user.upsert({
    where: { email: "pro@demo.local" },
    update: {},
    create: {
      email: "pro@demo.local",
      name: "Pro User",
      password: proPassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          plan: Plan.PLUS,
          stripeCustomerId: uniqueStripeCustomerId(),
          stripeSubscriptionId: uniqueStripeSubscriptionId(),
          stripeCurrentPeriodEnd: daysFromNow(30),
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Pro user created:", proUser.email);

  // Enterprise user
  const enterprisePassword = await hashPassword("enterprise123!");
  const enterpriseUser = await prisma.user.upsert({
    where: { email: "enterprise@demo.local" },
    update: {},
    create: {
      email: "enterprise@demo.local",
      name: "Enterprise User",
      password: enterprisePassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          plan: Plan.PRO,
          stripeCustomerId: uniqueStripeCustomerId(),
          stripeSubscriptionId: uniqueStripeSubscriptionId(),
          stripeCurrentPeriodEnd: daysFromNow(365),
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Enterprise user created:", enterpriseUser.email);

  // Past due user
  const pastDuePassword = await hashPassword("pastdue123!");
  const pastDueUser = await prisma.user.upsert({
    where: { email: "pastdue@demo.local" },
    update: {},
    create: {
      email: "pastdue@demo.local",
      name: "Past Due User",
      password: pastDuePassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.PAST_DUE,
          plan: Plan.PLUS,
          stripeCustomerId: uniqueStripeCustomerId(),
          stripeSubscriptionId: uniqueStripeSubscriptionId(),
          stripeCurrentPeriodEnd: daysAgo(5),
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Past due user created:", pastDueUser.email);

  // Trialing user
  const trialPassword = await hashPassword("trial123!");
  const trialUser = await prisma.user.upsert({
    where: { email: "trial@demo.local" },
    update: {},
    create: {
      email: "trial@demo.local",
      name: "Trial User",
      password: trialPassword,
      role: Role.USER,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.TRIALING,
          plan: Plan.PLUS,
          stripeCustomerId: uniqueStripeCustomerId(),
          stripeSubscriptionId: uniqueStripeSubscriptionId(),
          stripeCurrentPeriodEnd: daysFromNow(14),
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Trial user created:", trialUser.email);

  // Unverified user
  const unverifiedPassword = await hashPassword("unverified123!");
  const unverifiedUser = await prisma.user.upsert({
    where: { email: "unverified@demo.local" },
    update: {},
    create: {
      email: "unverified@demo.local",
      name: "Unverified User",
      password: unverifiedPassword,
      role: Role.USER,
      emailVerified: null, // Not verified
    },
  });
  console.log("  ✓ Unverified user created:", unverifiedUser.email);

  // Admin user
  const adminPassword = await hashPassword("admin123!");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: {
      email: "admin@demo.local",
      name: "Demo Admin",
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      subscription: {
        create: {
          status: SubscriptionStatus.ACTIVE,
          plan: Plan.PRO,
        },
      },
    },
    include: { subscription: true },
  });
  console.log("  ✓ Admin user created:", adminUser.email);

  // ============================================
  // SUMMARY
  // ============================================

  console.log("✅ Demo seeding complete!");
  console.log("");
  console.log("  Demo accounts:");
  console.log("  📧 free@demo.local / free123! (Free plan)");
  console.log("  📧 pro@demo.local / pro123! (Plus plan)");
  console.log("  📧 enterprise@demo.local / enterprise123! (Pro plan)");
  console.log("  📧 pastdue@demo.local / pastdue123! (Past due)");
  console.log("  📧 trial@demo.local / trial123! (Trialing)");
  console.log("  📧 unverified@demo.local / unverified123! (Email not verified)");
  console.log("  📧 admin@demo.local / admin123! (Admin)");
}

seedDemo()
  .catch((e) => {
    console.error("❌ Demo seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 8.4 Test Seed (`prisma/seeds/test.ts`)

```typescript
import { Plan, PrismaClient, Role, SubscriptionStatus } from "@prisma/client";
import {
  hashPassword,
  uniqueEmail,
  daysFromNow,
  cleanupTestData,
  batchCreate,
} from "./utils";

const prisma = new PrismaClient();

/**
 * Seed data specifically for testing
 * Creates predictable test data that can be used in integration tests
 */
async function seedTest() {
  console.log("🧪 Seeding test data...");

  // Clean up any existing test data
  await cleanupTestData(prisma);

  // ============================================
  // PAGINATION TEST DATA
  // ============================================

  // Create 50 users for pagination testing
  const paginationUsers = await batchCreate(
    "pagination test users",
    50,
    async (i) => {
      return prisma.user.create({
        data: {
          email: `pagination-${i}@test.local`,
          name: `Pagination User ${i}`,
          password: await hashPassword("test123!"),
          role: Role.USER,
          emailVerified: new Date(),
        },
      });
    }
  );

  // ============================================
  // ROLE TEST DATA
  // ============================================

  // Create users with different roles
  const adminUser = await prisma.user.create({
    data: {
      email: "role-admin@test.local",
      name: "Role Test Admin",
      password: await hashPassword("test123!"),
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log("  ✓ Role test admin created");

  const regularUser = await prisma.user.create({
    data: {
      email: "role-user@test.local",
      name: "Role Test User",
      password: await hashPassword("test123!"),
      role: Role.USER,
      emailVerified: new Date(),
    },
  });
  console.log("  ✓ Role test user created");

  // ============================================
  // SUBSCRIPTION TEST DATA
  // ============================================

  // Create users with different subscription states
  const subscriptionStates: Array<{
    suffix: string;
    status: SubscriptionStatus;
    plan: Plan;
  }> = [
    { suffix: "active-free", status: SubscriptionStatus.ACTIVE, plan: Plan.FREE },
    { suffix: "active-pro", status: SubscriptionStatus.ACTIVE, plan: Plan.PLUS },
    { suffix: "active-enterprise", status: SubscriptionStatus.ACTIVE, plan: Plan.PRO },
    { suffix: "inactive", status: SubscriptionStatus.INACTIVE, plan: Plan.FREE },
    { suffix: "past-due", status: SubscriptionStatus.PAST_DUE, plan: Plan.PLUS },
    { suffix: "canceled", status: SubscriptionStatus.CANCELED, plan: Plan.PLUS },
    { suffix: "trialing", status: SubscriptionStatus.TRIALING, plan: Plan.PLUS },
  ];

  for (const { suffix, status, plan } of subscriptionStates) {
    await prisma.user.create({
      data: {
        email: `sub-${suffix}@test.local`,
        name: `Subscription Test ${suffix}`,
        password: await hashPassword("test123!"),
        role: Role.USER,
        emailVerified: new Date(),
        subscription: {
          create: {
            status,
            plan,
            stripeCurrentPeriodEnd: daysFromNow(30),
          },
        },
      },
    });
  }
  console.log("  ✓ Subscription test users created");

  // ============================================
  // SOFT DELETE TEST DATA
  // ============================================

  // Create a user that will be soft-deleted
  const softDeleteUser = await prisma.user.create({
    data: {
      email: "soft-deleted@test.local",
      name: "Soft Deleted User",
      password: await hashPassword("test123!"),
      role: Role.USER,
      emailVerified: new Date(),
      deletedAt: new Date(), // Already soft-deleted
    },
  });
  console.log("  ✓ Soft delete test user created");

  // ============================================
  // SUMMARY
  // ============================================

  console.log("✅ Test seeding complete!");
  console.log(`  Total users created: ${50 + 2 + 7 + 1}`);
}

seedTest()
  .catch((e) => {
    console.error("❌ Test seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 8.5 Updated Seed Orchestrator (`prisma/seeds/index.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

import { seedBase } from "./base";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");
  console.log("");

  // Always run base seed
  await seedBase(prisma);

  // Check for environment-specific seeding
  const seedEnv = process.env.SEED_ENV || "base";

  if (seedEnv === "demo") {
    // Demo seed is run separately via db:seed:demo
    console.log("  ℹ️  Run 'pnpm db:seed:demo' for demo data");
  } else if (seedEnv === "test") {
    // Test seed is run separately via db:seed:test
    console.log("  ℹ️  Run 'pnpm db:seed:test' for test data");
  }

  console.log("");
  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 9. Test Fixtures

### 9.1 User Fixture (`tests/fixtures/user.fixture.ts`)

```typescript
import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { CreateUserInput, FactoryResult, BatchFactoryResult } from "@/lib/db/types";

// Default test password (pre-hashed for speed)
let cachedPasswordHash: string | null = null;

async function getDefaultPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await bcrypt.hash("Test123!", 10);
  }
  return cachedPasswordHash;
}

/**
 * Generate a unique test email
 */
function generateTestEmail(prefix: string = "user"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
}

/**
 * Create a single test user
 */
export async function createTestUser(
  prisma: PrismaClient,
  input: CreateUserInput = {}
): Promise<FactoryResult<User>> {
  const email = input.email ?? generateTestEmail();
  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 10)
    : await getDefaultPasswordHash();

  const user = await prisma.user.create({
    data: {
      email,
      name: input.name ?? "Test User",
      password: passwordHash,
      role: input.role ?? Role.USER,
      emailVerified: input.emailVerified !== false ? new Date() : null,
    },
  });

  return {
    data: user,
    cleanup: async () => {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    },
  };
}

/**
 * Create multiple test users
 */
export async function createTestUsers(
  prisma: PrismaClient,
  count: number,
  input: CreateUserInput = {}
): Promise<BatchFactoryResult<User>> {
  const users: User[] = [];

  for (let i = 0; i < count; i++) {
    const result = await createTestUser(prisma, {
      ...input,
      email: input.email ? `${i}-${input.email}` : undefined,
      name: input.name ? `${input.name} ${i}` : `Test User ${i}`,
    });
    users.push(result.data);
  }

  return {
    data: users,
    cleanup: async () => {
      await prisma.user.deleteMany({
        where: { id: { in: users.map((u) => u.id) } },
      });
    },
  };
}

/**
 * Create an admin user
 */
export async function createTestAdmin(
  prisma: PrismaClient,
  input: Omit<CreateUserInput, "role"> = {}
): Promise<FactoryResult<User>> {
  return createTestUser(prisma, { ...input, role: Role.ADMIN });
}

/**
 * Create an unverified user
 */
export async function createUnverifiedUser(
  prisma: PrismaClient,
  input: Omit<CreateUserInput, "emailVerified"> = {}
): Promise<FactoryResult<User>> {
  return createTestUser(prisma, { ...input, emailVerified: false });
}

/**
 * User factory builder for more complex scenarios
 */
export function userFactory(prisma: PrismaClient) {
  const defaults: CreateUserInput = {};

  return {
    withEmail(email: string) {
      defaults.email = email;
      return this;
    },
    withName(name: string) {
      defaults.name = name;
      return this;
    },
    withPassword(password: string) {
      defaults.password = password;
      return this;
    },
    asAdmin() {
      defaults.role = Role.ADMIN;
      return this;
    },
    unverified() {
      defaults.emailVerified = false;
      return this;
    },
    async create(): Promise<FactoryResult<User>> {
      return createTestUser(prisma, defaults);
    },
    async createMany(count: number): Promise<BatchFactoryResult<User>> {
      return createTestUsers(prisma, count, defaults);
    },
  };
}
```

### 9.2 Subscription Fixture (`tests/fixtures/subscription.fixture.ts`)

```typescript
import { Plan, PrismaClient, Subscription, SubscriptionStatus } from "@prisma/client";
import type { CreateSubscriptionInput, FactoryResult } from "@/lib/db/types";

/**
 * Generate unique Stripe IDs for testing
 */
function generateStripeCustomerId(): string {
  return `cus_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function generateStripeSubscriptionId(): string {
  return `sub_test_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Create a test subscription
 */
export async function createTestSubscription(
  prisma: PrismaClient,
  input: CreateSubscriptionInput
): Promise<FactoryResult<Subscription>> {
  const subscription = await prisma.subscription.create({
    data: {
      userId: input.userId,
      status: input.status ?? SubscriptionStatus.ACTIVE,
      plan: input.plan ?? Plan.FREE,
      stripeCustomerId: input.stripeCustomerId ?? generateStripeCustomerId(),
      stripeSubscriptionId: input.stripeSubscriptionId ?? generateStripeSubscriptionId(),
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return {
    data: subscription,
    cleanup: async () => {
      await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => {});
    },
  };
}

/**
 * Create a free tier subscription
 */
export async function createFreeSubscription(
  prisma: PrismaClient,
  userId: string
): Promise<FactoryResult<Subscription>> {
  return createTestSubscription(prisma, {
    userId,
    status: SubscriptionStatus.ACTIVE,
    plan: Plan.FREE,
  });
}

/**
 * Create a pro subscription
 */
export async function createProSubscription(
  prisma: PrismaClient,
  userId: string
): Promise<FactoryResult<Subscription>> {
  return createTestSubscription(prisma, {
    userId,
    status: SubscriptionStatus.ACTIVE,
    plan: Plan.PLUS,
  });
}

/**
 * Create an enterprise subscription
 */
export async function createEnterpriseSubscription(
  prisma: PrismaClient,
  userId: string
): Promise<FactoryResult<Subscription>> {
  return createTestSubscription(prisma, {
    userId,
    status: SubscriptionStatus.ACTIVE,
    plan: Plan.PRO,
  });
}

/**
 * Subscription factory builder
 */
export function subscriptionFactory(prisma: PrismaClient, userId: string) {
  const defaults: CreateSubscriptionInput = { userId };

  return {
    withStatus(status: SubscriptionStatus) {
      defaults.status = status;
      return this;
    },
    withPlan(plan: Plan) {
      defaults.plan = plan;
      return this;
    },
    withStripeIds(customerId: string, subscriptionId: string) {
      defaults.stripeCustomerId = customerId;
      defaults.stripeSubscriptionId = subscriptionId;
      return this;
    },
    asFree() {
      defaults.plan = Plan.FREE;
      return this;
    },
    asPro() {
      defaults.plan = Plan.PLUS;
      return this;
    },
    asEnterprise() {
      defaults.plan = Plan.PRO;
      return this;
    },
    async create(): Promise<FactoryResult<Subscription>> {
      return createTestSubscription(prisma, defaults);
    },
  };
}
```

### 9.3 Test Helpers (`tests/fixtures/helpers.ts`)

```typescript
import { PrismaClient } from "@prisma/client";

/**
 * Create a test database client
 */
export function createTestPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

/**
 * Clean up all test data (run after tests)
 */
export async function cleanupTestData(prisma: PrismaClient): Promise<void> {
  // Delete in order respecting foreign keys
  await prisma.subscription.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.session.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.account.deleteMany({
    where: { user: { email: { contains: "@test.local" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: "@test.local" } },
  });
}

/**
 * Transaction wrapper for tests - rolls back after test
 */
export async function withRollback<T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  let result: T;

  try {
    // Start a transaction
    await prisma.$executeRaw`BEGIN`;

    result = await callback(prisma);

    // Always rollback in tests
    await prisma.$executeRaw`ROLLBACK`;
  } catch (error) {
    await prisma.$executeRaw`ROLLBACK`;
    throw error;
  }

  return result;
}

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
```

### 9.4 Main Fixtures Export (`tests/fixtures/index.ts`)

```typescript
// User fixtures
export {
  createTestUser,
  createTestUsers,
  createTestAdmin,
  createUnverifiedUser,
  userFactory,
} from "./user.fixture";

// Subscription fixtures
export {
  createTestSubscription,
  createFreeSubscription,
  createProSubscription,
  createEnterpriseSubscription,
  subscriptionFactory,
} from "./subscription.fixture";

// Helpers
export {
  createTestPrismaClient,
  cleanupTestData,
  withRollback,
  waitFor,
} from "./helpers";
```

---

## 10. Integration Points

### 10.1 Using Pagination in API Routes

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, paginateModel } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10);

  const result = await paginateModel(
    db.user,
    {
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { subscription: true },
    },
    { page, pageSize, maxPageSize: 50 }
  );

  return NextResponse.json(result);
}
```

### 10.2 Using Transactions in Server Actions

```typescript
// src/actions/subscription/upgrade.ts
"use server";

import { db, withTransaction } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function upgradeSubscription(plan: "PLUS" | "PRO") {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const result = await withTransaction(db, async (tx) => {
      // Update subscription
      const subscription = await tx.subscription.update({
        where: { userId: session.user.id },
        data: { plan, status: "ACTIVE" },
      });

      // Log the upgrade
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SUBSCRIPTION_UPGRADE",
          metadata: { plan },
        },
      });

      return subscription;
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: "Failed to upgrade subscription" };
  }
}
```

### 10.3 Using Soft Delete in Services

```typescript
// src/lib/services/user.service.ts
import { dbExtended } from "@/lib/db";

export class UserService {
  async deleteUser(userId: string) {
    // Soft delete the user
    await dbExtended.user.softDelete({ id: userId });
  }

  async restoreUser(userId: string) {
    // Restore soft-deleted user
    await dbExtended.user.restore({ id: userId });
  }

  async getDeletedUsers() {
    // Get only soft-deleted users
    return dbExtended.user.findManyWithDeleted({ onlyDeleted: true });
  }

  async getAllUsersIncludingDeleted() {
    // Get all users including soft-deleted
    return dbExtended.user.findManyWithDeleted({ includeDeleted: true });
  }

  async permanentlyDeleteUser(userId: string) {
    // Hard delete - actually remove from database
    await dbExtended.user.hardDelete({ id: userId });
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

#### Pagination Tests (`tests/unit/lib/db/pagination.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import {
  normalizePagination,
  createPaginationMeta,
  getPageForIndex,
  getPageRange,
} from "@/lib/db/pagination";

describe("normalizePagination", () => {
  it("returns defaults when no input provided", () => {
    const result = normalizePagination();
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      skip: 0,
      take: 20,
    });
  });

  it("calculates skip correctly for page 2", () => {
    const result = normalizePagination({ page: 2, pageSize: 10 });
    expect(result.skip).toBe(10);
  });

  it("clamps page to minimum of 1", () => {
    const result = normalizePagination({ page: 0 });
    expect(result.page).toBe(1);
  });

  it("clamps page to minimum of 1 for negative values", () => {
    const result = normalizePagination({ page: -5 });
    expect(result.page).toBe(1);
  });

  it("clamps pageSize to maxPageSize", () => {
    const result = normalizePagination({ pageSize: 200, maxPageSize: 50 });
    expect(result.pageSize).toBe(50);
  });

  it("floors decimal page numbers", () => {
    const result = normalizePagination({ page: 2.7 });
    expect(result.page).toBe(2);
  });
});

describe("createPaginationMeta", () => {
  it("calculates totalPages correctly", () => {
    const meta = createPaginationMeta(100, {
      page: 1,
      pageSize: 10,
      skip: 0,
      take: 10,
    });
    expect(meta.totalPages).toBe(10);
  });

  it("rounds up totalPages for partial pages", () => {
    const meta = createPaginationMeta(25, {
      page: 1,
      pageSize: 10,
      skip: 0,
      take: 10,
    });
    expect(meta.totalPages).toBe(3);
  });

  it("correctly identifies hasNextPage", () => {
    const meta = createPaginationMeta(30, {
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
    expect(meta.hasNextPage).toBe(true);

    const metaLastPage = createPaginationMeta(30, {
      page: 3,
      pageSize: 10,
      skip: 20,
      take: 10,
    });
    expect(metaLastPage.hasNextPage).toBe(false);
  });

  it("correctly identifies hasPreviousPage", () => {
    const meta = createPaginationMeta(30, {
      page: 1,
      pageSize: 10,
      skip: 0,
      take: 10,
    });
    expect(meta.hasPreviousPage).toBe(false);

    const metaPage2 = createPaginationMeta(30, {
      page: 2,
      pageSize: 10,
      skip: 10,
      take: 10,
    });
    expect(metaPage2.hasPreviousPage).toBe(true);
  });
});

describe("getPageForIndex", () => {
  it("returns 1 for index 0", () => {
    expect(getPageForIndex(0, 10)).toBe(1);
  });

  it("returns correct page for various indexes", () => {
    expect(getPageForIndex(9, 10)).toBe(1);
    expect(getPageForIndex(10, 10)).toBe(2);
    expect(getPageForIndex(25, 10)).toBe(3);
  });
});

describe("getPageRange", () => {
  it("returns all pages when totalPages <= maxVisible", () => {
    expect(getPageRange(1, 3, 5)).toEqual([1, 2, 3]);
  });

  it("includes ellipsis for large page counts", () => {
    const range = getPageRange(5, 20, 5);
    expect(range).toContain("...");
  });

  it("shows first and last pages with ellipsis in between", () => {
    const range = getPageRange(10, 20, 5);
    expect(range[0]).toBe(1);
    expect(range[range.length - 1]).toBe(20);
  });
});
```

#### Transaction Tests (`tests/unit/lib/db/transactions.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import {
  isTransientError,
  calculateRetryDelay,
} from "@/lib/db/transactions";

describe("isTransientError", () => {
  it("returns true for P2034 (transaction conflict)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("conflict", {
      code: "P2034",
      clientVersion: "5.0.0",
    });
    expect(isTransientError(error)).toBe(true);
  });

  it("returns true for P1001 (can't reach server)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("unreachable", {
      code: "P1001",
      clientVersion: "5.0.0",
    });
    expect(isTransientError(error)).toBe(true);
  });

  it("returns false for P2002 (unique constraint)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("unique", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    expect(isTransientError(error)).toBe(false);
  });

  it("returns false for regular errors", () => {
    expect(isTransientError(new Error("generic error"))).toBe(false);
  });

  it("returns true for PrismaClientInitializationError", () => {
    const error = new Prisma.PrismaClientInitializationError("init error", "5.0.0");
    expect(isTransientError(error)).toBe(true);
  });
});

describe("calculateRetryDelay", () => {
  it("returns base delay for attempt 0", () => {
    const delay = calculateRetryDelay(0, 100);
    expect(delay).toBeGreaterThanOrEqual(100);
    expect(delay).toBeLessThanOrEqual(150); // 100 + 50% jitter
  });

  it("increases delay exponentially", () => {
    const delay0 = calculateRetryDelay(0, 100);
    const delay1 = calculateRetryDelay(1, 100);
    const delay2 = calculateRetryDelay(2, 100);

    // delay1 should be roughly 2x delay0
    expect(delay1).toBeGreaterThan(delay0);
    expect(delay2).toBeGreaterThan(delay1);
  });

  it("caps delay at 30 seconds", () => {
    const delay = calculateRetryDelay(20, 1000); // Would be huge without cap
    expect(delay).toBeLessThanOrEqual(30000);
  });
});
```

#### Soft Delete Tests (`tests/unit/lib/db/soft-delete.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import {
  excludeDeleted,
  onlyDeleted,
  isSoftDeleted,
} from "@/lib/db/soft-delete";

describe("excludeDeleted", () => {
  it("adds deletedAt: null to where clause", () => {
    const where = { email: "test@example.com" };
    const result = excludeDeleted(where);
    expect(result).toEqual({
      email: "test@example.com",
      deletedAt: null,
    });
  });

  it("works with empty where clause", () => {
    const result = excludeDeleted({});
    expect(result).toEqual({ deletedAt: null });
  });
});

describe("onlyDeleted", () => {
  it("adds filter for only deleted records", () => {
    const where = { role: "USER" };
    const result = onlyDeleted(where);
    expect(result).toEqual({
      role: "USER",
      deletedAt: { not: null },
    });
  });
});

describe("isSoftDeleted", () => {
  it("returns true when deletedAt is set", () => {
    expect(isSoftDeleted({ deletedAt: new Date() })).toBe(true);
  });

  it("returns false when deletedAt is null", () => {
    expect(isSoftDeleted({ deletedAt: null })).toBe(false);
  });
});
```

### 11.2 Integration Tests

Integration tests require a test database. Create `tests/integration/db/pagination.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { paginate, paginateModel } from "@/lib/db/pagination";
import { createTestUsers, cleanupTestData } from "@/tests/fixtures";

describe("Pagination Integration", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    // Create 50 test users
    await createTestUsers(prisma, 50);
  });

  afterAll(async () => {
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  it("paginates users correctly", async () => {
    const result = await paginateModel(
      prisma.user,
      { where: { email: { contains: "@test.local" } } },
      { page: 1, pageSize: 10 }
    );

    expect(result.items).toHaveLength(10);
    expect(result.meta.total).toBe(50);
    expect(result.meta.totalPages).toBe(5);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
  });

  it("returns correct page", async () => {
    const page1 = await paginateModel(
      prisma.user,
      { where: { email: { contains: "@test.local" } } },
      { page: 1, pageSize: 10 }
    );

    const page2 = await paginateModel(
      prisma.user,
      { where: { email: { contains: "@test.local" } } },
      { page: 2, pageSize: 10 }
    );

    // Ensure different items on different pages
    const page1Ids = page1.items.map((u) => u.id);
    const page2Ids = page2.items.map((u) => u.id);
    expect(page1Ids).not.toEqual(page2Ids);
  });
});
```

### 11.3 Test Configuration Updates

Update `vitest.config.ts` to include integration tests:

```typescript
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
        "prisma/seeds/**",
      ],
    },
    // Separate pools for unit and integration tests
    poolOptions: {
      threads: {
        singleThread: true, // For database tests
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/tests": resolve(__dirname, "./tests"),
    },
  },
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run tests/unit",
    "test:watch": "vitest watch tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:all": "vitest run",
    "test:coverage": "vitest run --coverage",
    "db:seed:test": "tsx prisma/seeds/test.ts"
  }
}
```

---

## 12. Implementation Checklist

### Phase 1: Type Definitions (Priority: High)
- [ ] Create `src/lib/db/types.ts` with all type definitions
- [ ] Update `src/types/index.ts` with re-exports
- [ ] Ensure backward compatibility with existing types

### Phase 2: Pagination Helpers (Priority: High)
- [ ] Implement `src/lib/db/pagination.ts`
- [ ] Write unit tests for pagination functions
- [ ] Write integration tests with actual database

### Phase 3: Transaction Helpers (Priority: High)
- [ ] Implement `src/lib/db/transactions.ts`
- [ ] Write unit tests for helper functions
- [ ] Write integration tests for retry logic

### Phase 4: Soft Delete Support (Priority: Medium)
- [ ] Add `deletedAt` field to User and Subscription models
- [ ] Create migration for schema changes
- [ ] Implement `src/lib/db/soft-delete.ts`
- [ ] Create extended client in `src/lib/db/client.ts`
- [ ] Update `src/lib/db/index.ts` exports
- [ ] Write unit and integration tests

### Phase 5: Additional Indexes (Priority: Medium)
- [ ] Add performance indexes to schema
- [ ] Create and apply migration
- [ ] Verify query performance improvements

### Phase 6: Enhanced Seeds (Priority: Medium)
- [ ] Create `prisma/seeds/utils.ts`
- [ ] Update `prisma/seeds/base.ts`
- [ ] Update `prisma/seeds/demo.ts`
- [ ] Create `prisma/seeds/test.ts`
- [ ] Update `prisma/seeds/index.ts`
- [ ] Add new npm scripts for seeding

### Phase 7: Test Fixtures (Priority: Medium)
- [ ] Create `tests/fixtures/user.fixture.ts`
- [ ] Create `tests/fixtures/subscription.fixture.ts`
- [ ] Create `tests/fixtures/helpers.ts`
- [ ] Create `tests/fixtures/index.ts`
- [ ] Update `tests/setup.ts` as needed
- [ ] Update `vitest.config.ts` with new paths

### Phase 8: Documentation & Review (Priority: Low)
- [ ] Add JSDoc comments to all public functions
- [ ] Create usage examples in comments
- [ ] Review and test all integrations
- [ ] Performance testing for pagination and transactions

---

## Appendix A: Migration Commands

```bash
# Create migration for soft delete fields
pnpm prisma migrate dev --name add_soft_delete_fields

# Create migration for additional indexes
pnpm prisma migrate dev --name add_performance_indexes

# Generate Prisma client after schema changes
pnpm prisma generate

# Seed the database
pnpm db:seed           # Base seed
pnpm db:seed:demo      # Demo data
pnpm db:seed:test      # Test data
```

---

## Appendix B: Environment Variables

No additional environment variables are required for these utilities. They use the existing `DATABASE_URL` configuration.

---

**Document End**

This technical architecture document provides a complete blueprint for implementing Epic 3 Database utilities. Developers can use this as a definitive reference for TDD implementation.
