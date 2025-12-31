# Technical Design: Settings & User Menu Redesign (#60)

## Overview

Redesign the user menu dropdown and settings page to match modern SaaS design patterns (inspired by Claude/ChatGPT settings).

## Design Goals

1. **Theme Toggle**: Visual card-based selector with Light/Dark/System previews
2. **User Menu**: Clean dropdown with better organization
3. **Settings Page**: Left sidebar navigation with content area

## Components to Create/Modify

### 1. ThemeSwitcher Component (NEW)
Visual card-based theme selector with three options:
- Light mode preview card
- Dark mode preview card
- System mode preview card

```
┌─────────────────────────────────────────────────┐
│  Appearance                                     │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ ☀️      │  │ 🌙      │  │ 💻      │        │
│  │ Light   │  │ Dark    │  │ System  │        │
│  │  [===]  │  │  [===]  │  │  [===]  │        │
│  └─────────┘  └─────────┘  └─────────┘        │
│       ✓                                        │
└─────────────────────────────────────────────────┘
```

### 2. User Menu Dropdown (MODIFY)
Clean design with:
- User avatar + name + email header
- Grouped menu items with icons
- Theme toggle inline (quick access)
- Separator between sections

```
┌─────────────────────────────┐
│  👤 John Doe                │
│     john@example.com        │
├─────────────────────────────┤
│  ⭐ Upgrade plan            │
│  👤 Profile                 │
│  ⚙️  Settings               │
│  💳 Billing                 │
├─────────────────────────────┤
│  🎨 Theme    [☀️|🌙|💻]    │
├─────────────────────────────┤
│  🚪 Sign out                │
└─────────────────────────────┘
```

### 3. Settings Layout (MODIFY)
Left sidebar navigation with content area:

```
┌────────────────────────────────────────────────────┐
│  Settings                                          │
├──────────────┬─────────────────────────────────────┤
│              │                                     │
│  General  ◀  │  General                           │
│  Profile     │                                     │
│  Security    │  Appearance                         │
│  Billing     │  ┌─────┐ ┌─────┐ ┌─────┐          │
│  Privacy     │  │Light│ │Dark │ │Sys  │          │
│              │  └─────┘ └─────┘ └─────┘          │
│              │                                     │
│              │  Notifications                      │
│              │  Email notifications    [Toggle]    │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Theme Switcher Component
- Create `src/components/settings/theme-switcher.tsx`
- Visual preview cards for each theme
- Click to select, shows checkmark on active
- Uses `next-themes` useTheme hook

### Phase 2: Update AppSidebar User Menu
- Redesign dropdown with cleaner grouping
- Add inline theme toggle (3 buttons: ☀️ 🌙 💻)
- Better visual hierarchy

### Phase 3: Settings Layout
- Create `src/components/settings/settings-layout.tsx`
- Left sidebar navigation component
- Wrap all settings pages with new layout
- Add "General" page with appearance settings

## Files to Create
- `src/components/settings/theme-switcher.tsx`
- `src/components/settings/settings-nav.tsx`
- `src/components/settings/settings-layout.tsx`
- `src/app/(dashboard)/settings/general/page.tsx`
- `tests/unit/components/settings/theme-switcher.test.tsx`

## Files to Modify
- `src/components/dashboard/app-sidebar.tsx` - User menu redesign
- `src/app/(dashboard)/settings/layout.tsx` - Add settings layout wrapper
- `src/app/(dashboard)/settings/page.tsx` - Redirect to /settings/general

## Acceptance Criteria
- [ ] Theme switcher shows 3 visual preview cards
- [ ] Clicking a card changes the theme
- [ ] Active theme shows checkmark indicator
- [ ] User menu has cleaner design with inline theme toggle
- [ ] Settings page has left sidebar navigation
- [ ] All pages accessible via sidebar navigation
- [ ] Mobile responsive design
- [ ] WCAG 2.1 AA accessibility compliant
