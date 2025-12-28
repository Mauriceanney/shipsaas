// Common types for the application

export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E };

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
