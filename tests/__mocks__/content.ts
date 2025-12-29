/**
 * Mock for #content module used by content-collections
 * This provides test data for blog tests
 */

export const posts = [
  {
    slug: "getting-started",
    title: "Getting Started with ShipSaaS",
    date: "2024-01-15",
    published: true,
    tags: ["tutorial", "beginner"],
    description: "Learn how to get started",
  },
  {
    slug: "advanced-features",
    title: "Advanced Features",
    date: "2024-01-20",
    published: true,
    tags: ["tutorial", "advanced"],
    description: "Explore advanced features",
  },
  {
    slug: "draft-post",
    title: "Draft Post",
    date: "2024-01-25",
    published: false,
    tags: ["draft"],
    description: "This is a draft",
  },
  {
    slug: "tips-and-tricks",
    title: "Tips and Tricks",
    date: "2024-01-10",
    published: true,
    tags: ["tips", "beginner"],
    description: "Useful tips",
  },
  {
    slug: "deployment-guide",
    title: "Deployment Guide",
    date: "2024-01-18",
    published: true,
    tags: ["tutorial", "deployment"],
    description: "How to deploy",
  },
];
