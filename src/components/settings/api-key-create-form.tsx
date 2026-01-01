"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

import { createApiKey } from "@/actions/api-keys";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CharacterCount } from "@/components/ui/character-count";
import {
  createApiKeySchema,
  type CreateApiKeyInput,
} from "@/lib/validations/api-key";

export function ApiKeyCreateForm() {
  const router = useRouter();
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateApiKeyInput>({
    resolver: zodResolver(createApiKeySchema),
    mode: "onBlur",
    defaultValues: {
      environment: "live",
    },
  });

  const name = watch("name");
  const environment = watch("environment");

  const onSubmit = async (data: CreateApiKeyInput) => {
    const result = await createApiKey(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // Show the generated key in a modal (only time it's displayed)
    setGeneratedKey(result.data.key);
    setShowKeyDialog(true);
    reset();
    router.refresh();
  };

  async function handleCopyKey() {
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCloseDialog() {
    setShowKeyDialog(false);
    setGeneratedKey("");
    setCopied(false);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
          <CardDescription>
            Generate a new API key for programmatic access to your account
          </CardDescription>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Name</Label>
                <CharacterCount current={name?.length || 0} max={100} />
              </div>
              <Input
                id="name"
                placeholder="e.g., Production Server"
                disabled={isSubmitting}
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
                  A descriptive name to help you identify this key
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <Select
                value={environment}
                onValueChange={(value) =>
                  setValue("environment", value as "live" | "test")
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="environment" aria-label="Environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="test">Test</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose the environment for this API key
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create API Key"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showKeyDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>API Key Created Successfully</DialogTitle>
            <DialogDescription>
              Copy your API key now. For security reasons, you won&apos;t be able to
              see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                  {generatedKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  aria-label="Copy API key"
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Store this key securely. It provides access to your account and
                cannot be recovered if lost.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
