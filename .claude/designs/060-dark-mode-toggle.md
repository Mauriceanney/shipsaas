# Technical Design: Dark Mode Toggle (#60)

## Overview

Add dark mode toggle functionality using `next-themes` library with system preference detection.

## Technical Approach

### Dependencies
- `next-themes` (already installed)

### Components to Create

1. **ThemeProvider** (`src/components/providers/theme-provider.tsx`)
   - Wraps `next-themes` ThemeProvider
   - Configures system preference detection
   - Handles hydration properly

2. **ThemeToggle** (`src/components/theme-toggle.tsx`)
   - Toggle button with sun/moon icons
   - Cycles through: light → dark → system
   - Accessible with proper ARIA labels

### Files to Modify

1. **layout.tsx** - Add ThemeProvider to provider hierarchy
2. **user-menu.tsx** - Add theme selection option

## Implementation Details

### ThemeProvider Configuration
```typescript
<ThemeProvider
  attribute="class"           // Uses .dark class on <html>
  defaultTheme="system"       // Respects system preference
  enableSystem={true}         // Enables system detection
  disableTransitionOnChange   // Prevents flash during toggle
>
```

### Theme Toggle States
| Current | Next | Icon |
|---------|------|------|
| light | dark | Sun |
| dark | system | Moon |
| system | light | Computer |

### Existing Infrastructure
- ✅ Tailwind configured with `darkMode: ["class"]`
- ✅ CSS variables for light/dark in globals.css
- ✅ `suppressHydrationWarning` on HTML element
- ✅ shadcn/ui components support dark mode

## Testing Strategy

### Unit Tests
- ThemeProvider renders children correctly
- ThemeToggle cycles through themes
- Theme persists across page reloads (mocked localStorage)
- Accessibility: proper ARIA labels and keyboard navigation

### Integration
- Theme change applies dark class to HTML
- All shadcn/ui components respond to theme

## Acceptance Criteria
- [x] Users can toggle between light, dark, and system themes
- [x] Theme preference persists across sessions
- [x] System theme preference is respected by default
- [x] No flash of incorrect theme on page load
- [x] Accessible toggle with keyboard support
