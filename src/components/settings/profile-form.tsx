"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/settings/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  defaultName?: string | null;
};

export function ProfileForm({ defaultName }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string;

    // Client-side validation
    if (!name || !name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      const result = await updateProfile({
        name: name.trim(),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Profile updated successfully");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
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
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
