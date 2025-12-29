/**
 * TDD: RED PHASE - Hero Section Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero } from "@/components/landing/hero";

describe("Hero Section", () => {
  const defaultProps = {
    headline: "Build Your SaaS Faster",
    subheadline: "Production-ready boilerplate with everything you need.",
    primaryCTA: { text: "Get Started", href: "/signup" },
  };

  it("renders the headline", () => {
    render(<Hero {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /build your saas faster/i })
    ).toBeInTheDocument();
  });

  it("renders the subheadline", () => {
    render(<Hero {...defaultProps} />);

    expect(
      screen.getByText(/production-ready boilerplate/i)
    ).toBeInTheDocument();
  });

  it("renders the primary CTA button", () => {
    render(<Hero {...defaultProps} />);

    const ctaLink = screen.getByRole("link", { name: /get started/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute("href", "/signup");
  });

  it("renders the secondary CTA when provided", () => {
    render(
      <Hero
        {...defaultProps}
        secondaryCTA={{ text: "View Pricing", href: "/pricing" }}
      />
    );

    const secondaryLink = screen.getByRole("link", { name: /view pricing/i });
    expect(secondaryLink).toBeInTheDocument();
    expect(secondaryLink).toHaveAttribute("href", "/pricing");
  });

  it("does not render secondary CTA when not provided", () => {
    render(<Hero {...defaultProps} />);

    expect(
      screen.queryByRole("link", { name: /view pricing/i })
    ).not.toBeInTheDocument();
  });

  it("has proper semantic structure with section element", () => {
    const { container } = render(<Hero {...defaultProps} />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("includes aria-label for the section", () => {
    render(<Hero {...defaultProps} />);

    expect(screen.getByRole("region", { name: /hero/i })).toBeInTheDocument();
  });

  it("applies responsive classes", () => {
    const { container } = render(<Hero {...defaultProps} />);

    // Check for responsive container
    const section = container.querySelector("section");
    expect(section?.className).toContain("py-");
  });
});
