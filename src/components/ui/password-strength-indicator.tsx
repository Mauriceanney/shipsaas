"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type PasswordStrength = "weak" | "fair" | "good" | "strong";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  strength: PasswordStrength;
  score: number;
  percentage: number;
  criteria: {
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

function calculatePasswordStrength(password: string): StrengthResult {
  const criteria = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
  };

  // Calculate score based on criteria (each worth 20 points)
  const score =
    (criteria.hasMinLength ? 20 : 0) +
    (criteria.hasUpperCase ? 20 : 0) +
    (criteria.hasLowerCase ? 20 : 0) +
    (criteria.hasNumber ? 20 : 0) +
    (criteria.hasSpecialChar ? 20 : 0);

  const percentage = score;

  let strength: PasswordStrength;
  if (score <= 25) strength = "weak";
  else if (score <= 50) strength = "fair";
  else if (score <= 75) strength = "good";
  else strength = "strong";

  return { strength, score, percentage, criteria };
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const result = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  if (!password) {
    return null;
  }

  const strengthConfig = {
    weak: {
      label: "Weak",
      color: "bg-destructive",
      textColor: "text-destructive",
    },
    fair: {
      label: "Fair",
      color: "bg-orange-500",
      textColor: "text-orange-600 dark:text-orange-500",
    },
    good: {
      label: "Good",
      color: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-500",
    },
    strong: {
      label: "Strong",
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-500",
    },
  };

  const config = strengthConfig[result.strength];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Password strength:
        </span>
        <span
          className={cn("text-xs font-medium", config.textColor)}
          aria-live="polite"
          aria-atomic="true"
        >
          {config.label}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={result.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Password strength: ${config.label}`}
      >
        <div
          className={cn("h-full transition-all duration-300", config.color)}
          style={{ width: `${result.percentage}%` }}
        />
      </div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        <li
          className={cn(
            result.criteria.hasMinLength && "text-green-600 dark:text-green-500"
          )}
        >
          {result.criteria.hasMinLength ? "✓" : "○"} At least 8 characters
        </li>
        <li
          className={cn(
            result.criteria.hasUpperCase && "text-green-600 dark:text-green-500"
          )}
        >
          {result.criteria.hasUpperCase ? "✓" : "○"} One uppercase letter
        </li>
        <li
          className={cn(
            result.criteria.hasLowerCase && "text-green-600 dark:text-green-500"
          )}
        >
          {result.criteria.hasLowerCase ? "✓" : "○"} One lowercase letter
        </li>
        <li
          className={cn(
            result.criteria.hasNumber && "text-green-600 dark:text-green-500"
          )}
        >
          {result.criteria.hasNumber ? "✓" : "○"} One number
        </li>
        <li
          className={cn(
            result.criteria.hasSpecialChar && "text-green-600 dark:text-green-500"
          )}
        >
          {result.criteria.hasSpecialChar ? "✓" : "○"} One special character
        </li>
      </ul>
    </div>
  );
}
