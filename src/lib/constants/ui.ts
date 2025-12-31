/**
 * UI Constants for consistent styling across the application
 */

/**
 * Standardized icon sizes
 * - sm: Inline text, small buttons, lists
 * - md: Main navigation, standard buttons
 * - lg: Feature cards, large buttons
 * - xl: Standalone illustrations
 */
export const ICON_SIZES = {
  sm: "h-4 w-4", // 16px
  md: "h-5 w-5", // 20px
  lg: "h-6 w-6", // 24px
  xl: "h-8 w-8", // 32px
} as const;

/**
 * Status colors for consistent status indication
 * Use with text-{color} or bg-{color} classes
 */
export const STATUS_COLORS = {
  success: {
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
  },
  warning: {
    text: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  error: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-200 dark:border-red-800",
  },
  info: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
  },
} as const;

/**
 * Spacing constants for consistent gaps and padding
 */
export const SPACING = {
  section: "space-y-6", // 24px - between page sections
  card: "gap-4", // 16px - between cards in a grid
  cardContent: "space-y-4", // 16px - within card content
  form: "space-y-4", // 16px - between form fields
  inline: "gap-2", // 8px - inline elements
} as const;

/**
 * Grid layouts for common patterns
 */
export const GRID_LAYOUTS = {
  metrics: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
  features: "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
  twoColumn: "grid gap-4 md:grid-cols-2",
} as const;

/**
 * Touch target sizes for mobile accessibility (WCAG 2.1 AA compliance)
 * Minimum: 44x44px (Level AA)
 * Recommended: 48x48px (Enhanced usability)
 */
export const TOUCH_TARGETS = {
  minimum: "min-h-[44px] min-w-[44px]",
  recommended: "min-h-[48px] min-w-[48px]",
} as const;
