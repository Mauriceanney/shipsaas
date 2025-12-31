import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/settings/profile-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your profile information",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const initials = getInitials(user.name, user.email);

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
            {user.image && <AvatarImage src={user.image} alt={user.name || "User"} />}
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
            Update your profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileForm defaultName={user.name} />
          <div className="grid gap-2 pt-4 border-t">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email || ""}
              disabled
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Email address is managed through your authentication provider.
            </p>
          </div>
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
