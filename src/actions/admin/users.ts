"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  createCursorResult,
  normalizeCursorParams,
} from "@/lib/db/cursor-pagination";

interface GetUsersParams {
  cursor?: string;
  limit?: number;
  search?: string;
  role?: "USER" | "ADMIN";
  status?: "all" | "active" | "disabled";
}

export async function getUsers({
  cursor,
  limit = 10,
  search,
  role,
  status = "all",
}: GetUsersParams = {}) {
  await requireAdmin();

  // Normalize pagination parameters
  const { cursor: decodedCursor, limit: normalizedLimit } =
    normalizeCursorParams({ cursor, limit });

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role }),
    ...(status === "active" && { disabled: false }),
    ...(status === "disabled" && { disabled: true }),
  };

  // Fetch one more than limit to determine if there are more pages
  const users = await db.user.findMany({
    where,
    take: normalizedLimit + 1,
    cursor: decodedCursor ? { id: decodedCursor } : undefined,
    skip: decodedCursor ? 1 : 0, // Skip the cursor itself when paginating
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true,
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  });

  // Create cursor pagination result
  const paginationResult = createCursorResult(
    users,
    normalizedLimit,
    (user) => user.id,
    decodedCursor
  );

  return {
    users: paginationResult.items,
    pagination: {
      limit: paginationResult.limit,
      hasNextPage: paginationResult.hasNextPage,
      hasPreviousPage: paginationResult.hasPreviousPage,
      nextCursor: paginationResult.nextCursor,
    },
  };
}

export async function getUserById(id: string) {
  await requireAdmin();

  const user = await db.user.findUnique({
    where: { id },
    include: {
      subscription: true,
      accounts: {
        select: {
          provider: true,
          createdAt: true,
        },
      },
    },
  });

  return user;
}

export async function updateUserRole(id: string, role: "USER" | "ADMIN") {
  const session = await requireAdmin();

  const oldUser = await db.user.findUnique({ where: { id } });
  const user = await db.user.update({
    where: { id },
    data: { role },
  });

  // Audit log
  await createAuditLog({
    entityType: "User",
    entityId: id,
    action: "UPDATE",
    changes: { role: { old: oldUser?.role, new: role } },
    userId: session.user.id,
    userEmail: session.user.email || "unknown",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);

  return user;
}

export async function toggleUserStatus(id: string) {
  const session = await requireAdmin();

  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  // Prevent disabling yourself
  if (user.id === session.user.id) {
    throw new Error("Cannot disable your own account");
  }

  const updatedUser = await db.user.update({
    where: { id },
    data: { disabled: !user.disabled },
  });

  // Audit log
  await createAuditLog({
    entityType: "User",
    entityId: id,
    action: "UPDATE",
    changes: { disabled: { old: user.disabled, new: updatedUser.disabled } },
    userId: session.user.id,
    userEmail: session.user.email || "unknown",
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);

  return updatedUser;
}
