/**
 * TDD: User Table Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { UserTable } from "@/components/admin/user-table";

import type { UserForTable } from "@/components/admin/user-table";

const mockUsers: UserForTable[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "USER" as const,
    disabled: false,
    createdAt: new Date("2024-01-15"),
    subscription: null,
  },
  {
    id: "2",
    name: "Jane Admin",
    email: "jane@example.com",
    role: "ADMIN" as const,
    disabled: false,
    createdAt: new Date("2024-02-20"),
    subscription: {
      plan: "PLUS" as const,
      status: "active" as const,
    },
  },
];

const mockOnSelectionChange = vi.fn();
const mockCurrentAdminId = "admin-user-id";

describe("UserTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTable = (users: UserForTable[] = mockUsers) => {
    return render(
      <UserTable
        users={users}
        currentAdminId={mockCurrentAdminId}
        selectedUserIds={new Set<string>()}
        onSelectionChange={mockOnSelectionChange}
      />
    );
  };

  it("renders table headers", () => {
    renderTable();

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("renders user data", () => {
    renderTable();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Admin")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders role badges", () => {
    renderTable();

    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("renders subscription plan", () => {
    renderTable();

    expect(screen.getByText("PLUS")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders formatted dates", () => {
    renderTable();

    // Check date formats (month day, year format)
    expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Feb 20, 2024")).toBeInTheDocument();
  });

  it("renders empty state when no users", () => {
    renderTable([]);

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders view links for each user", () => {
    renderTable();

    const viewLinks = screen.getAllByRole("link", { name: /view/i });
    expect(viewLinks).toHaveLength(2);
  });
});
