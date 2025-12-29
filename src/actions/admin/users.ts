"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "USER" | "ADMIN";
}

export async function getUsers({
  page = 1,
  limit = 10,
  search,
  role,
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
  await requireAdmin();

  const user = await db.user.update({
    where: { id },
    data: { role },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);

  return user;
}
