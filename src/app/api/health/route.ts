import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isRedisConnected } from "@/lib/redis";

interface ServiceStatus {
  status: "connected" | "disconnected";
  latency_ms?: number;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
  };
  error?: string;
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const errors: string[] = [];

  // Check database connection with timing
  // SECURITY: Simple constant query with no user input - safe for health checks
  let databaseStatus: ServiceStatus = { status: "disconnected" };
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    databaseStatus = {
      status: "connected",
      latency_ms: Date.now() - dbStart,
    };
  } catch (error) {
    errors.push(
      `Database: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Check Redis connection with timing
  let redisStatus: ServiceStatus = { status: "disconnected" };
  const redisStart = Date.now();
  try {
    const connected = await isRedisConnected();
    redisStatus = {
      status: connected ? "connected" : "disconnected",
      latency_ms: Date.now() - redisStart,
    };
    if (!connected) {
      errors.push("Redis: Connection failed");
    }
  } catch (error) {
    errors.push(
      `Redis: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Determine overall health status
  const dbHealthy = databaseStatus.status === "connected";
  const redisHealthy = redisStatus.status === "connected";

  let status: HealthResponse["status"];
  let httpStatus: number;

  if (dbHealthy && redisHealthy) {
    status = "healthy";
    httpStatus = 200;
  } else if (!dbHealthy && !redisHealthy) {
    status = "unhealthy";
    httpStatus = 503;
  } else {
    // One service is down but not both
    status = "degraded";
    httpStatus = 200; // Still operational
  }

  const response: HealthResponse = {
    status,
    timestamp,
    services: {
      database: databaseStatus,
      redis: redisStatus,
    },
    ...(errors.length > 0 && { error: errors.join("; ") }),
  };

  return NextResponse.json(response, { status: httpStatus });
}
