import "./globals.css";

import { Inter } from "next/font/google";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { cn } from "@/lib/utils";

import type { Metadata, Viewport } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "ShipSaaS - Build Your SaaS Faster",
    template: "%s | ShipSaaS",
  },
  description:
    "Production-ready SaaS boilerplate with authentication, payments, email, and more. Ship your SaaS in days, not months.",
  keywords: [
    "saas",
    "boilerplate",
    "nextjs",
    "typescript",
    "prisma",
    "stripe",
    "authentication",
    "starter kit",
  ],
  authors: [{ name: "ShipSaaS" }],
  creator: "ShipSaaS",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "ShipSaaS",
    title: "ShipSaaS - Build Your SaaS Faster",
    description:
      "Production-ready SaaS boilerplate with authentication, payments, email, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShipSaaS - Build Your SaaS Faster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipSaaS - Build Your SaaS Faster",
    description:
      "Production-ready SaaS boilerplate with authentication, payments, email, and more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
