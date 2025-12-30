"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCookieConsent,
  type CookiePreferences,
} from "@/hooks/use-cookie-consent";

/**
 * Cookie consent banner component
 * Shows a banner at the bottom of the screen asking for cookie consent
 * Provides options to accept all, reject non-essential, or customize
 */
export function CookieConsentBanner() {
  const {
    needsConsent,
    acceptAll,
    rejectNonEssential,
    savePreferences,
  } = useCookieConsent();

  const [showCustomize, setShowCustomize] = useState(false);
  const [customPreferences, setCustomPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Don't render if consent already given
  if (!needsConsent) {
    return null;
  }

  const handleSaveCustom = () => {
    savePreferences(customPreferences);
    setShowCustomize(false);
  };

  return (
    <>
      {/* Main Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg md:p-6"
        role="dialog"
        aria-label="Cookie consent"
        data-testid="cookie-consent-banner"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h2 className="text-lg font-semibold">We value your privacy</h2>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized content, and
                analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                Read our{" "}
                <Link href="/privacy" className="text-primary underline hover:no-underline">
                  Privacy Policy
                </Link>{" "}
                to learn more.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => setShowCustomize(true)}
                data-testid="cookie-customize-btn"
              >
                Customize
              </Button>
              <Button
                variant="outline"
                onClick={rejectNonEssential}
                data-testid="cookie-reject-btn"
              >
                Reject Non-Essential
              </Button>
              <Button
                onClick={acceptAll}
                data-testid="cookie-accept-btn"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Dialog */}
      <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you want to accept. Essential cookies are always enabled as they
              are necessary for the website to function properly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Essential Cookies - Always On */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="essential" className="text-base">
                  Essential Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for the website to function. Cannot be disabled.
                </p>
              </div>
              <Switch
                id="essential"
                checked={true}
                disabled
                aria-label="Essential cookies (always enabled)"
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="text-base">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={customPreferences.analytics}
                onCheckedChange={(checked: boolean) =>
                  setCustomPreferences((prev) => ({ ...prev, analytics: checked }))
                }
                aria-label="Analytics cookies"
                data-testid="cookie-analytics-switch"
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="text-base">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={customPreferences.marketing}
                onCheckedChange={(checked: boolean) =>
                  setCustomPreferences((prev) => ({ ...prev, marketing: checked }))
                }
                aria-label="Marketing cookies"
                data-testid="cookie-marketing-switch"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setShowCustomize(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustom} data-testid="cookie-save-preferences-btn">
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
