# Code Standards

Coding standards for this project.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing
- Use `type` for object shapes, `interface` for extensible contracts
- Prefer `const` over `let`

## React/Next.js

- **Server Components by default**
- Use `"use client"` only when needed (interactivity, hooks, browser APIs)
- Server Actions for data mutations
- Proper error boundaries

## Component Patterns

### Server Component (Default)
```tsx
export async function Component() {
  const data = await db.model.findMany();
  return <div>{/* render data */}</div>;
}
```

### Client Component (When Needed)
```tsx
"use client";
import { useState } from "react";

export function InteractiveComponent() {
  const [state, setState] = useState();
  return <div>{/* interactive UI */}</div>;
}
```

## Server Actions

```tsx
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ /* validation */ });

export async function action(input: z.infer<typeof schema>) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  // 2. Validate input
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  // 3. Execute
  try {
    const result = await db.model.create({ data: parsed.data });
    return { success: true, data: result };
  } catch {
    return { error: "Operation failed" };
  }
}
```

## Styling

- TailwindCSS for all styling
- Use shadcn/ui components
- Follow spacing scale (gap-2, gap-4, p-4, etc.)
- Mobile-first responsive design
