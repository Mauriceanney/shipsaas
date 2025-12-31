import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ConfigAuditLog } from "@prisma/client";

interface AuditLogTableProps {
  logs: ConfigAuditLog[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No changes recorded"
        description="Configuration changes will appear here once updates are made."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Changed By</TableHead>
          <TableHead>Changes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">
              {log.createdAt.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{log.entityType}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  log.action === "DELETE"
                    ? "destructive"
                    : log.action === "CREATE"
                      ? "default"
                      : "secondary"
                }
              >
                {log.action}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{log.userEmail}</TableCell>
            <TableCell className="max-w-xs truncate font-mono text-xs">
              {formatChanges(log.changes as Record<string, unknown>)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatChanges(changes: Record<string, unknown>): string {
  if (!changes || typeof changes !== "object") return "-";

  return Object.entries(changes)
    .map(([key, val]) => {
      const change = val as { old: unknown; new: unknown };
      return `${key}: ${JSON.stringify(change.old)} → ${JSON.stringify(change.new)}`;
    })
    .join(", ");
}
