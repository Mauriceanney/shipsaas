/**
 * Soft delete utilities for Prisma
 */

// Models that support soft delete
export const SOFT_DELETABLE_MODELS = ["User", "Subscription"] as const;

export type SoftDeletableModel = (typeof SOFT_DELETABLE_MODELS)[number];

export interface SoftDeletable {
  deletedAt?: Date | null;
}

/**
 * Checks if a record is soft deleted
 */
export function isSoftDeleted(record: SoftDeletable): boolean {
  return record.deletedAt != null;
}

/**
 * Returns a filter to exclude soft-deleted records
 */
export function excludeDeletedFilter(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Returns a filter to include only soft-deleted records
 */
export function onlyDeletedFilter(): { deletedAt: { not: null } } {
  return { deletedAt: { not: null } };
}

/**
 * Checks if a model supports soft delete
 */
export function isSoftDeletableModel(model: string): model is SoftDeletableModel {
  return SOFT_DELETABLE_MODELS.includes(model as SoftDeletableModel);
}
