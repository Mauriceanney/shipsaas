"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { revokeApiKey } from "@/actions/api-keys";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  environment: string; // "live" | "test" but comes from DB as string
  createdAt: Date;
  lastUsedAt: Date | null;
  usageCount: number;
  revokedAt: Date | null;
}

interface ApiKeyListProps {
  apiKeys: ApiKey[];
}

export function ApiKeyList({ apiKeys }: ApiKeyListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  function handleRevokeClick(keyId: string) {
    setKeyToRevoke(keyId);
  }

  function handleCancelRevoke() {
    setKeyToRevoke(null);
  }

  async function handleConfirmRevoke() {
    if (!keyToRevoke) return;

    startTransition(async () => {
      const result = await revokeApiKey({ id: keyToRevoke });

      if (!result.success) {
        toast.error(result.error);
        setKeyToRevoke(null);
        return;
      }

      toast.success("API key revoked");
      setKeyToRevoke(null);
      router.refresh();
    });
  }

  if (apiKeys.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No API keys yet"
        description="Create your first API key to get started with programmatic access"
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your active and revoked API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {apiKey.keyPrefix}...
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={apiKey.environment === "live" ? "default" : "secondary"}
                    >
                      {apiKey.environment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(apiKey.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {apiKey.lastUsedAt ? formatDate(apiKey.lastUsedAt) : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {apiKey.revokedAt ? (
                      <Badge variant="destructive">Revoked</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeClick(apiKey.id)}
                        disabled={isPending}
                        aria-label={`Revoke ${apiKey.name}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!keyToRevoke} onOpenChange={handleCancelRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke this API key. Any applications using this key will
              immediately lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
