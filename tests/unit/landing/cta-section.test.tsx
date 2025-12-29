/**
 * TDD: CTA Section Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CTASection } from "@/components/landing/cta-section";

describe("CTA Section", () => {
  const defaultProps = {
    headline: "Ready to Get Started?",
    description: "Join thousands of developers building faster.",
    primaryAction: { text: "Start Free Trial", href: "/signup" },
  };

  it("renders the headline", () => {
    render(<CTASection {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /ready to get started/i })
    ).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<CTASection {...defaultProps} />);

    expect(screen.getByText(/join thousands/i)).toBeInTheDocument();
  });

  it("renders the primary action button", () => {
    render(<CTASection {...defaultProps} />);

    const link = screen.getByRole("link", { name: /start free trial/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });

  it("renders secondary action when provided", () => {
    render(
      <CTASection
        {...defaultProps}
        secondaryAction={{ text: "Learn More", href: "/pricing" }}
      />
    );

    const link = screen.getByRole("link", { name: /learn more/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("does not render secondary action when not provided", () => {
    render(<CTASection {...defaultProps} />);

    expect(
      screen.queryByRole("link", { name: /learn more/i })
    ).not.toBeInTheDocument();
  });

  it("has proper semantic structure", () => {
    const { container } = render(<CTASection {...defaultProps} />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("supports centered variant", () => {
    const { container } = render(
      <CTASection {...defaultProps} variant="centered" />
    );

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("supports gradient background", () => {
    const { container } = render(
      <CTASection {...defaultProps} background="gradient" />
    );

    const section = container.querySelector("section");
    expect(section?.className).toContain("bg-gradient");
  });
});
