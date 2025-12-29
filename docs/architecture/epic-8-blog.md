# Epic 8: Blog System Architecture

## Overview

MDX-powered blog system with file-based content, syntax highlighting, and SEO optimization.

## Technology Choices

### Content Processing
- **Velite** - Type-safe content layer (Contentlayer replacement, actively maintained)
- **MDX** - Markdown with JSX components
- **File-based** - Content stored in `/content/blog/*.mdx`

### Syntax Highlighting
- **rehype-pretty-code** - Build-time highlighting
- **Shiki** - VS Code-quality themes (github-dark-dimmed)
- Zero runtime JavaScript for highlighting

### Why These Choices
1. Velite is actively maintained (Contentlayer is deprecated)
2. Type-safe with Zod schema validation
3. Build-time processing = better performance
4. VS Code themes for professional code blocks

## Directory Structure

```
content/
└── blog/
    ├── getting-started.mdx
    └── advanced-features.mdx

src/
├── app/
│   └── (marketing)/
│       └── blog/
│           ├── page.tsx              # Blog listing
│           └── [slug]/
│               └── page.tsx          # Individual post
├── components/
│   └── blog/
│       ├── index.ts
│       ├── post-card.tsx             # Post preview card
│       ├── post-header.tsx           # Post title, meta
│       ├── post-content.tsx          # MDX renderer
│       └── mdx-components.tsx        # Custom MDX components
└── lib/
    └── blog.ts                       # Blog utilities
```

## Data Schema (Velite)

```typescript
// velite.config.ts
import { defineCollection, defineConfig, s } from 'velite';

const posts = defineCollection({
  name: 'Post',
  pattern: 'blog/**/*.mdx',
  schema: s.object({
    title: s.string().max(100),
    slug: s.slug('blog'),
    description: s.string().max(200),
    date: s.isodate(),
    published: s.boolean().default(true),
    author: s.string().default('ShipSaaS Team'),
    tags: s.array(s.string()).default([]),
    image: s.string().optional(),
    body: s.mdx(),
  }),
});

export default defineConfig({
  collections: { posts },
});
```

## Blog Post Frontmatter

```yaml
---
title: "Getting Started with ShipSaaS"
description: "Learn how to build your SaaS application quickly"
date: 2025-01-15
published: true
author: "ShipSaaS Team"
tags: ["tutorial", "getting-started"]
image: "/blog/getting-started.jpg"
---
```

## Components

### PostCard
- Thumbnail image (optional)
- Title and description
- Date and reading time
- Tags as badges
- Link to full post

### PostHeader
- Title (h1)
- Author and date
- Reading time estimate
- Tags

### PostContent
- MDX rendering with custom components
- Prose styling (Tailwind Typography)
- Syntax highlighted code blocks

## SEO Implementation

### Dynamic Metadata
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: [post.image || '/og-blog.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}
```

### Sitemap Extension
Add blog posts to existing sitemap.ts dynamically.

## Features

### Phase 1 (MVP)
- [x] Blog listing page
- [x] Individual post pages
- [x] MDX support
- [x] Syntax highlighting
- [x] SEO meta tags
- [x] Reading time estimate

### Phase 2 (Enhancement)
- [ ] Categories/tags filtering
- [ ] Search functionality
- [ ] Related posts
- [ ] RSS feed
- [ ] Social sharing

## Testing Strategy

### Unit Tests
- PostCard rendering
- Reading time calculation
- Tag/category utilities
- MDX component rendering

### Integration Tests
- Blog listing fetches posts
- Post page renders MDX correctly
- SEO metadata generated properly

## Performance Considerations

1. **Static Generation** - All blog pages statically generated at build
2. **Image Optimization** - Next.js Image for blog images
3. **Code Splitting** - MDX components lazy loaded where needed
4. **Build-time Highlighting** - No runtime JS for syntax highlighting

## Dependencies to Install

```bash
pnpm add velite rehype-pretty-code shiki reading-time
```

## Implementation Order

1. Install and configure Velite
2. Set up rehype-pretty-code
3. Create sample blog posts
4. Build PostCard component (TDD)
5. Build blog listing page
6. Build individual post page
7. Add SEO metadata
8. Update sitemap
