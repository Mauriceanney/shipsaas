/**
 * Blog utilities
 */

import { posts } from "#content";

export type Post = (typeof posts)[number];

/**
 * Get all published posts sorted by date (newest first)
 */
export function getAllPosts(): Post[] {
  return posts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a post by slug
 */
export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug && post.published);
}

/**
 * Get all unique tags from posts
 */
export function getAllTags(): string[] {
  const tags = new Set<string>();
  posts.forEach((post) => {
    if (post.published) {
      post.tags.forEach((tag) => tags.add(tag));
    }
  });
  return Array.from(tags).sort();
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}

/**
 * Get related posts (by matching tags)
 */
export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];

  const currentTags = new Set(currentPost.tags);

  return getAllPosts()
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      post,
      matchCount: post.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map(({ post }) => post);
}
