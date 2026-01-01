# DataTable Component - Technical Design

**Issue**: #189  
**Author**: Solution Architect Agent  
**Date**: 2026-01-01  
**Status**: Draft

## Overview

Design a reusable, accessible, type-safe DataTable component using TanStack Table v8 that replaces manual table implementations across admin pages.

## Goals

1. Reduce code duplication across admin tables
2. Provide consistent UX (sorting, filtering, pagination)
3. Maintain accessibility (WCAG 2.1 AA)
4. Type-safe column definitions
5. Support server-side and client-side data

## Component Architecture

### Core Components

```
src/components/ui/data-table/
├── index.ts                          # Re-exports
├── data-table.tsx                    # Main table component
├── data-table-column-header.tsx      # Sortable column header
├── data-table-pagination.tsx         # Pagination controls
├── data-table-toolbar.tsx            # Search/filter toolbar
└── data-table-view-options.tsx       # Column visibility toggle
```

### Dependencies

```json
{
  "@tanstack/react-table": "^8.20.5"
}
```

## API Design

### DataTable Component

```typescript
// src/components/ui/data-table/data-table.tsx
"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  toolbarSlot?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  onRowClick,
  toolbarSlot,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchKey={searchKey}
        searchPlaceholder={searchPlaceholder}
      >
        {toolbarSlot}
      </DataTableToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  );
}
```

### DataTableColumnHeader

```typescript
// src/components/ui/data-table/data-table-column-header.tsx
"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### DataTableToolbar

```typescript
// src/components/ui/data-table/data-table-toolbar.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  children,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
        {children}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
```

### DataTablePagination

```typescript
// src/components/ui/data-table/data-table-pagination.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <>
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </>
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### DataTableViewOptions

