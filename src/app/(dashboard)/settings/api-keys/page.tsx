import { redirect } from "next/navigation";

import { listApiKeys } from "@/actions/api-keys";
import { ApiKeyCreateForm } from "@/components/settings/api-key-create-form";
import { ApiKeyList } from "@/components/settings/api-key-list";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "API Keys - Settings",
  description: "Manage your API keys for programmatic access",
};

export default async function ApiKeysPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const result = await listApiKeys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage API keys for programmatic access to your account
        </p>
      </div>

      <ApiKeyCreateForm />

      {result.success && <ApiKeyList apiKeys={result.data} />}
      {!result.success && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
    </div>
  );
}
