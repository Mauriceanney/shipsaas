/**
 * Features Section Component
 * Displays a grid of feature cards with icons
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface FeaturesProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function Features({
  title,
  subtitle,
  features,
  columns = 3,
  className,
}: FeaturesProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section
      aria-label="Features section"
      className={cn("py-20 sm:py-24", className)}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Features Grid */}
        <div
          className={cn(
            "mx-auto mt-16 grid max-w-5xl gap-6",
            "grid-cols-1",
            gridCols[columns]
          )}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <Card className="border-border/50 bg-card/50 transition-colors hover:border-border hover:bg-card">
      <CardContent className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {feature.description}
        </p>
      </CardContent>
    </Card>
  );
}
