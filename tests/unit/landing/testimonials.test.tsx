/**
 * TDD: Testimonials Section Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Testimonials } from "@/components/landing/testimonials";

describe("Testimonials Section", () => {
  const defaultProps = {
    title: "What Our Users Say",
    testimonials: [
      {
        quote: "This saved us months of development time.",
        author: {
          name: "Jane Doe",
          title: "CTO",
          company: "TechCorp",
        },
      },
      {
        quote: "The best SaaS boilerplate I've used.",
        author: {
          name: "John Smith",
          title: "Founder",
          company: "StartupXYZ",
          avatar: "/avatars/john.png",
        },
        rating: 5,
      },
    ],
  };

  it("renders the section title", () => {
    render(<Testimonials {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /what our users say/i })
    ).toBeInTheDocument();
  });

  it("renders all testimonials", () => {
    render(<Testimonials {...defaultProps} />);

    expect(screen.getByText(/saved us months/i)).toBeInTheDocument();
    expect(screen.getByText(/best saas boilerplate/i)).toBeInTheDocument();
  });

  it("renders author names", () => {
    render(<Testimonials {...defaultProps} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("John Smith")).toBeInTheDocument();
  });

  it("renders author titles and companies", () => {
    render(<Testimonials {...defaultProps} />);

    expect(screen.getByText(/CTO.*TechCorp/)).toBeInTheDocument();
    expect(screen.getByText(/Founder.*StartupXYZ/)).toBeInTheDocument();
  });

  it("renders avatar fallback when no avatar provided", () => {
    render(<Testimonials {...defaultProps} />);

    // Should show initials as fallback
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("has proper semantic structure", () => {
    const { container } = render(<Testimonials {...defaultProps} />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("includes aria-label for the section", () => {
    render(<Testimonials {...defaultProps} />);

    expect(
      screen.getByRole("region", { name: /testimonials/i })
    ).toBeInTheDocument();
  });
});
