/**
 * TDD: User Table Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UserTable } from "@/components/admin/user-table";

const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "USER" as const,
    createdAt: new Date("2024-01-15"),
    subscription: null,
  },
  {
    id: "2",
    name: "Jane Admin",
    email: "jane@example.com",
    role: "ADMIN" as const,
    createdAt: new Date("2024-02-20"),
    subscription: {
      plan: "PLUS" as const,
      status: "active" as const,
    },
  },
];

describe("UserTable", () => {
  it("renders table headers", () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("renders user data", () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Jane Admin")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("renders role badges", () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.getByText("USER")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
  });

  it("renders subscription plan", () => {
    render(<UserTable users={mockUsers} />);

    expect(screen.getByText("PLUS")).toBeInTheDocument();
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders formatted dates", () => {
    render(<UserTable users={mockUsers} />);

    // Check date formats (month day, year format)
    expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Feb 20, 2024")).toBeInTheDocument();
  });

  it("renders empty state when no users", () => {
    render(<UserTable users={[]} />);

    expect(screen.getByText("No users found")).toBeInTheDocument();
  });

  it("renders view links for each user", () => {
    render(<UserTable users={mockUsers} />);

    const viewLinks = screen.getAllByRole("link", { name: /view/i });
    expect(viewLinks).toHaveLength(2);
  });
});