```typescript
// src/components/ui/data-table/data-table-view-options.tsx
"use client";

import { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 className="mr-2 h-4 w-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## Usage Examples

### Coupons Table Migration

**Before** (manual implementation):

```typescript
// src/app/(admin)/admin/coupons/coupon-list.tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Code</TableHead>
      <TableHead>Discount</TableHead>
      {/* ... manual headers */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {coupons.map((coupon) => (
      <TableRow key={coupon.id}>
        {/* ... manual cells */}
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**After** (DataTable):

```typescript
// src/app/(admin)/admin/coupons/coupon-list.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { CouponActions } from "./coupon-actions";

type Coupon = {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  active: boolean;
  expiresAt: Date | null;
  timesRedeemed: number;
  maxRedemptions: number;
  _count: { usages: number };
};

const columns: ColumnDef<Coupon>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono font-semibold">{row.getValue("code")}</span>
    ),
  },
  {
    accessorKey: "discountValue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Discount" />
    ),
    cell: ({ row }) => {
      const coupon = row.original;
      if (coupon.discountType === "PERCENTAGE") {
        return `${coupon.discountValue}%`;
      }
      const currency = coupon.currency?.toUpperCase() ?? "USD";
      const amount = (coupon.discountValue / 100).toFixed(2);
      return `${currency} ${amount}`;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const coupon = row.original;
      const isExpired = coupon.expiresAt && new Date() > coupon.expiresAt;
      const isMaxedOut =
        coupon.maxRedemptions > 0 &&
        coupon.timesRedeemed >= coupon.maxRedemptions;

      if (!coupon.active) {
        return <Badge variant="secondary">Inactive</Badge>;
      }
      if (isExpired) {
        return <Badge variant="destructive">Expired</Badge>;
      }
      if (isMaxedOut) {
        return <Badge variant="outline">Max Used</Badge>;
      }
      return <Badge variant="default">Active</Badge>;
    },
  },
  {
    id: "used",
    header: "Used",
    cell: ({ row }) => {
      const coupon = row.original;
      return `${coupon._count.usages}${coupon.maxRedemptions > 0 ? ` / ${coupon.maxRedemptions}` : ""}`;
    },
  },
  {
    accessorKey: "expiresAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expires" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("expiresAt") as Date | null;
      return date ? new Date(date).toLocaleDateString() : "Never";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CouponActions coupon={row.original} />,
  },
];

export function CouponList({ coupons }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No promo codes created yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={coupons}
      searchKey="code"
      searchPlaceholder="Search codes..."
    />
  );
}
```

### Users Table Migration

The users table requires row selection for bulk actions. DataTable supports this:

```typescript
// src/components/admin/user-table.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  disabled: boolean;
};

const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => <Badge>{row.getValue("role")}</Badge>,
  },
  // ... more columns
];

export function UserTable({ users }: UserTableProps) {
  return (
    <DataTable
      columns={columns}
      data={users}
      searchKey="email"
      searchPlaceholder="Search users..."
    />
  );
}
```

## Migration Path

### Phase 1: Foundation
1. Install `@tanstack/react-table`
2. Create DataTable component and subcomponents
3. Write comprehensive tests

### Phase 2: Coupons Table (Simpler)
1. Create column definitions
2. Replace CouponList component
3. Test functionality

### Phase 3: Users Table (Complex)
1. Create column definitions with selection
2. Integrate with bulk actions
3. Maintain filter functionality
4. Test thoroughly

### Phase 4: Future Tables
- Audit logs table
- Any new admin tables

## Accessibility Considerations

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**
   - All interactive elements focusable
   - Logical tab order
   - Escape key closes dropdowns

2. **Screen Reader Support**
   - Proper ARIA labels on buttons
   - Table structure announced correctly
   - Sort state announced

3. **Visual Indicators**
   - Focus visible on all interactive elements
   - Sort direction clearly indicated
   - Selected rows visually distinct

4. **Color Contrast**
   - All text meets 4.5:1 ratio
   - Interactive elements meet 3:1 ratio

### Implementation Details

```typescript
// Sortable header button
<Button
  variant="ghost"
  aria-label={`Sort by ${title} ${column.getIsSorted() === "asc" ? "descending" : "ascending"}`}
>
  {/* ... */}
</Button>

// Pagination controls
<Button
  aria-label="Go to previous page"
  disabled={!table.getCanPreviousPage()}
>
  <ChevronLeft className="h-4 w-4" />
</Button>

// Row selection
<Checkbox
  checked={row.getIsSelected()}
  aria-label={`Select row ${row.id}`}
/>
```

## Performance Considerations

1. **Client-Side Rendering**
   - DataTable must be client component (uses React hooks)
   - Data can come from server components
   - Virtual scrolling for 1000+ rows (future enhancement)

2. **Memoization**
   - Column definitions should be defined outside component or memoized
   - Prevents unnecessary re-renders

3. **Pagination**
   - Default 10 rows per page
   - Configurable page sizes
   - Client-side pagination sufficient for <1000 rows

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/components/ui/data-table.test.tsx
describe("DataTable", () => {
  it("renders table with data", () => {
    // ...
  });

  it("sorts columns when header clicked", () => {
    // ...
  });

  it("filters data when search input used", () => {
    // ...
  });

  it("paginates data", () => {
    // ...
  });

  it("toggles column visibility", () => {
    // ...
  });

  it("selects rows when checkbox clicked", () => {
    // ...
  });
});
```

### Accessibility Tests

```typescript
describe("DataTable Accessibility", () => {
  it("has proper ARIA labels", () => {
    // ...
  });

  it("supports keyboard navigation", () => {
    // ...
  });

  it("announces sort state to screen readers", () => {
    // ...
  });
});
```

## Success Metrics

- [ ] All admin tables migrated to DataTable
- [ ] Zero accessibility regressions
- [ ] <100ms render time for 50 rows
- [ ] Test coverage >80%
- [ ] Zero TypeScript errors

## Future Enhancements

1. **Virtual Scrolling** - For large datasets (>1000 rows)
2. **Server-Side Pagination** - For massive datasets
3. **Advanced Filters** - Date ranges, multi-select
4. **Export to CSV** - Download table data
5. **Column Resizing** - User-adjustable column widths

## Open Questions

1. Should we support server-side pagination now or defer?
   - **Decision**: Defer - current tables have <100 rows
   
2. Should column visibility preferences persist?
   - **Decision**: No - adds complexity, low value for admin users

3. Should we add row expansion?
   - **Decision**: Not yet - no current use case

---

**Next Steps**: UI Engineer to implement components with TDD approach
