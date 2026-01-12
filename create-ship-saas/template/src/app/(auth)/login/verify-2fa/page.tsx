import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TwoFactorVerify } from "@/components/auth/two-factor";

const PENDING_2FA_COOKIE = "pending_2fa_user_id";

export default async function Verify2FAPage() {
  // Check if there's a pending 2FA verification
  const cookieStore = await cookies();
  const pendingUserId = cookieStore.get(PENDING_2FA_COOKIE)?.value;

  if (!pendingUserId) {
    // No pending 2FA, redirect to login
    redirect("/login");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <TwoFactorVerify />
    </div>
  );
}
