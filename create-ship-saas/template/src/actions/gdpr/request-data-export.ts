"use server";

import { headers } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dataExportRequest } from "@/lib/schema";
import { generateUserDataExport } from "./generate-export";

/**
 * GDPR Article 20 - Right to Data Portability
 *
 * Server actions for requesting and managing data exports.
 */

export type RequestDataExportResult =
  | {
      success: true;
      requestId: string;
    }
  | {
      success: false;
      error: string;
    };

export type DataExportStatusResult =
  | {
      success: true;
      data: {
        status: string;
        downloadUrl: string | null;
        expiresAt: Date | null;
        completedAt: Date | null;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Request a data export for the current user
 * Creates a new export request and generates the export synchronously (MVP approach)
 */
export async function requestDataExport(): Promise<RequestDataExportResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Check for existing pending/processing request
  const existingRequest = await db
    .select({ id: dataExportRequest.id })
    .from(dataExportRequest)
    .where(
      and(
        eq(dataExportRequest.userId, userId),
        inArray(dataExportRequest.status, ["PENDING", "PROCESSING"])
      )
    )
    .limit(1);

  if (existingRequest.length > 0) {
    return {
      success: false,
      error: "A data export request is already in progress",
    };
  }

  // Create new export request
  const requestId = createId();
  await db.insert(dataExportRequest).values({
    id: requestId,
    userId,
    status: "PROCESSING",
  });

  // For MVP, process synchronously
  // In production, this would be a background job
  try {
    const exportData = await generateUserDataExport(userId);
    const downloadUrl = `data:application/json;base64,${Buffer.from(
      JSON.stringify(exportData, null, 2)
    ).toString("base64")}`;

    // Set expiration to 48 hours
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    await db
      .update(dataExportRequest)
      .set({
        status: "COMPLETED",
        downloadUrl,
        completedAt: new Date(),
        expiresAt,
      })
      .where(eq(dataExportRequest.id, requestId));

    return { success: true, requestId };
  } catch (error) {
    console.error("[requestDataExport] Error generating export:", error);

    await db
      .update(dataExportRequest)
      .set({
        status: "FAILED",
      })
      .where(eq(dataExportRequest.id, requestId));

    return { success: false, error: "Failed to generate data export" };
  }
}

/**
 * Get the status of a data export request
 */
export async function getDataExportStatus(
  requestId: string
): Promise<DataExportStatusResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const [request] = await db
    .select({
      status: dataExportRequest.status,
      downloadUrl: dataExportRequest.downloadUrl,
      expiresAt: dataExportRequest.expiresAt,
      completedAt: dataExportRequest.completedAt,
    })
    .from(dataExportRequest)
    .where(
      and(
        eq(dataExportRequest.id, requestId),
        eq(dataExportRequest.userId, session.user.id)
      )
    )
    .limit(1);

  if (!request) {
    return { success: false, error: "Request not found" };
  }

  return {
    success: true,
    data: {
      status: request.status,
      downloadUrl: request.downloadUrl,
      expiresAt: request.expiresAt,
      completedAt: request.completedAt,
    },
  };
}

/**
 * Get the most recent data export request for the current user
 */
export async function getLatestDataExportRequest(): Promise<DataExportStatusResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const [request] = await db
    .select({
      status: dataExportRequest.status,
      downloadUrl: dataExportRequest.downloadUrl,
      expiresAt: dataExportRequest.expiresAt,
      completedAt: dataExportRequest.completedAt,
    })
    .from(dataExportRequest)
    .where(eq(dataExportRequest.userId, session.user.id))
    .orderBy(dataExportRequest.createdAt)
    .limit(1);

  if (!request) {
    return { success: false, error: "No export requests found" };
  }

  return {
    success: true,
    data: {
      status: request.status,
      downloadUrl: request.downloadUrl,
      expiresAt: request.expiresAt,
      completedAt: request.completedAt,
    },
  };
}
