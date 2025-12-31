"use client";

/**
 * Theme Switcher Component
 * Visual card-based theme selector with Light/Dark/System options
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ThemeOptionProps {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

function ThemeOption({ value, label, icon, isActive, onClick }: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      aria-label={`${label} theme`}
      aria-pressed={isActive}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
        "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isActive
          ? "border-primary bg-primary/5"
          : "border-muted bg-background hover:bg-muted/50"
      )}
    >
      {/* Theme preview */}
      <div
        className={cn(
          "flex h-16 w-24 items-center justify-center rounded-md border",
          value === "dark"
            ? "border-slate-700 bg-slate-900"
            : value === "light"
              ? "border-slate-200 bg-white"
              : "border-slate-300 bg-gradient-to-r from-white to-slate-900"
        )}
      >
        <div className={cn(
          "flex items-center justify-center rounded-full p-2",
          value === "dark"
            ? "bg-slate-800 text-slate-300"
            : value === "light"
              ? "bg-slate-100 text-slate-600"
              : "bg-slate-200 text-slate-500"
        )}>
          {icon}
        </div>
      </div>

      {/* Label */}
      <span className="text-sm font-medium">{label}</span>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Appearance</h3>
          <p className="text-sm text-muted-foreground">
            Choose how ShipSaaS looks to you.
          </p>
        </div>
        <div className="flex gap-4">
          {/* Skeleton placeholders */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 w-32 animate-pulse rounded-lg border-2 border-muted bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Choose how ShipSaaS looks to you.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <ThemeOption
          value="light"
          label="Light"
          icon={<Sun className="h-5 w-5" />}
          isActive={theme === "light"}
          onClick={() => setTheme("light")}
        />
        <ThemeOption
          value="dark"
          label="Dark"
          icon={<Moon className="h-5 w-5" />}
          isActive={theme === "dark"}
          onClick={() => setTheme("dark")}
        />
        <ThemeOption
          value="system"
          label="System"
          icon={<Monitor className="h-5 w-5" />}
          isActive={theme === "system"}
          onClick={() => setTheme("system")}
        />
      </div>
    </div>
  );
}
