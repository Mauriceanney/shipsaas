import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the auth module before importing the action
vi.mock("@/lib/auth", () => ({
  signOut: vi.fn(),
}));

import { logoutAction } from "@/actions/auth/logout";
import { signOut } from "@/lib/auth";

describe("logoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls signOut with redirect to login", async () => {
    const mockSignOut = vi.mocked(signOut);
    mockSignOut.mockResolvedValue(undefined);

    await logoutAction();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("propagates signOut errors", async () => {
    const mockSignOut = vi.mocked(signOut);
    const error = new Error("SignOut failed");
    mockSignOut.mockRejectedValue(error);

    await expect(logoutAction()).rejects.toThrow("SignOut failed");
  });
});
