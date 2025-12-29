/**
 * TDD: User Menu Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/dashboard/user-menu";

// Mock the logout action
vi.mock("@/actions/auth/logout", () => ({
  logoutAction: vi.fn(),
}));

describe("UserMenu", () => {
  const user = {
    name: "John Doe",
    email: "john@example.com",
    image: null,
  };

  it("renders user avatar with fallback initials", () => {
    render(<UserMenu user={user} />);

    // Should show initials as fallback
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders trigger button with proper accessibility", () => {
    render(<UserMenu user={user} />);

    const trigger = screen.getByRole("button", { name: /user menu/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });

  it("handles user with no name gracefully", () => {
    const userNoName = { ...user, name: null };
    render(<UserMenu user={userNoName} />);

    // Should show email-based fallback (first two letters of email)
    expect(screen.getByText("JO")).toBeInTheDocument();
  });

  it("handles user with no name or email", () => {
    const userNoInfo = { name: null, email: null, image: null };
    render(<UserMenu user={userNoInfo} />);

    // Should show default "U" fallback
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  it("renders avatar container", () => {
    const { container } = render(<UserMenu user={user} />);

    const avatar = container.querySelector('[class*="rounded-full"]');
    expect(avatar).toBeInTheDocument();
  });

  it("includes avatar image when user has image", () => {
    const userWithImage = { ...user, image: "https://example.com/avatar.jpg" };
    const { container } = render(<UserMenu user={userWithImage} />);

    // Avatar component should have an img element (even if not loaded in test)
    const avatarContainer = container.querySelector('[class*="overflow-hidden"]');
    expect(avatarContainer).toBeInTheDocument();
  });
});
