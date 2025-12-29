import {
  Lock,
  CreditCard,
  Database,
  Mail,
  CheckCircle,
  Cloud,
} from "lucide-react";
import Link from "next/link";

import {
  Hero,
  Features,
  Testimonials,
  FAQ,
  CTASection,
} from "@/components/landing";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

import type { Feature, Testimonial, FAQItem } from "@/components/landing";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">ShipSaaS</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              {session?.user ? (
                <Button asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          headline="Build Your SaaS Faster"
          subheadline="Production-ready boilerplate with authentication, payments, and everything you need to launch your next SaaS product in days, not months."
          primaryCTA={{ text: "Get Started Free", href: "/signup" }}
          secondaryCTA={{ text: "View Pricing", href: "/pricing" }}
        />

        {/* Features Section */}
        <Features
          title="Everything You Need to Ship Fast"
          subtitle="Built with best practices and modern tools. No more boilerplate hell."
          features={features}
          columns={3}
        />

        {/* Testimonials Section */}
        <Testimonials title="Loved by Developers" testimonials={testimonials} />

        {/* FAQ Section */}
        <FAQ title="Frequently Asked Questions" items={faqItems} />

        {/* Final CTA */}
        <CTASection
          headline="Ready to Ship Your SaaS?"
          description="Join hundreds of developers who've already launched their products with ShipSaaS."
          primaryAction={{ text: "Start Building Now", href: "/signup" }}
          secondaryAction={{ text: "View Pricing", href: "/pricing" }}
          background="gradient"
        />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with Next.js 15, TypeScript, Prisma, and Stripe.
          </p>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:underline">
              Pricing
            </Link>
            <Link href="/login" className="hover:underline">
              Login
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

// Features data
const features: Feature[] = [
  {
    icon: Lock,
    title: "Authentication",
    description:
      "Email/password and OAuth providers with Auth.js. Secure session management out of the box.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description:
      "Stripe integration with subscriptions, one-time payments, and customer portal ready to go.",
  },
  {
    icon: Database,
    title: "Database",
    description:
      "PostgreSQL with Prisma ORM. Type-safe queries and easy migrations for your data.",
  },
  {
    icon: Mail,
    title: "Transactional Email",
    description:
      "Beautiful email templates with React Email. Nodemailer and Resend support included.",
  },
  {
    icon: CheckCircle,
    title: "Testing",
    description:
      "Unit tests with Vitest and E2E tests with Playwright. TDD workflow built-in.",
  },
  {
    icon: Cloud,
    title: "Deployment Ready",
    description:
      "Docker-ready with CI/CD pipelines. Deploy anywhere with confidence.",
  },
];

// Testimonials data
const testimonials: Testimonial[] = [
  {
    quote:
      "ShipSaaS saved us months of development time. We launched our MVP in just 2 weeks instead of 3 months.",
    author: {
      name: "Sarah Chen",
      title: "Founder",
      company: "DataFlow",
    },
    rating: 5,
  },
  {
    quote:
      "The best SaaS boilerplate I've ever used. Everything just works out of the box. Highly recommended!",
    author: {
      name: "Marcus Johnson",
      title: "CTO",
      company: "TechStart",
    },
    rating: 5,
  },
  {
    quote:
      "Finally, a boilerplate that follows best practices. The code quality is exceptional and easy to extend.",
    author: {
      name: "Emily Rodriguez",
      title: "Lead Developer",
      company: "InnovateCo",
    },
    rating: 5,
  },
];

// FAQ data
const faqItems: FAQItem[] = [
  {
    question: "What's included in the boilerplate?",
    answer:
      "ShipSaaS includes authentication (email/password + OAuth), Stripe payments with subscriptions, transactional email with React Email templates, PostgreSQL database with Prisma ORM, and comprehensive testing setup with Vitest and Playwright.",
  },
  {
    question: "Is there a free tier?",
    answer:
      "Yes! You can use the boilerplate for free. The Pro plan includes additional features like priority support, private Discord access, and future updates.",
  },
  {
    question: "Can I use this for commercial projects?",
    answer:
      "Absolutely! ShipSaaS is licensed for unlimited commercial use. Build as many projects as you want with no royalties or attribution required.",
  },
  {
    question: "What if I need help or get stuck?",
    answer:
      "We have comprehensive documentation, a community Discord channel, and email support. Pro users get priority support with faster response times.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with ShipSaaS for any reason, just let us know and we'll refund your purchase.",
  },
];
