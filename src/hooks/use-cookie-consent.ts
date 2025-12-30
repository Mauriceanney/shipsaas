"use client";

import { useState, useEffect, useCallback } from "react";

export type CookieConsentStatus = "pending" | "accepted" | "rejected" | "customized";

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_PREFERENCES_KEY = "cookie-preferences";

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

/**
 * Hook for managing cookie consent state
 * Stores preferences in localStorage and sets a cookie for server-side reading
 */
export function useCookieConsent() {
  const [status, setStatus] = useState<CookieConsentStatus>("pending");
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedStatus = localStorage.getItem(COOKIE_CONSENT_KEY) as CookieConsentStatus | null;
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (savedStatus && savedPreferences) {
      setStatus(savedStatus);
      try {
        const parsed = JSON.parse(savedPreferences) as CookiePreferences;
        // Ensure essential is always true
        setPreferences({ ...parsed, essential: true });
      } catch {
        setPreferences(DEFAULT_PREFERENCES);
      }
    }

    setIsLoaded(true);
  }, []);

  // Set cookie for server-side access
  const setCookieConsentCookie = useCallback((value: CookieConsentStatus) => {
    const maxAge = 365 * 24 * 60 * 60; // 1 year
    document.cookie = `${COOKIE_CONSENT_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    };

    setStatus("accepted");
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setCookieConsentCookie("accepted");
  }, [setCookieConsentCookie]);

  // Reject non-essential cookies
  const rejectNonEssential = useCallback(() => {
    const newPreferences: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    };

    setStatus("rejected");
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setCookieConsentCookie("rejected");
  }, [setCookieConsentCookie]);

  // Save custom preferences
  const savePreferences = useCallback((customPreferences: Partial<CookiePreferences>) => {
    const newPreferences: CookiePreferences = {
      essential: true, // Always true
      analytics: customPreferences.analytics ?? false,
      marketing: customPreferences.marketing ?? false,
    };

    setStatus("customized");
    setPreferences(newPreferences);
    localStorage.setItem(COOKIE_CONSENT_KEY, "customized");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));
    setCookieConsentCookie("customized");
  }, [setCookieConsentCookie]);

  // Reset consent (for testing or user request)
  const resetConsent = useCallback(() => {
    setStatus("pending");
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; max-age=0`;
  }, []);

  // Check if consent is needed (banner should show)
  const needsConsent = isLoaded && status === "pending";

  // Check if specific cookie type is allowed
  const isAllowed = useCallback((type: keyof CookiePreferences): boolean => {
    if (type === "essential") return true;
    return preferences[type];
  }, [preferences]);

  return {
    status,
    preferences,
    isLoaded,
    needsConsent,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    resetConsent,
    isAllowed,
  };
}
