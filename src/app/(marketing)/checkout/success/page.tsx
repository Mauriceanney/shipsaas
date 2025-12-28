import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Checkout Success",
  description: "Your subscription is now active",
};

export default async function CheckoutSuccessPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="container py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Thank you for subscribing!
        </h1>

        <p className="text-muted-foreground mb-8">
          Your subscription is now active. You have full access to all the features
          included in your plan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/billing">View Billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
