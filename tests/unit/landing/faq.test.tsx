/**
 * TDD: FAQ Section Tests
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FAQ } from "@/components/landing/faq";

describe("FAQ Section", () => {
  const defaultProps = {
    title: "Frequently Asked Questions",
    items: [
      {
        question: "What is included in the boilerplate?",
        answer: "Authentication, payments, email, database, and more.",
      },
      {
        question: "Is there a free tier?",
        answer: "Yes, you can use the free plan with limited features.",
      },
      {
        question: "Can I get a refund?",
        answer: "We offer a 30-day money-back guarantee.",
      },
    ],
  };

  it("renders the section title", () => {
    render(<FAQ {...defaultProps} />);

    expect(
      screen.getByRole("heading", { level: 2, name: /frequently asked/i })
    ).toBeInTheDocument();
  });

  it("renders all questions", () => {
    render(<FAQ {...defaultProps} />);

    expect(screen.getByText(/what is included/i)).toBeInTheDocument();
    expect(screen.getByText(/is there a free tier/i)).toBeInTheDocument();
    expect(screen.getByText(/can i get a refund/i)).toBeInTheDocument();
  });

  it("expands answer when question is clicked", () => {
    render(<FAQ {...defaultProps} />);

    const question = screen.getByText(/what is included/i);
    fireEvent.click(question);

    expect(screen.getByText(/authentication, payments/i)).toBeVisible();
  });

  it("has proper semantic structure", () => {
    const { container } = render(<FAQ {...defaultProps} />);

    expect(container.querySelector("section")).toBeInTheDocument();
  });

  it("includes aria-label for the section", () => {
    render(<FAQ {...defaultProps} />);

    expect(screen.getByRole("region", { name: /faq/i })).toBeInTheDocument();
  });

  it("questions are keyboard accessible", () => {
    render(<FAQ {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
