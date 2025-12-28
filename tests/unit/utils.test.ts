import { describe, expect, it } from "vitest";

import {
  cn,
  formatCurrency,
  formatDate,
  slugify,
  truncate,
} from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("January 15, 2024");
  });

  it("handles string dates", () => {
    expect(formatDate("2024-06-01")).toBe("June 1, 2024");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats other currencies", () => {
    expect(formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("handles multiple spaces", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("returns original if shorter than limit", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });

  it("handles exact length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });
});
