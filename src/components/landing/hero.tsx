/**
 * Hero Section Component
 * Main landing page hero with headline, subheadline, and CTAs
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroProps {
  headline: string;
  subheadline: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  className?: string;
}

export function Hero({
  headline,
  subheadline,
  primaryCTA,
  secondaryCTA,
  className,
}: HeroProps) {
  return (
    <section
      aria-label="Hero section"
      className={cn(
        "relative overflow-hidden py-20 sm:py-32 lg:py-40",
        className
      )}
    >
      {/* Background gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"
      />

      {/* Grid pattern overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px]"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {headline}
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            {subheadline}
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={primaryCTA.href}>{primaryCTA.text}</a>
            </Button>

            {secondaryCTA && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <a href={secondaryCTA.href}>{secondaryCTA.text}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
