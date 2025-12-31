import { Suspense } from "react";

import { getUsers } from "@/actions/admin/users";
import { UserFilters, UsersWithSelection } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users, roles, and subscriptions",
  robots: { index: false, follow: false },
};

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    status?: string;
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
  const status = params.status as "all" | "active" | "disabled" | undefined;

  const [{ users, pagination }, session] = await Promise.all([
    getUsers({ page, search, role, status }),
    auth(),
  ]);

  const currentAdminId = session?.user?.id ?? "";

  // Ensure disabled field exists (default to false if not present)
  const usersWithDisabled = users.map((user) => ({
    ...user,
    disabled: user.disabled ?? false,
  }));

  // Build query string for pagination links
  const queryParts: string[] = [];
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  if (role) queryParts.push(`role=${role}`);
  if (status) queryParts.push(`status=${status}`);
  const queryString = queryParts.length > 0 ? `&${queryParts.join("&")}` : "";

  return (
    <>
      <UsersWithSelection
        users={usersWithDisabled}
        currentAdminId={currentAdminId}
      />
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
                href={`/admin/users?page=${pagination.page - 1}${queryString}`}
                className="rounded border px-3 py-1 hover:bg-muted"
              >
                Previous
              </a>
            )}
            {pagination.page < pagination.totalPages && (
              <a
                href={`/admin/users?page=${pagination.page + 1}${queryString}`}
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
      <PageHeader
        title="User Management"
        description="Manage users, roles, and subscriptions."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UserFilters />
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            }
          >
            <UsersTableContent searchParams={props.searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
