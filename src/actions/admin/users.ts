"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { createAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "USER" | "ADMIN";
  status?: "all" | "active" | "disabled";
}

export async function getUsers({
  page = 1,
  limit = 10,
  search,
  role,
  status = "all",
}: GetUsersParams = {}) {
  await requireAdmin();

  const skip = (page - 1) * limit;

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

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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
    }),
    db.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
