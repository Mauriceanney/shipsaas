/**
 * API Key Scope Validation
 *
 * Provides utilities for validating API key scopes/permissions.
 */

export type ApiScope = "read" | "write" | "admin";

/**
 * Check if an API key has a specific scope
 *
 * @param keyScopes - The scopes associated with the API key
 * @param requiredScope - The scope to check for
 * @returns true if the key has the scope (or admin scope), false otherwise
 */
export function hasScope(keyScopes: string[], requiredScope: ApiScope): boolean {
  // Admin scope grants all permissions
  if (keyScopes.includes("admin")) {
    return true;
  }

  return keyScopes.includes(requiredScope);
}

/**
 * Validate that an API key has all required scopes
 *
 * @param keyScopes - The scopes associated with the API key
 * @param requiredScopes - Array of scopes that are required
 * @returns true if the key has all required scopes, false otherwise
 */
export function validateScopes(
  keyScopes: string[],
  requiredScopes: ApiScope[]
): boolean {
  return requiredScopes.every((scope) => hasScope(keyScopes, scope));
}
