import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: Date;
    subscription: {
      plan: "FREE" | "PRO" | "ENTERPRISE";
      status: string;
    } | null;
  }>;
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.name || "Unnamed"}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {user.subscription?.plan || "Free"}
              </Badge>
            </TableCell>
            <TableCell>
              {user.createdAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/admin/users/${user.id}`}
                className="text-sm text-primary hover:underline"
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
