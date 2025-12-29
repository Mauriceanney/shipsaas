"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Data Export Actions
 *
 * GDPR Article 20 - Right to Data Portability
 * Allows users to export their personal data in a machine-readable format.
 */

export interface ExportDataResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

export interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
  accounts: Array<{
    provider: string;
    createdAt: Date;
  }>;
  subscription: {
    plan: string;
    status: string;
    createdAt: Date;
  } | null;
}

/**
 * Request a data export for the current user
 */
export async function requestDataExport(): Promise<ExportDataResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;

  // Check for existing pending request
  const existingRequest = await db.dataExportRequest.findFirst({
    where: {
      userId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
  });

  if (existingRequest) {
    return {
      success: false,
      error: "A data export request is already in progress",
    };
  }

  // Create new export request
  const request = await db.dataExportRequest.create({
    data: {
      userId,
    },
  });

  // For MVP, process synchronously
  // In production, this would be a background job
  try {
    const exportData = await generateUserDataExport(userId);
    const downloadUrl = `data:application/json;base64,${Buffer.from(
      JSON.stringify(exportData, null, 2)
    ).toString("base64")}`;

    await db.dataExportRequest.update({
      where: { id: request.id },
      data: {
        status: "COMPLETED",
        downloadUrl,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  } catch {
    await db.dataExportRequest.update({
      where: { id: request.id },
      data: { status: "FAILED" },
    });
  }

  return { success: true, requestId: request.id };
}

/**
 * Get the status of a data export request
 */
export async function getDataExportStatus(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const request = await db.dataExportRequest.findFirst({
    where: {
      id: requestId,
      userId: session.user.id,
    },
  });

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
 * Generate the complete user data export
 */
export async function generateUserDataExport(
  userId: string
): Promise<UserDataExport> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        },
      },
      subscription: {
        select: {
          plan: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    accounts: user.accounts.map((a) => ({
      provider: a.provider,
      createdAt: a.createdAt,
    })),
    subscription: user.subscription
      ? {
          plan: user.subscription.plan,
          status: user.subscription.status,
          createdAt: user.subscription.createdAt,
        }
      : null,
  };
}
