"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/settings/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  defaultName?: string | null;
  defaultEmail?: string | null;
  isCredentialUser: boolean;
};

export function ProfileForm({ defaultName, defaultEmail, isCredentialUser }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    // Client-side validation
    if (!name || !name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        name: name.trim(),
        ...(isCredentialUser && email ? { email: email.trim() } : {}),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated successfully");
      router.refresh();
    });
  }

  // Key forces form to remount when default values change (after successful update)
  const formKey = `${defaultName}-${defaultEmail}`;

  return (
    <form key={formKey} action={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultName || ""}
          required
          disabled={isPending}
          className="max-w-md"
          aria-describedby="name-description"
        />
        <p id="name-description" className="text-sm text-muted-foreground">
          Your display name across the application
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail || ""}
          required
          disabled={isPending || !isCredentialUser}
          className="max-w-md"
          aria-describedby="email-description"
        />
        <p id="email-description" className="text-sm text-muted-foreground">
          {isCredentialUser
            ? "Your email address for login and notifications"
            : "Email is managed by your authentication provider (Google, GitHub, etc.)"}
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
