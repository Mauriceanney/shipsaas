import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getUserById } from "@/actions/admin/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { RoleChangeForm } from "./role-change-form";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {user.name || "Unnamed User"}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">User ID</div>
              <div className="font-mono text-sm">{user.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Name</div>
              <div>{user.name || "Not provided"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Joined</div>
              <div>
                {user.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.subscription ? (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Plan</div>
                  <Badge variant="outline">{user.subscription.plan}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <Badge
                    variant={
                      user.subscription.status === "ACTIVE"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {user.subscription.status}
                  </Badge>
                </div>
                {user.subscription.stripeCurrentPeriodEnd && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Current Period Ends
                    </div>
                    <div>
                      {user.subscription.stripeCurrentPeriodEnd.toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">
                No active subscription
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleChangeForm userId={user.id} currentRole={user.role} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {user.accounts.length > 0 ? (
              <ul className="space-y-2">
                {user.accounts.map((account: { provider: string; createdAt: Date }) => (
                  <li
                    key={account.provider}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{account.provider}</span>
                    <span className="text-sm text-muted-foreground">
                      Connected{" "}
                      {account.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">
                No connected accounts
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
