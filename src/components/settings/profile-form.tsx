"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { updateProfile } from "@/actions/settings/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CharacterCount } from "@/components/ui/character-count";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile";

type ProfileFormProps = {
  defaultName?: string | null;
  defaultEmail?: string | null;
  isCredentialUser: boolean;
};

export function ProfileForm({
  defaultName,
  defaultEmail,
  isCredentialUser,
}: ProfileFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onBlur",
    defaultValues: {
      name: defaultName || "",
      email: defaultEmail || undefined,
    },
  });

  const name = watch("name");

  const onSubmit = async (data: UpdateProfileInput) => {
    const result = await updateProfile({
      name: data.name.trim(),
      ...(isCredentialUser && data.email ? { email: data.email.trim() } : {}),
    });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Profile updated successfully");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="name">Name</Label>
          <CharacterCount current={name?.length || 0} max={100} />
        </div>
        <Input
          id="name"
          type="text"
          disabled={isSubmitting}
          className="max-w-md"
          required
          aria-invalid={!!errors.name}
          aria-describedby={
            errors.name ? "name-error" : "name-description"
          }
          {...register("name")}
        />
        {errors.name && (
          <p
            id="name-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.name.message}
          </p>
        )}
        {!errors.name && (
          <p id="name-description" className="text-sm text-muted-foreground">
            Your display name across the application
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          disabled={isSubmitting || !isCredentialUser}
          className="max-w-md"
          required
          aria-invalid={!!errors.email}
          aria-describedby={
            errors.email ? "email-error" : "email-description"
          }
          {...register("email")}
        />
        {errors.email && (
          <p
            id="email-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.email.message}
          </p>
        )}
        {!errors.email && (
          <p id="email-description" className="text-sm text-muted-foreground">
            {isCredentialUser
              ? "Your email address for login and notifications"
              : "Email is managed by your authentication provider (Google, GitHub, etc.)"}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
