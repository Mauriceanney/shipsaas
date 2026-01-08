"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
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
import { CharacterCount } from "@/components/ui/character-count";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createApiKeySchema,
  type CreateApiKeyInput,
} from "@/lib/validations/api-key";

type ScopeOption = {
  value: "read" | "write" | "admin";
  label: string;
  description: string;
};

const SCOPE_OPTIONS: ScopeOption[] = [
  {
    value: "read",
    label: "Read",
    description: "Access to read data (GET requests)",
  },
  {
    value: "write",
    label: "Write",
    description: "Access to modify data (POST, PUT, DELETE)",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access including admin operations",
  },
];

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
      scopes: ["read"],
    },
  });

  const name = watch("name");
  const environment = watch("environment");
  const scopes = watch("scopes");

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

  function toggleScope(scope: "read" | "write" | "admin") {
    const currentScopes = scopes || [];
    const newScopes = currentScopes.includes(scope)
      ? currentScopes.filter((s) => s !== scope)
      : [...currentScopes, scope];
    setValue("scopes", newScopes, { shouldValidate: true });
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

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Permissions</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" aria-label="Permission information" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Select the permissions this API key will have. You can select multiple permissions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                {SCOPE_OPTIONS.map((scope) => (
                  <div key={scope.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={`scope-${scope.value}`}
                      checked={scopes?.includes(scope.value) || false}
                      onCheckedChange={() => toggleScope(scope.value)}
                      disabled={isSubmitting}
                      aria-describedby={`scope-${scope.value}-description`}
                    />
                    <div className="grid gap-1 leading-none">
                      <label
                        htmlFor={`scope-${scope.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {scope.label}
                      </label>
                      <p
                        id={`scope-${scope.value}-description`}
                        className="text-sm text-muted-foreground"
                      >
                        {scope.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {errors.scopes && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.scopes.message}
                </p>
              )}
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
