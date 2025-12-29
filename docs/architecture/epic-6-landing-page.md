# Epic 6: Landing Page - Architecture Document

## Overview

Marketing pages and public-facing content with comprehensive landing page sections, SEO optimization, and responsive design.

## User Stories

### US-6.1: Marketing Landing Page
- Hero section with compelling CTA
- Features section (enhanced)
- Pricing preview section
- Testimonials/Social proof
- FAQ section
- Multiple CTA sections
- Fully responsive design

### US-6.2: SEO & Meta
- Meta tags for all pages
- Open Graph images
- Sitemap generation
- robots.txt configuration
- Structured data (JSON-LD)

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── page.tsx                    # Enhanced landing page
│   ├── sitemap.ts                  # Dynamic sitemap
│   ├── robots.ts                   # robots.txt config
│   └── (marketing)/
│       ├── layout.tsx              # Marketing layout (exists)
│       └── pricing/page.tsx        # Pricing page (exists)
├── components/
│   └── landing/
│       ├── index.ts                # Barrel export
│       ├── hero.tsx                # Hero section
│       ├── features.tsx            # Enhanced features grid
│       ├── testimonials.tsx        # Testimonials section
│       ├── faq.tsx                 # FAQ accordion
│       ├── cta-section.tsx         # Reusable CTA section
│       ├── stats.tsx               # Statistics/metrics display
│       ├── pricing-preview.tsx     # Pricing preview on landing
│       └── mobile-nav.tsx          # Mobile navigation menu
└── lib/
    └── seo/
        ├── metadata.ts             # Shared metadata helpers
        └── structured-data.ts      # JSON-LD generators
```

### Component Specifications

#### 1. Hero Section (`hero.tsx`)
```typescript
interface HeroProps {
  headline: string;
  subheadline: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  showTrustBadges?: boolean;
}
```
- Gradient background with pattern overlay
- Large headline with subtext
- Two CTA buttons (primary + secondary)
- Trust badges/logos below CTAs
- Responsive: stacked on mobile, side-by-side on desktop

#### 2. Features Section (`features.tsx`)
```typescript
interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturesProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
}
```
- Section header with title/subtitle
- Icon-based feature cards
- Configurable column count
- Hover effects and animations

#### 3. Testimonials Section (`testimonials.tsx`)
```typescript
interface Testimonial {
  quote: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar?: string;
  };
  rating?: number;
}

interface TestimonialsProps {
  title: string;
  testimonials: Testimonial[];
}
```
- Carousel or grid layout
- Avatar with fallback
- Star ratings (optional)
- Company/role attribution

#### 4. FAQ Section (`faq.tsx`)
```typescript
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title: string;
  items: FAQItem[];
}
```
- Accordion-style expand/collapse
- Smooth animations
- Keyboard accessible
- Schema.org FAQ markup

#### 5. CTA Section (`cta-section.tsx`)
```typescript
interface CTASectionProps {
  variant: 'centered' | 'split' | 'banner';
  headline: string;
  description?: string;
  primaryAction: { text: string; href: string };
  secondaryAction?: { text: string; href: string };
  background?: 'gradient' | 'muted' | 'primary';
}
```
- Multiple layout variants
- Customizable backgrounds
- Primary and secondary actions

#### 6. Stats Section (`stats.tsx`)
```typescript
interface Stat {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface StatsProps {
  stats: Stat[];
  title?: string;
}
```
- Numerical metrics display
- Optional animated counters
- Responsive grid layout

### SEO Implementation

#### Meta Tags (Next.js Metadata API)
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'ShipSaaS - Build Your SaaS Faster',
    template: '%s | ShipSaaS'
  },
  description: 'Production-ready SaaS boilerplate with authentication, payments, email, and more.',
  keywords: ['saas', 'boilerplate', 'nextjs', 'stripe', 'authentication'],
  authors: [{ name: 'ShipSaaS' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'ShipSaaS',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@shipsaas'
  },
  robots: {
    index: true,
    follow: true
  }
};
```

#### Sitemap (`src/app/sitemap.ts`)
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), priority: 0.8 },
    // ... other pages
  ];
}
```

#### Robots.txt (`src/app/robots.ts`)
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard/'] },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
  };
}
```

### Design Tokens

Using existing Tailwind configuration:
- Colors: primary, secondary, muted, accent, destructive
- Spacing: consistent padding/margin scale
- Border radius: sm, md, lg
- Typography: Inter font family
- Shadows: sm, md, lg

### Responsive Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader friendly content structure
- Proper heading hierarchy (h1 > h2 > h3)
- Focus indicators on all interactive elements
- Color contrast ratios ≥ 4.5:1

### Performance Targets

- Lighthouse Performance: ≥ 90
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Cumulative Layout Shift: < 0.1
- Image optimization with next/image

## Implementation Plan

### Phase 1: Core Components (Priority: High)
1. Create landing components directory structure
2. Implement Hero section with tests
3. Implement enhanced Features section with tests
4. Update home page to use new components

### Phase 2: Social Proof (Priority: High)
1. Implement Testimonials section with tests
2. Add testimonials data/content
3. Implement Stats section with tests

### Phase 3: FAQ & CTA (Priority: Medium)
1. Implement FAQ accordion with tests
2. Implement CTA section variants with tests
3. Add FAQ content

### Phase 4: SEO & Meta (Priority: High)
1. Configure root metadata
2. Implement sitemap.ts
3. Implement robots.ts
4. Add Open Graph image

### Phase 5: Mobile Navigation (Priority: Medium)
1. Implement mobile nav menu
2. Update header with hamburger menu
3. Add smooth scroll for anchor links

## Testing Strategy

### Unit Tests
- Component rendering tests
- Props validation tests
- Accessibility tests (aria-labels, roles)

### Integration Tests
- Section visibility tests
- CTA navigation tests
- Mobile menu interaction tests

### E2E Tests (if needed)
- Full page load tests
- Navigation flow tests
- CTA click tracking tests

## Dependencies

### Existing (No new packages needed)
- Lucide React (icons)
- Tailwind CSS (styling)
- Next.js (framework)
- Radix UI (headless components)

### Potential Additions
- @radix-ui/react-accordion (for FAQ, if not already installed)
- @radix-ui/react-collapsible (for mobile nav)

## Definition of Done

- [ ] All landing page sections implemented
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] SEO optimized (meta tags, sitemap, robots.txt)
- [ ] Unit tests for all components
- [ ] Performance optimized (Lighthouse ≥ 90)
- [ ] Code reviewed and merged
