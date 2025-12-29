# Code Standards

Comprehensive coding standards for SaaS development with Next.js 15 and TypeScript.

## TypeScript Standards

### Strict Mode Requirements

- `strict: true` in tsconfig.json
- No `any` types - use proper typing or `unknown`
- No non-null assertions (`!`) without justification
- Prefer `type` for object shapes, `interface` for extensible contracts
- Use `const` over `let`, never `var`

### Type Patterns

```typescript
// Action results - always use discriminated unions
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// Props types
type ComponentProps = {
  id: string;
  title: string;
  onAction?: () => void;
};

// Inferred types from Zod
import { z } from "zod";
const schema = z.object({ name: z.string() });
type InputType = z.infer<typeof schema>;

// Prisma types
import type { User, Post } from "@prisma/client";
type UserWithPosts = User & { posts: Post[] };
```

## Next.js 15 Patterns

### Server Components (Default)

```tsx
// src/components/feature/feature-list.tsx
// No "use client" = Server Component

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function FeatureList() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const items = await db.feature.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Client Components (When Needed)

Only use `"use client"` when you need:
- Event handlers (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useTransition)
- Browser APIs (localStorage, geolocation)

```tsx
// src/components/feature/feature-form.tsx
"use client";

import { useTransition } from "react";
import { createFeature } from "@/actions/feature/create";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FeatureForm() {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createFeature({
        name: formData.get("name") as string,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Created!");
    });
  }

  return (
    <form action={handleSubmit}>
      <input name="name" required />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

### Server Actions

```typescript
// src/actions/feature/create.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createFeatureSchema } from "@/lib/validations/feature";

export async function createFeature(input: unknown) {
  // 1. Authentication (ALWAYS first)
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" } as const;
  }

  // 2. Validation (ALWAYS second)
  const parsed = createFeatureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid input" } as const;
  }

  // 3. Authorization (if needed)
  // Check user has permission

  // 4. Business logic
  try {
    const feature = await db.feature.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
      },
    });

    // 5. Cache revalidation
    revalidatePath("/dashboard/features");

    return { success: true, data: feature } as const;
  } catch (error) {
    console.error("[createFeature]", error);
    return { success: false, error: "Failed to create feature" } as const;
  }
}
```

## Styling with TailwindCSS

### Conventions

```tsx
// Spacing scale
className="p-4"      // 16px padding
className="gap-4"    // 16px gap
className="space-y-4" // 16px vertical spacing

// Typography
className="text-sm text-muted-foreground"  // Secondary text
className="text-lg font-semibold"          // Heading

// Responsive (mobile-first)
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// State variants
className="hover:bg-accent focus:ring-2"
```

### Component Styling

```tsx
// Use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Description</p>
        <Button className="mt-4">Action</Button>
      </CardContent>
    </Card>
  );
}
```

## File Organization

### Directory Structure

```
src/
├── actions/[domain]/       # Server Actions by domain
│   ├── index.ts           # Re-exports
│   ├── create.ts
│   ├── update.ts
│   └── delete.ts
├── components/[feature]/   # Components by feature
│   ├── index.ts           # Re-exports
│   ├── feature-list.tsx   # Server Component
│   ├── feature-form.tsx   # Client Component
│   └── feature-card.tsx   # Server Component
├── lib/
│   ├── validations/       # Zod schemas
│   ├── auth/              # Auth utilities
│   └── db/                # Database client
└── app/
    └── (dashboard)/       # Route groups
        └── feature/
            ├── page.tsx   # List page
            └── [id]/
                └── page.tsx # Detail page
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FeatureList.tsx` |
| Files | kebab-case | `feature-list.tsx` |
| Actions | camelCase | `createFeature` |
| Types | PascalCase | `FeatureInput` |
| Constants | UPPER_SNAKE | `MAX_ITEMS` |

## Error Handling

### Never Throw, Always Return

```typescript
// WRONG
if (!user) {
  throw new Error("User not found");
}

// CORRECT
if (!user) {
  return { success: false, error: "User not found" };
}
```

### Error Messages

| Scenario | Message |
|----------|---------|
| Not authenticated | "Unauthorized" |
| Not authorized | "Forbidden" |
| Not found | "Not found" |
| Validation failed | Specific field error |
| Server error | "Operation failed" |

## Import Order

```typescript
// 1. React/Next.js
import { Suspense } from "react";
import { notFound } from "next/navigation";

// 2. Third-party
import { z } from "zod";

// 3. Internal - lib
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// 4. Internal - components
import { Button } from "@/components/ui/button";

// 5. Internal - types
import type { Feature } from "@prisma/client";

// 6. Relative
import { FeatureCard } from "./feature-card";
```

## Comments

Only add comments when:
- Logic is non-obvious
- There's a workaround or hack
- Business rules need documentation

```typescript
// DON'T
// Get the user
const user = await getUser();

// DO
// Stripe requires the customer ID before creating a subscription,
// so we create it lazily on first checkout
const customerId = user.stripeCustomerId ?? await createStripeCustomer(user);
```
