import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { MetricsGridSkeleton } from "@/components/dashboard/metrics-grid-skeleton";

describe("MetricsGridSkeleton", () => {
  it("renders grid with 4 skeleton cards", () => {
    const { container } = render(<MetricsGridSkeleton />);

    const gridElement = container.querySelector('[role="list"]');
    expect(gridElement).toBeInTheDocument();

    const cards = container.querySelectorAll("li");
    expect(cards).toHaveLength(4);
  });

  it("has accessible label for screen readers", () => {
    render(<MetricsGridSkeleton />);

    const loadingLabel = screen.getByLabelText(/loading metrics/i);
    expect(loadingLabel).toBeInTheDocument();
  });

  it("matches metrics card layout structure", () => {
    const { container } = render(<MetricsGridSkeleton />);

    // Each card should have header and content sections
    const cards = container.querySelectorAll("li");
    cards.forEach((card) => {
      // Should have skeleton elements for title, value, and description
      const skeletons = card.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it("uses responsive grid layout", () => {
    const { container } = render(<MetricsGridSkeleton />);

    const gridElement = container.querySelector('[role="list"]');
    expect(gridElement).toHaveClass("grid");
    expect(gridElement).toHaveClass("gap-4");
  });
});
