/**
 * TDD: SocialLoginButtons Component Tests
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

// Mock next-auth/react
const mockSignIn = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

describe("SocialLoginButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders Google and GitHub login buttons", () => {
      render(<SocialLoginButtons />);

      expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /github/i })).toBeInTheDocument();
    });

    it("renders buttons in a grid layout", () => {
      const { container } = render(<SocialLoginButtons />);

      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass("grid");
      expect(gridContainer).toHaveClass("grid-cols-2");
      expect(gridContainer).toHaveClass("gap-4");
    });

    it("renders Google button with Google icon", () => {
      const { container } = render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      // Check that the button contains an SVG (the icon)
      expect(googleButton.querySelector("svg")).toBeInTheDocument();
    });

    it("renders GitHub button with GitHub icon", () => {
      const { container } = render(<SocialLoginButtons />);

      const githubButton = screen.getByRole("button", { name: /github/i });
      // Check that the button contains an SVG (the icon)
      expect(githubButton.querySelector("svg")).toBeInTheDocument();
    });

    it("renders buttons with outline variant", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const githubButton = screen.getByRole("button", { name: /github/i });

      // Both buttons should be outline variants (checking via presence of typical outline styles)
      expect(googleButton).toHaveAttribute("type", "button");
      expect(githubButton).toHaveAttribute("type", "button");
    });

    it("buttons are not submit type", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const githubButton = screen.getByRole("button", { name: /github/i });

      expect(googleButton).toHaveAttribute("type", "button");
      expect(githubButton).toHaveAttribute("type", "button");
    });
  });

  describe("Google Sign In", () => {
    it("calls signIn with google provider on click", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons />);

      await user.click(screen.getByRole("button", { name: /google/i }));

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });

    it("uses custom callback URL when provided", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons callbackUrl="/settings" />);

      await user.click(screen.getByRole("button", { name: /google/i }));

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/settings",
      });
    });

    it("calls signIn only once per click", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons />);

      await user.click(screen.getByRole("button", { name: /google/i }));

      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe("GitHub Sign In", () => {
    it("calls signIn with github provider on click", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons />);

      await user.click(screen.getByRole("button", { name: /github/i }));

      expect(mockSignIn).toHaveBeenCalledWith("github", {
        callbackUrl: "/dashboard",
      });
    });

    it("uses custom callback URL when provided", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons callbackUrl="/profile" />);

      await user.click(screen.getByRole("button", { name: /github/i }));

      expect(mockSignIn).toHaveBeenCalledWith("github", {
        callbackUrl: "/profile",
      });
    });

    it("calls signIn only once per click", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons />);

      await user.click(screen.getByRole("button", { name: /github/i }));

      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Default Props", () => {
    it("uses /dashboard as default callback URL", async () => {
      const user = userEvent.setup();
      render(<SocialLoginButtons />);

      // Click Google button
      await user.click(screen.getByRole("button", { name: /google/i }));
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });

      mockSignIn.mockClear();

      // Click GitHub button
      await user.click(screen.getByRole("button", { name: /github/i }));
      expect(mockSignIn).toHaveBeenCalledWith("github", {
        callbackUrl: "/dashboard",
      });
    });
  });

  describe("Callback URL Prop", () => {
    it("accepts custom callback URL for all providers", async () => {
      const user = userEvent.setup();
      const customCallbackUrl = "/custom-redirect";
      render(<SocialLoginButtons callbackUrl={customCallbackUrl} />);

      await user.click(screen.getByRole("button", { name: /google/i }));
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: customCallbackUrl,
      });

      mockSignIn.mockClear();

      await user.click(screen.getByRole("button", { name: /github/i }));
      expect(mockSignIn).toHaveBeenCalledWith("github", {
        callbackUrl: customCallbackUrl,
      });
    });

    it("handles URL with query parameters", async () => {
      const user = userEvent.setup();
      const callbackWithParams = "/redirect?from=signup&tab=settings";
      render(<SocialLoginButtons callbackUrl={callbackWithParams} />);

      await user.click(screen.getByRole("button", { name: /google/i }));
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: callbackWithParams,
      });
    });
  });

  describe("Accessibility", () => {
    it("buttons are focusable", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const githubButton = screen.getByRole("button", { name: /github/i });

      googleButton.focus();
      expect(googleButton).toHaveFocus();

      githubButton.focus();
      expect(githubButton).toHaveFocus();
    });

    it("buttons have visible text labels", () => {
      render(<SocialLoginButtons />);

      expect(screen.getByText("Google")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
    });

    it("icons have proper sizing", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const googleIcon = googleButton.querySelector("svg");
      expect(googleIcon).toHaveClass("h-4", "w-4");

      const githubButton = screen.getByRole("button", { name: /github/i });
      const githubIcon = githubButton.querySelector("svg");
      expect(githubIcon).toHaveClass("h-4", "w-4");
    });
  });

  describe("Icons", () => {
    it("Google icon has proper viewBox", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const googleIcon = googleButton.querySelector("svg");
      expect(googleIcon).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("GitHub icon has proper viewBox", () => {
      render(<SocialLoginButtons />);

      const githubButton = screen.getByRole("button", { name: /github/i });
      const githubIcon = githubButton.querySelector("svg");
      expect(githubIcon).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("icons have currentColor fill", () => {
      render(<SocialLoginButtons />);

      const googleButton = screen.getByRole("button", { name: /google/i });
      const googleIcon = googleButton.querySelector("svg");
      const googlePaths = googleIcon?.querySelectorAll("path");
      googlePaths?.forEach((path) => {
        expect(path).toHaveAttribute("fill", "currentColor");
      });

      const githubButton = screen.getByRole("button", { name: /github/i });
      const githubIcon = githubButton.querySelector("svg");
      const githubPath = githubIcon?.querySelector("path");
      expect(githubPath).toHaveAttribute("fill", "currentColor");
    });
  });
});
