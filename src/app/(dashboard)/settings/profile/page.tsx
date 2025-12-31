import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/settings/profile-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your profile information",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch fresh user data from database (not from JWT session which can be stale)
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, image: true, password: true },
  });

  if (!dbUser) {
    redirect("/login");
  }

  const initials = getInitials(dbUser.name, dbUser.email);
  const isCredentialUser = !!dbUser.password;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Your avatar is displayed across the application
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {dbUser.image && <AvatarImage src={dbUser.image} alt={dbUser.name || "User"} />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-sm text-muted-foreground">
            Your profile picture is managed through your authentication provider.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            {isCredentialUser
              ? "Update your profile details"
              : "Update your name (email is managed by your auth provider)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={dbUser.name}
            defaultEmail={dbUser.email}
            isCredentialUser={isCredentialUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}
