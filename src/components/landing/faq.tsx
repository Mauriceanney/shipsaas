/**
 * FAQ Section Component
 * Accordion-style frequently asked questions
 */

"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  title: string;
  items: FAQItem[];
  className?: string;
}

export function FAQ({ title, items, className }: FAQProps) {
  return (
    <section
      aria-label="FAQ section"
      className={cn("py-20 sm:py-24", className)}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        {/* FAQ Items */}
        <div className="mx-auto mt-16 max-w-3xl divide-y divide-border">
          {items.map((item, index) => (
            <FAQItemComponent key={index} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FAQItemComponentProps {
  item: FAQItem;
}

function FAQItemComponent({ item }: FAQItemComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="py-6">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-foreground">
          {item.question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "mt-4 overflow-hidden transition-all duration-200",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.answer}
        </p>
      </div>
    </div>
  );
}
