import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Skeleton } from "@/components/ui/skeleton";

describe("Skeleton", () => {
  it("renders correctly", () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("has default classes", () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("rounded-md");
    expect(skeleton).toHaveClass("bg-muted");
  });

  it("applies custom className", () => {
    render(<Skeleton className="h-4 w-32" data-testid="skeleton" />);

    const skeleton = screen.getByTestId("skeleton");
    expect(skeleton).toHaveClass("h-4");
    expect(skeleton).toHaveClass("w-32");
  });

  it("spreads additional props", () => {
    render(<Skeleton role="presentation" data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toHaveAttribute("role", "presentation");
  });
});
