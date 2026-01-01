import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table/data-table";

type TestData = {
  id: string;
  name: string;
  email: string;
  status: string;
};

const testData: TestData[] = [
  { id: "1", name: "Alice", email: "alice@example.com", status: "active" },
  { id: "2", name: "Bob", email: "bob@example.com", status: "inactive" },
  { id: "3", name: "Charlie", email: "charlie@example.com", status: "active" },
];

const columns: ColumnDef<TestData>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.getValue("name"),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email"),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => row.getValue("status"),
  },
];

describe("DataTable", () => {
  describe("rendering", () => {
    it("renders table with data", () => {
      render(<DataTable columns={columns} data={testData} />);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("renders empty state when no data", () => {
      render(<DataTable columns={columns} data={[]} />);

      expect(screen.getByText("No results.")).toBeInTheDocument();
    });

    it("renders toolbar when searchKey provided", () => {
      render(
        <DataTable
          columns={columns}
          data={testData}
          searchKey="name"
          searchPlaceholder="Search names..."
        />
      );

      expect(
        screen.getByPlaceholderText("Search names...")
      ).toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("filters data when search input is used", async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          columns={columns}
          data={testData}
          searchKey="name"
          searchPlaceholder="Search..."
        />
      );

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "Alice");

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();

      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
      expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("shows reset button when filtered", async () => {
      const user = userEvent.setup();
      render(
        <DataTable
          columns={columns}
          data={testData}
          searchKey="name"
        />
      );

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "Alice");

      expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    const largeDataset: TestData[] = [];
    for (let i = 0; i < 25; i++) {
      largeDataset.push({
        id: String(i + 1),
        name: "User " + (i + 1),
        email: "user" + (i + 1) + "@example.com",
        status: i % 2 === 0 ? "active" : "inactive",
      });
    }

    it("paginates data when more than page size", () => {
      render(<DataTable columns={columns} data={largeDataset} />);

      expect(screen.getByText("User 1")).toBeInTheDocument();
      expect(screen.getByText("User 10")).toBeInTheDocument();

      expect(screen.queryByText("User 11")).not.toBeInTheDocument();
    });

    it("navigates to next page when next button clicked", async () => {
      const user = userEvent.setup();
      render(<DataTable columns={columns} data={largeDataset} />);

      const nextButton = screen.getByRole("button", {
        name: /go to next page/i,
      });
      await user.click(nextButton);

      expect(screen.getByText("User 11")).toBeInTheDocument();
      expect(screen.queryByText("User 1")).not.toBeInTheDocument();
    });

    it("disables previous button on first page", () => {
      render(<DataTable columns={columns} data={largeDataset} />);

      const prevButton = screen.getByRole("button", {
        name: /go to previous page/i,
      });

      expect(prevButton).toBeDisabled();
    });
  });

  describe("row click handling", () => {
    it("calls onRowClick when row is clicked", async () => {
      const user = userEvent.setup();
      const onRowClick = vi.fn();

      render(
        <DataTable
          columns={columns}
          data={testData}
          onRowClick={onRowClick}
        />
      );

      const firstRow = screen.getByText("Alice").closest("tr");
      if (firstRow) {
        await user.click(firstRow);
      }

      expect(onRowClick).toHaveBeenCalledWith(testData[0]);
    });
  });

  describe("toolbar slot", () => {
    it("renders custom toolbar content", () => {
      const toolbarContent = (
        <button type="button">Custom Action</button>
      );

      render(
        <DataTable
          columns={columns}
          data={testData}
          toolbarSlot={toolbarContent}
        />
      );

      expect(
        screen.getByRole("button", { name: "Custom Action" })
      ).toBeInTheDocument();
    });
  });
});
