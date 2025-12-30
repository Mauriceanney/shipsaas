import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useCookieConsent } from "@/hooks/use-cookie-consent";

describe("useCookieConsent", () => {
  let mockStorage: Record<string, string> = {};

  // Create a proper localStorage mock
  const localStorageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: vi.fn(() => {
      mockStorage = {};
    }),
    length: 0,
    key: vi.fn(() => null),
  };

  beforeEach(() => {
    // Reset storage
    mockStorage = {};

    // Replace global localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("returns pending status when no consent stored", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.status).toBe("pending");
      expect(result.current.needsConsent).toBe(true);
    });

    it("returns default preferences", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.preferences).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    it("loads stored consent from localStorage", () => {
      mockStorage["cookie-consent"] = "accepted";
      mockStorage["cookie-preferences"] = JSON.stringify({
        essential: true,
        analytics: true,
        marketing: false,
      });

      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.status).toBe("accepted");
      expect(result.current.needsConsent).toBe(false);
      expect(result.current.preferences.analytics).toBe(true);
    });
  });

  describe("acceptAll", () => {
    it("sets status to accepted", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.status).toBe("accepted");
      expect(result.current.needsConsent).toBe(false);
    });

    it("enables all cookie types", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.preferences).toEqual({
        essential: true,
        analytics: true,
        marketing: true,
      });
    });

    it("stores consent in localStorage", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cookie-consent",
        "accepted"
      );
    });
  });

  describe("rejectNonEssential", () => {
    it("sets status to rejected", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectNonEssential();
      });

      expect(result.current.status).toBe("rejected");
      expect(result.current.needsConsent).toBe(false);
    });

    it("only enables essential cookies", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectNonEssential();
      });

      expect(result.current.preferences).toEqual({
        essential: true,
        analytics: false,
        marketing: false,
      });
    });

    it("stores consent in localStorage", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectNonEssential();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "cookie-consent",
        "rejected"
      );
    });
  });

  describe("savePreferences", () => {
    it("sets status to customized", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.savePreferences({
          essential: true,
          analytics: true,
          marketing: false,
        });
      });

      expect(result.current.status).toBe("customized");
      expect(result.current.needsConsent).toBe(false);
    });

    it("saves custom preferences", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.savePreferences({
          essential: true,
          analytics: true,
          marketing: false,
        });
      });

      expect(result.current.preferences).toEqual({
        essential: true,
        analytics: true,
        marketing: false,
      });
    });

    it("always keeps essential cookies enabled", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.savePreferences({
          essential: false, // Try to disable essential
          analytics: false,
          marketing: false,
        });
      });

      // Essential should still be true
      expect(result.current.preferences.essential).toBe(true);
    });
  });

  describe("resetConsent", () => {
    it("resets to pending status", () => {
      const { result } = renderHook(() => useCookieConsent());

      // First accept
      act(() => {
        result.current.acceptAll();
      });
      expect(result.current.status).toBe("accepted");

      // Then reset
      act(() => {
        result.current.resetConsent();
      });

      expect(result.current.status).toBe("pending");
      expect(result.current.needsConsent).toBe(true);
    });

    it("clears stored consent", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      act(() => {
        result.current.resetConsent();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith("cookie-consent");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("cookie-preferences");
    });
  });

  describe("isAllowed", () => {
    it("returns true for essential cookies always", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.isAllowed("essential")).toBe(true);
    });

    it("returns false for analytics when not accepted", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.isAllowed("analytics")).toBe(false);
    });

    it("returns true for analytics when accepted", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.acceptAll();
      });

      expect(result.current.isAllowed("analytics")).toBe(true);
    });

    it("returns false for marketing when rejected", () => {
      const { result } = renderHook(() => useCookieConsent());

      act(() => {
        result.current.rejectNonEssential();
      });

      expect(result.current.isAllowed("marketing")).toBe(false);
    });
  });

  describe("isLoaded", () => {
    it("is true after initial load", () => {
      const { result } = renderHook(() => useCookieConsent());

      expect(result.current.isLoaded).toBe(true);
    });
  });
});
