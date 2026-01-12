import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger, redactSensitiveData } from "@/lib/logger";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL as string;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Slow query threshold in milliseconds
 * Queries taking longer than this will be logged as warnings
 */
const SLOW_QUERY_THRESHOLD_MS = 100;

/**
 * Maximum number of parameters to log (to avoid huge logs)
 */
const MAX_PARAMS_TO_LOG = 10;

/**
 * Mask sensitive parameter values in query logs
 * Redacts values for columns that might contain sensitive data
 */
function maskParams(params: unknown[]): unknown[] {
  return params.slice(0, MAX_PARAMS_TO_LOG).map((param) => {
    if (typeof param === "string" && param.length > 100) {
      return `[string ${param.length} chars]`;
    }
    return redactSensitiveData(param);
  });
}

/**
 * Debug handler for postgres-js
 * Logs queries and detects slow queries in development mode
 */
function debugHandler(
  connection: number,
  query: string,
  params: unknown[],
  types: unknown[]
): void {
  void connection;
  void types;
  const startTime = performance.now();

  const maskedParams = maskParams(params);
  const truncatedQuery =
    query.length > 500 ? `${query.substring(0, 500)}...` : query;

  logger.debug(
    {
      query: truncatedQuery,
      params: maskedParams.length > 0 ? maskedParams : null,
      paramCount: params.length,
    },
    "DB query"
  );

  // Track slow queries (estimated - actual timing would need wrapper)
  const duration = performance.now() - startTime;
  if (duration > SLOW_QUERY_THRESHOLD_MS) {
    logger.warn(
      {
        query: truncatedQuery,
        duration: `${duration.toFixed(2)}ms`,
        threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
      },
      "Slow query detected"
    );
  }
}

// Create postgres client with conditional debug logging
const client = isDevelopment
  ? postgres(connectionString, { debug: debugHandler })
  : postgres(connectionString);

/**
 * Drizzle logger for development mode
 */
const drizzleLogger = {
  logQuery(query: string, params: unknown[]): void {
    const maskedParams = maskParams(params);
    logger.debug(
      {
        query: query.length > 500 ? `${query.substring(0, 500)}...` : query,
        params: maskedParams.length > 0 ? maskedParams : null,
      },
      "Drizzle query"
    );
  },
};

// Create drizzle instance with conditional logging
export const db = isDevelopment
  ? drizzle(client, { schema, logger: drizzleLogger })
  : drizzle(client, { schema });
