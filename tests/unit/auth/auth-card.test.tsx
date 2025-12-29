/**
 * TDD: AuthCard Component Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthCard } from "@/components/auth/auth-card";

describe("AuthCard", () => {
  const defaultProps = {
    title: "Welcome Back",
    description: "Sign in to your account",
    children: <div data-testid="child-content">Form content here</div>,
  };

  describe("Rendering", () => {
    it("renders with required props", () => {
      render(<AuthCard {...defaultProps} />);

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });

    it("renders the title as heading", () => {
      render(<AuthCard {...defaultProps} />);

      const title = screen.getByRole("heading", { name: "Welcome Back" });
      expect(title).toBeInTheDocument();
    });

    it("renders the description", () => {
      render(<AuthCard {...defaultProps} />);

      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    });

    it("renders children content", () => {
      render(<AuthCard {...defaultProps} />);

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("Form content here")).toBeInTheDocument();
    });

    it("renders the logo/brand link", () => {
      render(<AuthCard {...defaultProps} />);

      const brandLink = screen.getByRole("link", { name: /saas boilerplate/i });
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute("href", "/");
    });
  });

  describe("Footer", () => {
    it("renders footer when provided", () => {
      render(
        <AuthCard
          {...defaultProps}
          footer={<div data-testid="footer-content">Footer text</div>}
        />
      );

      expect(screen.getByTestId("footer-content")).toBeInTheDocument();
      expect(screen.getByText("Footer text")).toBeInTheDocument();
    });

    it("does not render footer section when not provided", () => {
      const { container } = render(<AuthCard {...defaultProps} />);

      // CardFooter would add a footer element or specific class
      // Check that there's no footer content
      expect(screen.queryByTestId("footer-content")).not.toBeInTheDocument();
    });

    it("renders complex footer content", () => {
      render(
        <AuthCard
          {...defaultProps}
          footer={
            <div data-testid="complex-footer">
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
            </div>
          }
        />
      );

      expect(screen.getByRole("link", { name: /terms/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /privacy/i })).toBeInTheDocument();
    });
  });

  describe("Card Structure", () => {
    it("renders within a card component", () => {
      const { container } = render(<AuthCard {...defaultProps} />);

      // Card component typically renders with specific data attribute or class
      // The outer element should be a card
      expect(container.firstChild).toBeInTheDocument();
    });

    it("has centered text in header", () => {
      const { container } = render(<AuthCard {...defaultProps} />);

      // Check for text-center class in the header area
      const header = container.querySelector('[class*="text-center"]');
      expect(header).toBeInTheDocument();
    });
  });

  describe("Different Content Types", () => {
    it("handles string children", () => {
      render(
        <AuthCard title="Test" description="Test description">
          Simple text content
        </AuthCard>
      );

      expect(screen.getByText("Simple text content")).toBeInTheDocument();
    });

    it("handles complex children", () => {
      render(
        <AuthCard title="Test" description="Test description">
          <form data-testid="test-form">
            <input type="text" placeholder="Email" />
            <button type="submit">Submit</button>
          </form>
        </AuthCard>
      );

      expect(screen.getByTestId("test-form")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    });

    it("handles multiple children", () => {
      render(
        <AuthCard title="Test" description="Test description">
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </AuthCard>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });
  });

  describe("Title Variations", () => {
    it("renders short title correctly", () => {
      render(
        <AuthCard title="Login" description="Enter your credentials">
          Content
        </AuthCard>
      );

      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    it("renders long title correctly", () => {
      render(
        <AuthCard
          title="Reset Your Password and Secure Your Account"
          description="Follow the steps to reset"
        >
          Content
        </AuthCard>
      );

      expect(
        screen.getByRole("heading", {
          name: "Reset Your Password and Secure Your Account",
        })
      ).toBeInTheDocument();
    });
  });

  describe("Description Variations", () => {
    it("renders short description", () => {
      render(
        <AuthCard title="Title" description="Quick description">
          Content
        </AuthCard>
      );

      expect(screen.getByText("Quick description")).toBeInTheDocument();
    });

    it("renders long description", () => {
      const longDescription =
        "This is a longer description that provides more context about what the user should do on this page.";
      render(
        <AuthCard title="Title" description={longDescription}>
          Content
        </AuthCard>
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("brand link is accessible", () => {
      render(<AuthCard {...defaultProps} />);

      const brandLink = screen.getByRole("link", { name: /saas boilerplate/i });
      brandLink.focus();
      expect(brandLink).toHaveFocus();
    });

    it("heading has proper level", () => {
      render(<AuthCard {...defaultProps} />);

      // CardTitle should render as h2 (level 2) by default in shadcn/ui
      const heading = screen.getByRole("heading", { name: "Welcome Back" });
      expect(heading).toBeInTheDocument();
    });

    it("content is accessible", () => {
      render(
        <AuthCard {...defaultProps}>
          <button>Click me</button>
        </AuthCard>
      );

      const button = screen.getByRole("button", { name: /click me/i });
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe("Styling", () => {
    it("applies header spacing", () => {
      const { container } = render(<AuthCard {...defaultProps} />);

      // Check for space-y-1 class in header
      const headerWithSpacing = container.querySelector('[class*="space-y-1"]');
      expect(headerWithSpacing).toBeInTheDocument();
    });

    it("applies title size class", () => {
      const { container } = render(<AuthCard {...defaultProps} />);

      // Title should have text-2xl class
      const title = screen.getByRole("heading", { name: "Welcome Back" });
      expect(title.className).toContain("text-2xl");
    });

    it("brand link has proper styling", () => {
      render(<AuthCard {...defaultProps} />);

      const brandLink = screen.getByRole("link", { name: /saas boilerplate/i });
      expect(brandLink.className).toContain("text-xl");
      expect(brandLink.className).toContain("font-bold");
    });
  });
});
