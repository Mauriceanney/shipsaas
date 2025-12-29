"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentRole = searchParams.get("role") || "";
  const currentStatus = searchParams.get("status") || "";

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      params.delete("page");

      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleRoleChange = (role: string) => {
    updateFilters({ role: role === currentRole ? "" : role });
  };

  const handleStatusChange = (status: string) => {
    updateFilters({ status: status === currentStatus ? "" : status });
  };

  const clearFilters = () => {
    setSearch("");
    startTransition(() => {
      router.push("/admin/users");
    });
  };

  const hasFilters = search || currentRole || currentStatus;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          <span className="mr-1 text-sm text-muted-foreground">Role:</span>
          <Button
            variant={currentRole === "USER" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleChange("USER")}
          >
            User
          </Button>
          <Button
            variant={currentRole === "ADMIN" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleChange("ADMIN")}
          >
            Admin
          </Button>
        </div>

        <div className="flex gap-1">
          <span className="mr-1 text-sm text-muted-foreground">Status:</span>
          <Button
            variant={currentStatus === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("active")}
          >
            Active
          </Button>
          <Button
            variant={currentStatus === "disabled" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("disabled")}
          >
            Disabled
          </Button>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
