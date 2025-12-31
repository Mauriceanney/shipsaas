"use client";

/**
 * Theme Toggle Button
 * Cycles through light → dark → system themes
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "dark") {
      return <Moon className="h-4 w-4" aria-hidden="true" />;
    }
    if (theme === "system") {
      return <Monitor className="h-4 w-4" aria-hidden="true" />;
    }
    return <Sun className="h-4 w-4" aria-hidden="true" />;
  };

  const getLabel = () => {
    if (theme === "dark") return "Dark mode";
    if (theme === "system") return "System theme";
    return "Light mode";
  };

  // Show placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme">
        <Sun className="h-4 w-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
    </Button>
  );
}
