/**
 * Cursor-based pagination utilities
 *
 * Provides efficient pagination using cursors instead of offset/skip.
 * This is more performant for large datasets as it doesn't require
 * scanning through skipped rows.
 */

export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

/**
 * Encode a database ID to a cursor string
 */
export function encodeCursor(id: string): string {
  return Buffer.from(id).toString("base64");
}

/**
 * Decode a cursor string back to a database ID
 * Returns null if the cursor is invalid
 */
export function decodeCursor(cursor: string | undefined | null): string | null {
  if (!cursor || cursor.trim() === "") {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString();
    // Check if decoding produced a valid non-empty string
    if (!decoded || decoded.trim() === "") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export interface CursorPaginationInput {
  cursor?: string | null;
  limit?: number;
  direction?: "next" | "prev";
}

export interface NormalizedCursorParams {
  cursor: string | null;
  limit: number;
  direction: "next" | "prev";
}

/**
 * Normalize and validate cursor pagination parameters
 */
export function normalizeCursorParams(
  params: CursorPaginationInput
): NormalizedCursorParams {
  const limit = Math.min(
    Math.max(params.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  return {
    cursor: decodeCursor(params.cursor),
    limit,
    direction: params.direction ?? "next",
  };
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}

/**
 * Create a cursor pagination result from fetched items
 *
 * The items array should be fetched with `take: limit + 1` to determine
 * if there are more pages. This function will:
 * - Remove the extra item if present
 * - Calculate hasNextPage
 * - Encode the next cursor from the last visible item
 *
 * @param items - Items fetched with limit + 1
 * @param limit - The requested limit
 * @param getItemId - Function to extract ID from an item
 * @param currentCursor - The cursor used for this query (to determine hasPreviousPage)
 */
export function createCursorResult<T>(
  items: T[],
  limit: number,
  getItemId: (item: T) => string,
  currentCursor?: string | null
): CursorPaginationResult<T> {
  // Check if we have more items than requested
  const hasNextPage = items.length > limit;

  // Remove the extra item if present
  const visibleItems = hasNextPage ? items.slice(0, limit) : items;

  // Get the cursor for the next page (last visible item's ID)
  const lastItem = visibleItems[visibleItems.length - 1];
  const nextCursor =
    hasNextPage && lastItem ? encodeCursor(getItemId(lastItem)) : null;

  return {
    items: visibleItems,
    nextCursor,
    hasNextPage,
    hasPreviousPage: Boolean(currentCursor),
    limit,
  };
}
