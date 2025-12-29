import { Suspense } from "react";

import { getUsers } from "@/actions/admin/users";
import { UserTable } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
  }>;
}

async function UsersTableContent({
  searchParams,
}: {
  searchParams: UsersPageProps["searchParams"];
}) {
  const params = await searchParams;
  const page = params.page ? parseInt(params.page) : 1;
  const search = params.search;
  const role = params.role as "USER" | "ADMIN" | undefined;

  const { users, pagination } = await getUsers({ page, search, role });

  return (
    <>
      <UserTable users={users} />
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} users
          </span>
          <div className="flex gap-2">
            {pagination.page > 1 && (
              <a
                href={`/admin/users?page=${pagination.page - 1}${search ? `&search=${search}` : ""}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Previous
              </a>
            )}
            {pagination.page < pagination.totalPages && (
              <a
                href={`/admin/users?page=${pagination.page + 1}${search ? `&search=${search}` : ""}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function UsersPage(props: UsersPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and subscriptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={<div className="py-8 text-center">Loading users...</div>}
          >
            <UsersTableContent searchParams={props.searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
