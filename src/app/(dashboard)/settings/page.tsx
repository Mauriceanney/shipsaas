import { CreditCard, FileText, Shield, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

import type { LucideIcon } from "lucide-react";
import type { Metadata, Route } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings",
};

interface SettingsItem {
  title: string;
  description: string;
  href: Route;
  icon: LucideIcon;
}

const settingsItems: SettingsItem[] = [
  {
    title: "Profile",
    description: "Manage your personal information and preferences",
    href: "/settings/profile" as Route,
    icon: User,
  },
  {
    title: "Security",
    description: "Update your password and security settings",
    href: "/settings/security" as Route,
    icon: Shield,
  },
  {
    title: "Billing",
    description: "Manage your subscription and payment methods",
    href: "/settings/billing" as Route,
    icon: CreditCard,
  },
  {
    title: "Privacy",
    description: "Export your data and manage privacy settings",
    href: "/settings/privacy" as Route,
    icon: FileText,
  },
];

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
