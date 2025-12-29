/**
 * TDD: RED PHASE - Features Section Tests
 */

import { render, screen } from "@testing-library/react";
import { Lock, Mail, CreditCard } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Features } from "@/components/landing/features";

describe("Features Section", () => {
  const defaultProps = {
    title: "Everything You Need",
    subtitle: "Built with best practices and modern tools.",
    features: [
      {
        icon: Lock,
        title: "Authentication",
        description: "Secure auth with multiple providers.",
      },
      {
        icon: CreditCard,
        title: "Payments",
        description: "Stripe integration out of the box.",
      },
      {
        icon: Mail,
        title: "Email",
        description: "Transactional emails with React Email.",
      },
    ],
  };

  it("renders the section title", () => {
    render(<Features {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /everything you need/i })
    ).toBeInTheDocument();
  });

  it("renders the section subtitle", () => {
    render(<Features {...defaultProps} />);

    expect(screen.getByText(/built with best practices/i)).toBeInTheDocument();
  });

  it("renders all feature cards", () => {
    render(<Features {...defaultProps} />);

    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    render(<Features {...defaultProps} />);

    expect(screen.getByText(/secure auth/i)).toBeInTheDocument();
    expect(screen.getByText(/stripe integration/i)).toBeInTheDocument();
    expect(screen.getByText(/transactional emails/i)).toBeInTheDocument();
  });

  it("renders icons for each feature", () => {
    const { container } = render(<Features {...defaultProps} />);

    // Each feature should have an SVG icon
    const svgIcons = container.querySelectorAll("svg");
    expect(svgIcons.length).toBeGreaterThanOrEqual(3);
  });

  it("has proper semantic structure with section element", () => {
    const { container } = render(<Features {...defaultProps} />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("includes aria-label for the section", () => {
    render(<Features {...defaultProps} />);

    expect(
      screen.getByRole("region", { name: /features/i })
    ).toBeInTheDocument();
  });

  it("applies responsive grid layout", () => {
    const { container } = render(<Features {...defaultProps} />);

    const grid = container.querySelector("[class*='grid']");
    expect(grid).toBeInTheDocument();
  });

  it("works without subtitle", () => {
    render(<Features title="Features" features={defaultProps.features} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /features/i })
    ).toBeInTheDocument();
  });

  it("supports different column counts", () => {
    const { container } = render(<Features {...defaultProps} columns={2} />);

    const grid = container.querySelector("[class*='grid']");
    expect(grid?.className).toContain("md:grid-cols-2");
  });
});
