import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { Switch } from "@/components/ui/switch";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("is unchecked by default", () => {
    render(<Switch aria-label="Test switch" />);

    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("can be checked", () => {
    render(<Switch checked aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("can be disabled", () => {
    render(<Switch disabled aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("calls onCheckedChange when toggled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Switch onCheckedChange={handleChange} aria-label="Test switch" />);

    await user.click(screen.getByRole("switch"));

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("applies custom className", () => {
    render(<Switch className="custom-class" aria-label="Test switch" />);

    expect(screen.getByRole("switch")).toHaveClass("custom-class");
  });
});
