# Epic 7: Dashboard - Architecture Document

## Overview

Protected application dashboard with sidebar navigation, user menu, and settings pages.

## User Stories

### US-7.1: Dashboard Layout
- Sidebar navigation with menu items
- Header with user dropdown menu
- Dashboard home with stats
- Mobile responsive sidebar (hamburger menu)

### US-7.2: Settings Pages
- Profile settings (name, email, avatar)
- Security settings (change password)
- Notification preferences
- Billing page (already exists)

## Architecture

### Directory Structure

```
src/
├── app/(dashboard)/
│   ├── layout.tsx              # Enhanced layout with sidebar
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard home (enhanced)
│   └── settings/
│       ├── layout.tsx          # Settings layout with tabs
│       ├── page.tsx            # Redirect to profile
│       ├── profile/
│       │   └── page.tsx        # Profile settings
│       ├── security/
│       │   └── page.tsx        # Security settings
│       ├── notifications/
│       │   └── page.tsx        # Notification preferences
│       └── billing/
│           └── page.tsx        # Billing (already exists)
├── components/
│   ├── dashboard/
│   │   ├── index.ts            # Barrel export
│   │   ├── sidebar.tsx         # Sidebar navigation
│   │   ├── sidebar-nav.tsx     # Navigation items
│   │   ├── mobile-nav.tsx      # Mobile hamburger menu
│   │   ├── user-menu.tsx       # User dropdown menu
│   │   └── dashboard-header.tsx # Dashboard header
│   └── ui/
│       ├── dropdown-menu.tsx   # Dropdown menu (Radix)
│       └── sheet.tsx           # Sheet for mobile nav (Radix)
└── actions/
    └── user/
        ├── update-profile.ts   # Update user profile
        └── change-password.ts  # Change password
```

### Component Specifications

#### 1. Sidebar (`sidebar.tsx`)
```typescript
interface SidebarProps {
  className?: string;
}
```
- Fixed position on desktop
- Collapsible on mobile (via Sheet)
- Navigation items with icons
- Active route highlighting
- User section at bottom

#### 2. Sidebar Navigation (`sidebar-nav.tsx`)
```typescript
interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface SidebarNavProps {
  items: NavItem[];
}
```
- Menu items with icons
- Active state based on pathname
- Hover effects
- Disabled state support

#### 3. User Dropdown Menu (`user-menu.tsx`)
```typescript
interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}
```
- Avatar with fallback initials
- User name and email display
- Links: Profile, Settings, Billing
- Sign out button

#### 4. Mobile Navigation (`mobile-nav.tsx`)
```typescript
interface MobileNavProps {
  items: NavItem[];
}
```
- Hamburger menu trigger
- Sheet/drawer from left
- Same nav items as sidebar
- Close on navigation

#### 5. Dashboard Header (`dashboard-header.tsx`)
```typescript
interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}
```
- Mobile menu trigger (hidden on desktop)
- Page title/breadcrumbs area
- User menu on right

### Navigation Structure

```
Dashboard
├── Home (/dashboard)
└── Settings (/settings)
    ├── Profile (/settings/profile)
    ├── Security (/settings/security)
    ├── Notifications (/settings/notifications)
    └── Billing (/settings/billing)
```

### Settings Pages

#### Profile Settings (`/settings/profile`)
- Edit display name
- Email (read-only or with verification)
- Avatar upload (future enhancement)
- Save/Cancel buttons

#### Security Settings (`/settings/security`)
- Current password input
- New password input
- Confirm new password
- Password requirements display
- Change password button

#### Notification Settings (`/settings/notifications`)
- Email notification toggles:
  - Marketing emails
  - Product updates
  - Security alerts
- Save preferences button

### UI Components Needed

#### Dropdown Menu (`dropdown-menu.tsx`)
```typescript
// Radix UI wrapper
- DropdownMenu
- DropdownMenuTrigger
- DropdownMenuContent
- DropdownMenuItem
- DropdownMenuSeparator
- DropdownMenuLabel
```

#### Sheet (`sheet.tsx`)
```typescript
// Radix UI Dialog-based sheet
- Sheet
- SheetTrigger
- SheetContent
- SheetHeader
- SheetTitle
- SheetDescription
- SheetClose
```

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ [≡] ShipSaaS                    [Search] [Avatar ▼] │
├─────────┬───────────────────────────────────────────┤
│         │                                           │
│ Dashboard│  Page Content                            │
│ ────────│                                           │
│ Settings │                                          │
│  Profile │                                          │
│  Security│                                          │
│  Notifs  │                                          │
│  Billing │                                          │
│         │                                           │
├─────────┴───────────────────────────────────────────┤
│ User: email@example.com                    [Logout] │
└─────────────────────────────────────────────────────┘
```

### Responsive Behavior

**Desktop (lg+):**
- Fixed sidebar (w-64)
- Content area with left margin
- Full user menu in header

**Tablet (md):**
- Collapsible sidebar
- Sheet-based navigation

**Mobile (sm):**
- Hidden sidebar
- Hamburger menu in header
- Sheet-based navigation

### Server Actions

#### Update Profile (`actions/user/update-profile.ts`)
```typescript
export async function updateProfile(formData: FormData): Promise<ActionResult>
```
- Validate name input
- Update user in database
- Revalidate session

#### Change Password (`actions/user/change-password.ts`)
```typescript
export async function changePassword(formData: FormData): Promise<ActionResult>
```
- Validate current password
- Hash new password
- Update user in database
- Send password changed email

## Implementation Plan

### Phase 1: Core Navigation (Priority: High)
1. Create DropdownMenu UI component
2. Create Sheet UI component
3. Implement Sidebar component
4. Implement UserMenu component
5. Implement MobileNav component
6. Update dashboard layout

### Phase 2: Settings Pages (Priority: High)
1. Create settings layout with tabs/nav
2. Implement Profile settings page
3. Implement Security settings page
4. Implement Notifications settings page
5. Create server actions

### Phase 3: Dashboard Home (Priority: Medium)
1. Enhance dashboard stats display
2. Add date range selector (future)
3. Add charts (future)

## Testing Strategy

### Unit Tests
- Sidebar navigation rendering
- User menu dropdown
- Mobile navigation
- Form validation for settings
- Server actions

### Integration Tests
- Navigation between pages
- Form submissions
- Authentication state

## Definition of Done

- [ ] Sidebar navigation with icons
- [ ] User dropdown menu
- [ ] Mobile responsive navigation
- [ ] Profile settings page
- [ ] Security settings page
- [ ] Notification settings page
- [ ] All acceptance criteria met
- [ ] Unit tests passing
- [ ] TypeScript clean
- [ ] ESLint clean
