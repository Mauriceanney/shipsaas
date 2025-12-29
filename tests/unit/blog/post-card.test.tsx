/**
 * TDD: PostCard Tests
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostCard } from "@/components/blog/post-card";

describe("PostCard", () => {
  const post = {
    title: "Test Post Title",
    slug: "test-post",
    description: "This is a test post description",
    date: "2025-01-15",
    author: "Test Author",
    tags: ["test", "tutorial"],
    permalink: "/blog/test-post",
    readingTime: 5,
  };

  it("renders post title", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders post description", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("This is a test post description")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<PostCard post={post} />);

    // Should render a date (format may vary)
    expect(screen.getByText(/Jan.*15.*2025|January.*15.*2025/i)).toBeInTheDocument();
  });

  it("renders reading time", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText(/5.*min.*read/i)).toBeInTheDocument();
  });

  it("renders tags as badges", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("tutorial")).toBeInTheDocument();
  });

  it("links to the post permalink", () => {
    render(<PostCard post={post} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/blog/test-post");
  });

  it("renders author name", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("handles post without tags", () => {
    const postNoTags = { ...post, tags: [] };
    render(<PostCard post={postNoTags} />);

    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });
});
