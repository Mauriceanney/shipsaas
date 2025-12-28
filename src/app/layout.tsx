import "./globals.css";

import { type Metadata, type Viewport } from "next";
import { Inter } from "next/font/google";

import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "SaaS Boilerplate",
    template: "%s | SaaS Boilerplate",
  },
  description:
    "Production-ready SaaS boilerplate with Next.js 15, TypeScript, and Prisma",
  keywords: ["saas", "boilerplate", "nextjs", "typescript", "prisma"],
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
      </body>
    </html>
  );
}
