import { describe, expect, it } from "vitest";

import { authConfig } from "@/lib/auth/config";

describe("authConfig", () => {
  describe("providers", () => {
    it("includes Google provider", () => {
      const googleProvider = authConfig.providers?.find((provider) => {
        const p = typeof provider === "function" ? provider : provider;
        return p.name === "Google" || (p as { id?: string }).id === "google";
      });
      expect(googleProvider).toBeDefined();
    });

    it("includes GitHub provider", () => {
      const githubProvider = authConfig.providers?.find((provider) => {
        const p = typeof provider === "function" ? provider : provider;
        return p.name === "GitHub" || (p as { id?: string }).id === "github";
      });
      expect(githubProvider).toBeDefined();
    });

    it("includes Credentials provider", () => {
      const credentialsProvider = authConfig.providers?.find((provider) => {
        const p = typeof provider === "function" ? provider : provider;
        return (
          p.name === "Credentials" ||
          (p as { id?: string }).id === "credentials"
        );
      });
      expect(credentialsProvider).toBeDefined();
    });
  });

  describe("pages", () => {
    it("configures custom sign in page", () => {
      expect(authConfig.pages?.signIn).toBe("/login");
    });

    it("configures custom error page", () => {
      expect(authConfig.pages?.error).toBe("/login");
    });

    it("configures new user redirect", () => {
      expect(authConfig.pages?.newUser).toBe("/dashboard");
    });
  });

  describe("callbacks", () => {
    it("has authorized callback defined", () => {
      expect(authConfig.callbacks?.authorized).toBeDefined();
    });

    it("has jwt callback defined", () => {
      expect(authConfig.callbacks?.jwt).toBeDefined();
    });

    it("has session callback defined", () => {
      expect(authConfig.callbacks?.session).toBeDefined();
    });
  });
});
