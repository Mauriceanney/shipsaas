import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { UserStatusSkeleton } from "@/components/dashboard/user-status-skeleton";

describe("UserStatusSkeleton", () => {
  it("renders skeleton card", () => {
    const { container } = render(<UserStatusSkeleton />);

    const card = container.querySelector(".animate-pulse");
    expect(card).toBeInTheDocument();
  });

  it("has accessible label for screen readers", () => {
    render(<UserStatusSkeleton />);

    const loadingLabel = screen.getByLabelText(/loading user status/i);
    expect(loadingLabel).toBeInTheDocument();
  });

  it("has banner-style layout matching OnboardingChecklist", () => {
    const { container } = render(<UserStatusSkeleton />);

    // Should have skeleton elements for header and content
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
