/**
 * Testimonials Section Component
 * Displays customer testimonials with avatars
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar?: string;
  };
  rating?: number;
}

export interface TestimonialsProps {
  title: string;
  testimonials: Testimonial[];
  className?: string;
}

export function Testimonials({
  title,
  testimonials,
  className,
}: TestimonialsProps) {
  return (
    <section
      aria-label="Testimonials section"
      className={cn("bg-muted/30 py-20 sm:py-24", className)}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const { quote, author, rating } = testimonial;
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="border-border/50 bg-card">
      <CardContent className="p-6">
        {/* Rating Stars */}
        {rating && (
          <div className="mb-4 flex gap-1" aria-label={`${rating} out of 5 stars`}>
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={cn(
                  "h-5 w-5",
                  i < rating ? "text-yellow-400" : "text-muted"
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        )}

        {/* Quote */}
        <blockquote className="text-foreground">
          <p className="text-sm leading-relaxed">&quot;{quote}&quot;</p>
        </blockquote>

        {/* Author */}
        <div className="mt-6 flex items-center gap-4">
          <Avatar>
            {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">{author.name}</p>
            <p className="text-sm text-muted-foreground">
              {author.title}, {author.company}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
