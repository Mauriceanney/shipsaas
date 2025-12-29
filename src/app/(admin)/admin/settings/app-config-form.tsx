"use client";

import { useState, useTransition } from "react";

import { updateAppConfig } from "@/actions/admin/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { AppConfig } from "@prisma/client";

interface AppConfigFormProps {
  configs: AppConfig[];
}

export function AppConfigForm({ configs }: AppConfigFormProps) {
  const [isPending, startTransition] = useTransition();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEdit = (config: AppConfig) => {
    setEditingKey(config.key);
    setEditValue(
      typeof config.value === "string"
        ? config.value
        : JSON.stringify(config.value)
    );
  };

  const handleSave = (key: string) => {
    startTransition(async () => {
      // Try to parse as JSON, fallback to string
      let value: unknown;
      try {
        value = JSON.parse(editValue);
      } catch {
        value = editValue;
      }
      await updateAppConfig(key, value);
      setEditingKey(null);
    });
  };

  if (configs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No app settings configured. Settings will appear here once added.
      </p>
    );
  }

  // Group configs by category
  const grouped = configs.reduce(
    (acc, config) => {
      const cat = config.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(config);
      return acc;
    },
    {} as Record<string, AppConfig[]>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Manage application settings. Changes take effect immediately (with
        caching).
      </p>

      {Object.entries(grouped).map(([category, categoryConfigs]) => (
        <div key={category}>
          <h4 className="mb-2 font-medium capitalize">{category}</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryConfigs.map((config) => {
                const isEditing = editingKey === config.key;
                const displayValue =
                  typeof config.value === "string"
                    ? config.value
                    : JSON.stringify(config.value);

                return (
                  <TableRow key={config.key}>
                    <TableCell className="font-mono text-sm">
                      {config.key}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <span className="max-w-xs truncate">{displayValue}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {config.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingKey(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(config.key)}
                            disabled={isPending}
                          >
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(config)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
