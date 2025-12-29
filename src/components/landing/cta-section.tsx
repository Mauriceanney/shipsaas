/**
 * CTA Section Component
 * Reusable call-to-action section with multiple variants
 */

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CTASectionProps {
  headline: string;
  description?: string;
  primaryAction: {
    text: string;
    href: string;
  };
  secondaryAction?: {
    text: string;
    href: string;
  };
  variant?: "centered" | "split" | "banner";
  background?: "gradient" | "muted" | "primary";
  className?: string;
}

export function CTASection({
  headline,
  description,
  primaryAction,
  secondaryAction,
  variant = "centered",
  background = "muted",
  className,
}: CTASectionProps) {
  const backgroundStyles = {
    gradient:
      "bg-gradient-to-r from-primary/10 via-primary/5 to-background",
    muted: "bg-muted/50",
    primary: "bg-primary text-primary-foreground",
  };

  const isPrimaryBg = background === "primary";

  return (
    <section
      aria-label="Call to action"
      className={cn("py-20 sm:py-24", backgroundStyles[background], className)}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "mx-auto max-w-2xl",
            variant === "centered" && "text-center"
          )}
        >
          {/* Headline */}
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              isPrimaryBg ? "text-primary-foreground" : "text-foreground"
            )}
          >
            {headline}
          </h2>

          {/* Description */}
          {description && (
            <p
              className={cn(
                "mt-4 text-lg",
                isPrimaryBg
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              {description}
            </p>
          )}

          {/* Actions */}
          <div
            className={cn(
              "mt-10 flex gap-4",
              variant === "centered"
                ? "flex-col items-center justify-center sm:flex-row"
                : "flex-col sm:flex-row"
            )}
          >
            <Button
              asChild
              size="lg"
              variant={isPrimaryBg ? "secondary" : "default"}
              className="w-full sm:w-auto"
            >
              <a href={primaryAction.href}>{primaryAction.text}</a>
            </Button>

            {secondaryAction && (
              <Button
                asChild
                size="lg"
                variant={isPrimaryBg ? "outline" : "outline"}
                className={cn(
                  "w-full sm:w-auto",
                  isPrimaryBg && "border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <a href={secondaryAction.href}>{secondaryAction.text}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
