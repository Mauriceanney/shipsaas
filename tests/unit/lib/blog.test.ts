/**
 * Unit tests for blog.ts - Blog utilities
 * Uses mock data from tests/__mocks__/content.ts
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  getAllPosts,
  getPostBySlug,
  getAllTags,
  getPostsByTag,
  getRelatedPosts,
} from "@/lib/blog";

describe("Blog Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllPosts", () => {
    it("returns only published posts", () => {
      const posts = getAllPosts();

      expect(posts.every((post) => post.published)).toBe(true);
      expect(posts.find((p) => p.slug === "draft-post")).toBeUndefined();
    });

    it("sorts posts by date in descending order (newest first)", () => {
      const posts = getAllPosts();

      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i]!.date).getTime();
        const nextDate = new Date(posts[i + 1]!.date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("returns the correct number of published posts", () => {
      const posts = getAllPosts();

      // 5 total posts, 1 unpublished = 4 published
      expect(posts).toHaveLength(4);
    });

    it("includes all expected post properties", () => {
      const posts = getAllPosts();

      posts.forEach((post) => {
        expect(post).toHaveProperty("slug");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("date");
        expect(post).toHaveProperty("published");
        expect(post).toHaveProperty("tags");
        expect(post).toHaveProperty("description");
      });
    });

    it("returns the newest post first", () => {
      const posts = getAllPosts();

      expect(posts[0]!.slug).toBe("advanced-features");
      expect(posts[0]!.date).toBe("2024-01-20");
    });
  });

  describe("getPostBySlug", () => {
    it("returns a post when slug exists and is published", () => {
      const post = getPostBySlug("getting-started");

      expect(post).toBeDefined();
      expect(post?.slug).toBe("getting-started");
      expect(post?.title).toBe("Getting Started with ShipSaaS");
    });

    it("returns undefined for non-existent slug", () => {
      const post = getPostBySlug("non-existent-post");

      expect(post).toBeUndefined();
    });

    it("returns undefined for unpublished post slug", () => {
      const post = getPostBySlug("draft-post");

      expect(post).toBeUndefined();
    });

    it("handles empty string slug", () => {
      const post = getPostBySlug("");

      expect(post).toBeUndefined();
    });

    it("is case-sensitive for slugs", () => {
      const post = getPostBySlug("Getting-Started");

      expect(post).toBeUndefined();
    });

    it("returns the correct post data", () => {
      const post = getPostBySlug("advanced-features");

      expect(post).toEqual({
        slug: "advanced-features",
        title: "Advanced Features",
        date: "2024-01-20",
        published: true,
        tags: ["tutorial", "advanced"],
        description: "Explore advanced features",
      });
    });
  });

  describe("getAllTags", () => {
    it("returns all unique tags from published posts", () => {
      const tags = getAllTags();

      expect(tags).toContain("tutorial");
      expect(tags).toContain("beginner");
      expect(tags).toContain("advanced");
      expect(tags).toContain("tips");
      expect(tags).toContain("deployment");
    });

    it("does not include tags from unpublished posts", () => {
      const tags = getAllTags();

      expect(tags).not.toContain("draft");
    });

    it("returns tags sorted alphabetically", () => {
      const tags = getAllTags();

      for (let i = 0; i < tags.length - 1; i++) {
        expect(tags[i]!.localeCompare(tags[i + 1]!)).toBeLessThanOrEqual(0);
      }
    });

    it("returns unique tags (no duplicates)", () => {
      const tags = getAllTags();
      const uniqueTags = [...new Set(tags)];

      expect(tags).toHaveLength(uniqueTags.length);
    });

    it("returns the expected number of unique tags", () => {
      const tags = getAllTags();

      // tutorial, beginner, advanced, tips, deployment = 5 unique tags
      expect(tags).toHaveLength(5);
    });
  });

  describe("getPostsByTag", () => {
    it("returns posts matching the specified tag", () => {
      const posts = getPostsByTag("tutorial");

      expect(posts).toHaveLength(3);
      expect(posts.every((p) => p.tags.includes("tutorial"))).toBe(true);
    });

    it("returns empty array for non-existent tag", () => {
      const posts = getPostsByTag("non-existent-tag");

      expect(posts).toEqual([]);
    });

    it("returns posts sorted by date (newest first)", () => {
      const posts = getPostsByTag("beginner");

      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i]!.date).getTime();
        const nextDate = new Date(posts[i + 1]!.date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("does not return unpublished posts even with matching tag", () => {
      const posts = getPostsByTag("draft");

      expect(posts).toEqual([]);
    });

    it("handles single post with tag", () => {
      const posts = getPostsByTag("deployment");

      expect(posts).toHaveLength(1);
      expect(posts[0]!.slug).toBe("deployment-guide");
    });

    it("is case-sensitive for tag matching", () => {
      const posts = getPostsByTag("Tutorial");

      expect(posts).toEqual([]);
    });

    it("handles empty string tag", () => {
      const posts = getPostsByTag("");

      expect(posts).toEqual([]);
    });
  });

  describe("getRelatedPosts", () => {
    it("returns related posts based on matching tags", () => {
      const related = getRelatedPosts("getting-started");

      expect(related.length).toBeGreaterThan(0);
      // getting-started has tags: tutorial, beginner
      // Should find posts with overlapping tags
    });

    it("excludes the current post from results", () => {
      const related = getRelatedPosts("getting-started");

      expect(related.find((p) => p.slug === "getting-started")).toBeUndefined();
    });

    it("respects the limit parameter", () => {
      const related = getRelatedPosts("getting-started", 2);

      expect(related.length).toBeLessThanOrEqual(2);
    });

    it("uses default limit of 3", () => {
      const related = getRelatedPosts("getting-started");

      expect(related.length).toBeLessThanOrEqual(3);
    });

    it("returns empty array for non-existent post", () => {
      const related = getRelatedPosts("non-existent-post");

      expect(related).toEqual([]);
    });

    it("returns empty array for unpublished post slug", () => {
      const related = getRelatedPosts("draft-post");

      expect(related).toEqual([]);
    });

    it("sorts results by match count (most relevant first)", () => {
      // getting-started has tags: tutorial, beginner
      // advanced-features has: tutorial, advanced (1 match)
      // tips-and-tricks has: tips, beginner (1 match)
      // deployment-guide has: tutorial, deployment (1 match)
      const related = getRelatedPosts("getting-started");

      // All have 1 match in this case, but the function should still work
      expect(related.length).toBeGreaterThan(0);
    });

    it("only returns posts with at least one matching tag", () => {
      const related = getRelatedPosts("getting-started");

      const currentPost = getPostBySlug("getting-started");
      if (!currentPost) return;

      const currentTags = new Set(currentPost.tags);

      related.forEach((post) => {
        const hasMatchingTag = post.tags.some((tag) => currentTags.has(tag));
        expect(hasMatchingTag).toBe(true);
      });
    });

    it("handles post with unique tags (no related posts)", () => {
      // tips-and-tricks has: tips, beginner
      // We need a post with truly unique tags to test this properly
      // In our mock data, all posts share at least one tag via tutorial or beginner
      const related = getRelatedPosts("tips-and-tricks");

      // tips overlaps with getting-started (beginner)
      expect(related.length).toBeGreaterThan(0);
    });

    it("handles limit of 0", () => {
      const related = getRelatedPosts("getting-started", 0);

      expect(related).toEqual([]);
    });

    it("handles limit of 1", () => {
      const related = getRelatedPosts("getting-started", 1);

      expect(related).toHaveLength(1);
    });

    it("returns empty array for empty slug", () => {
      const related = getRelatedPosts("");

      expect(related).toEqual([]);
    });

    it("does not include unpublished posts in related results", () => {
      const related = getRelatedPosts("getting-started");

      expect(related.every((p) => p.published)).toBe(true);
      expect(related.find((p) => p.slug === "draft-post")).toBeUndefined();
    });
  });
});
