"use client";

import { useSessionValidation } from "@/hooks/use-session-validation";

export function SessionValidationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionValidation();
  return <>{children}</>;
}
