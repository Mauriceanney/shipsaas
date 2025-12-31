import { BookOpen } from "lucide-react";

import { PostCard } from "@/components/blog";
import { EmptyState } from "@/components/ui/empty-state";
import { getAllPosts } from "@/lib/blog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read our latest articles about SaaS development, best practices, and tutorials",
  openGraph: {
    title: "Blog | ShipSaaS",
    description: "Read our latest articles about SaaS development, best practices, and tutorials",
    type: "website",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Insights, tutorials, and updates from the ShipSaaS team
          </p>
        </div>

        {posts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No posts yet"
            description="Check back soon for articles about SaaS development, best practices, and tutorials."
          />
        ) : (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
