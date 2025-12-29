# Epic 9: Admin Dashboard Architecture

## Overview

Admin dashboard for user management, subscription configuration, and app settings with role-based access control.

## Current State

**Already Implemented:**
- Role enum (USER, ADMIN) in Prisma schema
- Role stored in JWT and session
- TypeScript types for role
- Dashboard layout with collapsible sidebar
- Pagination utilities
- UI components (Card, Badge, Button, etc.)

## Directory Structure

```
src/
├── app/
│   └── (admin)/
│       ├── layout.tsx              # Admin layout with RBAC
│       ├── admin/
│       │   └── page.tsx            # Admin dashboard
│       ├── admin/users/
│       │   ├── page.tsx            # User management
│       │   └── [id]/page.tsx       # User detail
│       ├── admin/plans/
│       │   └── page.tsx            # Plan configuration
│       └── admin/settings/
│           └── page.tsx            # App configuration
├── components/
│   └── admin/
│       ├── index.ts
│       ├── admin-sidebar.tsx       # Admin navigation
│       ├── user-table.tsx          # User management table
│       └── stats-card.tsx          # Admin stats
├── actions/
│   └── admin/
│       ├── users.ts                # User management actions
│       └── config.ts               # Config management actions
└── lib/
    └── admin.ts                    # Admin utilities
```

## Database Schema Additions

```prisma
model AppConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json
  description String?
  category    String   // "general", "features", "billing"
  updatedAt   DateTime @updatedAt
  updatedBy   String?

  @@index([category])
}

model PlanConfig {
  id                String   @id @default(cuid())
  plan              Plan     @unique
  name              String
  monthlyPriceId    String?
  yearlyPriceId     String?
  monthlyPrice      Int      // cents
  yearlyPrice       Int      // cents
  features          String[] // Feature list
  isActive          Boolean  @default(true)
  updatedAt         DateTime @updatedAt

  @@index([isActive])
}
```

## Components

### AdminSidebar
- Admin-specific navigation
- Links to users, plans, settings
- User count, active subscriptions stats

### UserTable
- Paginated user list
- Search by name/email
- Filter by role, status
- Actions: change role, disable/enable

### StatsCard
- Reusable stats display
- Icon, title, value, change indicator

## API Endpoints

### Admin Actions (Server Actions)
- `getUsers(params)` - Paginated user list
- `getUserById(id)` - User detail
- `updateUserRole(id, role)` - Change role
- `toggleUserStatus(id)` - Enable/disable
- `getAppConfig()` - Get all config
- `updateAppConfig(key, value)` - Update config

## Access Control

### Middleware
```typescript
// src/lib/admin.ts
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}
```

### Layout Protection
```typescript
// src/app/(admin)/layout.tsx
export default async function AdminLayout({ children }) {
  await requireAdmin();
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
```

## Implementation Phases

### Phase 1: Foundation
- [x] Admin role check utility
- [x] Admin layout with protection
- [x] Admin sidebar navigation

### Phase 2: User Management
- [ ] User table component
- [ ] User list page with search/filter
- [ ] User detail page
- [ ] Role change action
- [ ] Toggle user status action

### Phase 3: Configuration
- [ ] Add PlanConfig model to schema
- [ ] Plan configuration UI
- [ ] Add AppConfig model to schema
- [ ] Feature flags UI
- [ ] App settings UI

## Testing Strategy

### Unit Tests
- Admin utilities (requireAdmin)
- User table rendering
- Stats card component

### Integration Tests
- Admin route protection
- User management actions
- Config CRUD operations
