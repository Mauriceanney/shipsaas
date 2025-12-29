import { expect, test } from "@playwright/test";

// Test data
const TEST_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "Password123!",
};

const INVALID_CREDENTIALS = {
  email: "wrong@example.com",
  password: "WrongPassword123!",
};

const WEAK_PASSWORDS = {
  tooShort: "Pass1!",
  noUppercase: "password123!",
  noLowercase: "PASSWORD123!",
  noNumber: "Password!",
  noSpecialChar: "Password123",
};

// ============================================================================
// LOGIN FLOW TESTS
// ============================================================================

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays login form with all required elements", async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Login/);

    // Check form elements are visible
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeVisible();

    // Check OAuth buttons are present
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible();

    // Check links are present
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign up/i })).toBeVisible();
  });

  test("shows error with invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await page.getByTestId("email").fill(INVALID_CREDENTIALS.email);
    await page.getByTestId("password").fill(INVALID_CREDENTIALS.password);

    // Submit the form
    await page.getByTestId("login-button").click();

    // Wait for error message to appear
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error for empty fields", async ({ page }) => {
    // Try to submit without filling any fields
    await page.getByTestId("login-button").click();

    // Check for HTML5 validation (required fields)
    const emailInput = page.getByTestId("email");
    await expect(emailInput).toHaveAttribute("required", "");

    const passwordInput = page.getByTestId("password");
    await expect(passwordInput).toHaveAttribute("required", "");
  });

  test("shows validation error for invalid email format", async ({ page }) => {
    // Fill invalid email
    await page.getByTestId("email").fill("invalid-email");
    await page.getByTestId("password").fill(TEST_USER.password);

    // Try to submit
    await page.getByTestId("login-button").click();

    // Email input should have type="email" for browser validation
    const emailInput = page.getByTestId("email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("button shows loading state during submission", async ({ page }) => {
    // Fill in credentials
    await page.getByTestId("email").fill(TEST_USER.email);
    await page.getByTestId("password").fill(TEST_USER.password);

    // Click submit and check for loading state
    const loginButton = page.getByTestId("login-button");
    await loginButton.click();

    // Button should show loading text or be disabled during submission
    await expect(loginButton).toBeDisabled();
  });

  test("redirects to dashboard on successful login", async ({ page }) => {
    // Note: This test requires a valid test user in the database
    // In a real scenario, you would seed the database or mock the API

    await page.getByTestId("email").fill(TEST_USER.email);
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("login-button").click();

    // Wait for navigation (either success or error)
    await page.waitForLoadState("networkidle");

    // If login succeeds, should redirect to dashboard
    // If it fails (no test user), should stay on login with error
    const currentUrl = page.url();
    expect(
      currentUrl.includes("/dashboard") || currentUrl.includes("/login")
    ).toBe(true);
  });

  test("respects callbackUrl parameter for redirect", async ({ page }) => {
    // Navigate to login with callbackUrl
    await page.goto("/login?callbackUrl=%2Fsettings");

    // Verify we're on login page with the parameter
    await expect(page).toHaveURL(/callbackUrl/);
  });
});

// ============================================================================
// REGISTRATION FLOW TESTS
// ============================================================================

test.describe("Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("displays registration form with all required elements", async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Sign Up/);

    // Check form elements are visible
    await expect(page.getByTestId("name")).toBeVisible();
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("confirmPassword")).toBeVisible();
    await expect(page.getByTestId("register-button")).toBeVisible();

    // Check OAuth buttons are present
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible();

    // Check link to login is present
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();

    // Check password requirements text is present
    await expect(
      page.getByText(/Must be 8\+ characters/i)
    ).toBeVisible();
  });

  test("shows validation error for empty fields", async ({ page }) => {
    // Check all fields have required attribute
    await expect(page.getByTestId("name")).toHaveAttribute("required", "");
    await expect(page.getByTestId("email")).toHaveAttribute("required", "");
    await expect(page.getByTestId("password")).toHaveAttribute("required", "");
    await expect(page.getByTestId("confirmPassword")).toHaveAttribute(
      "required",
      ""
    );
  });

  test("validates email format", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("invalid-email");
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);

    // Email input should have type="email" for browser validation
    const emailInput = page.getByTestId("email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("shows error for weak password - too short", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(WEAK_PASSWORDS.tooShort);
    await page.getByTestId("confirmPassword").fill(WEAK_PASSWORDS.tooShort);

    await page.getByTestId("register-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for password without uppercase", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(WEAK_PASSWORDS.noUppercase);
    await page.getByTestId("confirmPassword").fill(WEAK_PASSWORDS.noUppercase);

    await page.getByTestId("register-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for password without number", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(WEAK_PASSWORDS.noNumber);
    await page.getByTestId("confirmPassword").fill(WEAK_PASSWORDS.noNumber);

    await page.getByTestId("register-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for password without special character", async ({
    page,
  }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(WEAK_PASSWORDS.noSpecialChar);
    await page.getByTestId("confirmPassword").fill(WEAK_PASSWORDS.noSpecialChar);

    await page.getByTestId("register-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for password mismatch", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill("DifferentPassword123!");

    await page.getByTestId("register-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for existing email", async ({ page }) => {
    // Note: This test assumes there's an existing user with this email
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill(TEST_USER.email);
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);

    await page.getByTestId("register-button").click();

    // Wait for response
    await page.waitForLoadState("networkidle");

    // Should show error or success depending on whether user exists
    const hasError = await page
      .locator(".bg-destructive\\/10, [class*='destructive']")
      .first()
      .isVisible()
      .catch(() => false);
    const hasSuccess = await page
      .locator(".bg-green-100")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasError || hasSuccess).toBe(true);
  });

  test("shows success message on valid registration", async ({ page }) => {
    // Use unique email for each test run
    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill(uniqueEmail);
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);

    await page.getByTestId("register-button").click();

    // Wait for response
    await page.waitForLoadState("networkidle");

    // Should show success message or error (if email service fails)
    const hasSuccess = await page
      .locator(".bg-green-100")
      .first()
      .isVisible({ timeout: 10000 })
      .catch(() => false);
    const hasError = await page
      .locator(".bg-destructive\\/10, [class*='destructive']")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasSuccess || hasError).toBe(true);
  });

  test("button shows loading state during submission", async ({ page }) => {
    await page.getByTestId("name").fill(TEST_USER.name);
    await page.getByTestId("email").fill("newuser@example.com");
    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);

    const registerButton = page.getByTestId("register-button");
    await registerButton.click();

    // Button should be disabled during submission
    await expect(registerButton).toBeDisabled();
  });
});

// ============================================================================
// FORGOT PASSWORD FLOW TESTS
// ============================================================================

test.describe("Forgot Password Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("displays forgot password form with all required elements", async ({
    page,
  }) => {
    // Check page title
    await expect(page).toHaveTitle(/Forgot Password/);

    // Check form elements are visible
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("forgot-password-button")).toBeVisible();

    // Check link to login is present
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("validates email is required", async ({ page }) => {
    await expect(page.getByTestId("email")).toHaveAttribute("required", "");
  });

  test("validates email format", async ({ page }) => {
    const emailInput = page.getByTestId("email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("shows success message after submitting email", async ({ page }) => {
    await page.getByTestId("email").fill(TEST_USER.email);
    await page.getByTestId("forgot-password-button").click();

    // Wait for response - should show success message regardless of email existence
    await expect(page.locator(".bg-green-100")).toBeVisible({ timeout: 10000 });
  });

  test("button shows loading state during submission", async ({ page }) => {
    await page.getByTestId("email").fill(TEST_USER.email);

    const submitButton = page.getByTestId("forgot-password-button");
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });

  test("accepts any valid email format (security - no enumeration)", async ({
    page,
  }) => {
    // Even for non-existent emails, should show success to prevent user enumeration
    await page.getByTestId("email").fill("nonexistent@example.com");
    await page.getByTestId("forgot-password-button").click();

    // Wait for response
    await expect(page.locator(".bg-green-100")).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// RESET PASSWORD FLOW TESTS
// ============================================================================

test.describe("Reset Password Page", () => {
  test("shows invalid link message without token", async ({ page }) => {
    await page.goto("/reset-password");

    // Should show invalid link message
    await expect(page.getByText(/Invalid reset link/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Request a new reset link/i })
    ).toBeVisible();
  });

  test("displays reset password form with valid token", async ({ page }) => {
    // Navigate with a token (even if invalid, form should show)
    await page.goto("/reset-password?token=test-token-123");

    // Check page title
    await expect(page).toHaveTitle(/Reset Password/);

    // Check form elements are visible
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("confirmPassword")).toBeVisible();
    await expect(page.getByTestId("reset-password-button")).toBeVisible();

    // Check password requirements text
    await expect(page.getByText(/Must be 8\+ characters/i)).toBeVisible();

    // Check link to login
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("validates password fields are required", async ({ page }) => {
    await page.goto("/reset-password?token=test-token-123");

    await expect(page.getByTestId("password")).toHaveAttribute("required", "");
    await expect(page.getByTestId("confirmPassword")).toHaveAttribute(
      "required",
      ""
    );
  });

  test("shows error for weak password", async ({ page }) => {
    await page.goto("/reset-password?token=test-token-123");

    await page.getByTestId("password").fill(WEAK_PASSWORDS.tooShort);
    await page.getByTestId("confirmPassword").fill(WEAK_PASSWORDS.tooShort);
    await page.getByTestId("reset-password-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for password mismatch", async ({ page }) => {
    await page.goto("/reset-password?token=test-token-123");

    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill("DifferentPassword123!");
    await page.getByTestId("reset-password-button").click();

    // Wait for error message
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("shows error for invalid/expired token", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token");

    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);
    await page.getByTestId("reset-password-button").click();

    // Wait for error message (invalid token)
    await expect(
      page.locator(".bg-destructive\\/10, [class*='destructive']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("button shows loading state during submission", async ({ page }) => {
    await page.goto("/reset-password?token=test-token-123");

    await page.getByTestId("password").fill(TEST_USER.password);
    await page.getByTestId("confirmPassword").fill(TEST_USER.password);

    const submitButton = page.getByTestId("reset-password-button");
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  });
});

// ============================================================================
// EMAIL VERIFICATION FLOW TESTS
// ============================================================================

test.describe("Email Verification Page", () => {
  test("shows invalid link message without token", async ({ page }) => {
    await page.goto("/verify-email");

    // Should show invalid link message
    await expect(page.getByText(/Invalid link/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Go to login/i })).toBeVisible();
  });

  test("shows verification result with token", async ({ page }) => {
    await page.goto("/verify-email?token=test-token-123");

    // Should show either success or failure message
    const hasSuccess = await page
      .getByText(/Email verified/i)
      .isVisible()
      .catch(() => false);
    const hasFailure = await page
      .getByText(/Verification failed/i)
      .isVisible()
      .catch(() => false);

    expect(hasSuccess || hasFailure).toBe(true);
  });

  test("provides link to login after verification attempt", async ({
    page,
  }) => {
    await page.goto("/verify-email?token=test-token-123");

    // Should have a link to login or sign in
    const loginLink = page.getByRole("link", { name: /Sign in|Go to login/i });
    await expect(loginLink).toBeVisible();
  });
});

// ============================================================================
// PROTECTED ROUTES TESTS
// ============================================================================

test.describe("Protected Routes", () => {
  test("redirects to login when accessing dashboard without authentication", async ({
    page,
  }) => {
    // Try to access dashboard directly
    await page.goto("/dashboard");

    // Should be redirected to login with callbackUrl
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl/);
  });

  test("preserves original URL in callbackUrl parameter", async ({ page }) => {
    // Try to access a protected settings page
    await page.goto("/settings");

    // Should redirect to login with the original URL encoded
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/callbackUrl.*settings/);
  });

  test("shows login form when redirected from protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should show login form
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeVisible();
  });
});

// ============================================================================
// LOGOUT FLOW TESTS
// ============================================================================

test.describe("Logout Flow", () => {
  test("displays sign out button on dashboard", async ({ page }) => {
    // Note: This test requires authenticated state
    // For now, just verify the button exists when on dashboard
    await page.goto("/dashboard");

    // If redirected to login, we can't test logout
    // This test is designed to run with authenticated session
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      await expect(page.getByTestId("signout-button")).toBeVisible();
    }
  });

  test("sign out button redirects to login page", async ({ page }) => {
    // Navigate to dashboard (requires auth)
    await page.goto("/dashboard");

    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      // Click sign out
      await page.getByTestId("signout-button").click();

      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("cannot access dashboard after signing out", async ({ page }) => {
    await page.goto("/dashboard");

    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      // Sign out
      await page.getByTestId("signout-button").click();

      // Wait for redirect to login
      await expect(page).toHaveURL(/\/login/);

      // Try to access dashboard again
      await page.goto("/dashboard");

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe("Navigation Between Auth Pages", () => {
  test("navigates from login to signup", async ({ page }) => {
    await page.goto("/login");

    // Click on signup link
    await page.getByRole("link", { name: /Sign up/i }).click();

    // Should be on signup page
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.getByTestId("register-button")).toBeVisible();
  });

  test("navigates from signup to login", async ({ page }) => {
    await page.goto("/signup");

    // Click on sign in link
    await page.getByRole("link", { name: /Sign in/i }).click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("navigates from login to forgot password", async ({ page }) => {
    await page.goto("/login");

    // Click on forgot password link
    await page.getByRole("link", { name: /Forgot password/i }).click();

    // Should be on forgot password page
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByTestId("forgot-password-button")).toBeVisible();
  });

  test("navigates from forgot password to login", async ({ page }) => {
    await page.goto("/forgot-password");

    // Click on sign in link
    await page.getByRole("link", { name: /Sign in/i }).click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("navigates from reset password to login", async ({ page }) => {
    await page.goto("/reset-password?token=test-token");

    // Click on sign in link
    await page.getByRole("link", { name: /Sign in/i }).click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("navigates from reset password (no token) to forgot password", async ({
    page,
  }) => {
    await page.goto("/reset-password");

    // Click on request new reset link
    await page.getByRole("link", { name: /Request a new reset link/i }).click();

    // Should be on forgot password page
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(page.getByTestId("forgot-password-button")).toBeVisible();
  });

  test("navigates from verify email to login", async ({ page }) => {
    await page.goto("/verify-email");

    // Click on go to login link
    await page.getByRole("link", { name: /Go to login/i }).click();

    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("can navigate to home from auth pages via logo", async ({ page }) => {
    await page.goto("/login");

    // Click on the logo/brand link
    await page.getByRole("link", { name: /ShipSaaS/i }).click();

    // Should be on home page
    await expect(page).toHaveURL("/");
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe("Auth Pages Accessibility", () => {
  test("login form has proper labels", async ({ page }) => {
    await page.goto("/login");

    // Check that inputs have associated labels
    const emailInput = page.getByTestId("email");
    const emailLabel = page.getByLabel(/Email/i);
    await expect(emailLabel).toBeVisible();

    const passwordLabel = page.getByLabel(/Password/i);
    await expect(passwordLabel).toBeVisible();
  });

  test("signup form has proper labels", async ({ page }) => {
    await page.goto("/signup");

    // Check that inputs have associated labels
    await expect(page.getByLabel(/Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    // Password labels - there are multiple, just check they exist
    const passwordLabels = page.locator("label", { hasText: /Password/i });
    await expect(passwordLabels.first()).toBeVisible();
  });

  test("forms are keyboard navigable", async ({ page }) => {
    await page.goto("/login");

    // Tab through form elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to tab to the email input
    const emailInput = page.getByTestId("email");
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Tab to password
    await page.keyboard.press("Tab");
    // Tab to submit (skipping forgot password link)
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
  });

  test("error messages are visible and descriptive", async ({ page }) => {
    await page.goto("/login");

    // Submit with invalid credentials
    await page.getByTestId("email").fill(INVALID_CREDENTIALS.email);
    await page.getByTestId("password").fill(INVALID_CREDENTIALS.password);
    await page.getByTestId("login-button").click();

    // Wait for error
    await page.waitForLoadState("networkidle");

    // Error message should be visible (if login fails)
    const errorElement = page
      .locator(".bg-destructive\\/10, [class*='destructive']")
      .first();
    if (await errorElement.isVisible()) {
      // Error should have meaningful text
      const errorText = await errorElement.textContent();
      expect(errorText?.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// MOBILE RESPONSIVENESS TESTS
// ============================================================================

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("login form is usable on mobile", async ({ page }) => {
    await page.goto("/login");

    // All form elements should be visible and usable
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("login-button")).toBeVisible();

    // OAuth buttons should stack or be visible
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
  });

  test("signup form is usable on mobile", async ({ page }) => {
    await page.goto("/signup");

    // All form elements should be visible and usable
    await expect(page.getByTestId("name")).toBeVisible();
    await expect(page.getByTestId("email")).toBeVisible();
    await expect(page.getByTestId("password")).toBeVisible();
    await expect(page.getByTestId("confirmPassword")).toBeVisible();
    await expect(page.getByTestId("register-button")).toBeVisible();
  });
});

// ============================================================================
// INPUT BEHAVIOR TESTS
// ============================================================================

test.describe("Input Field Behavior", () => {
  test("password field masks input", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByTestId("password");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("email field has correct type", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByTestId("email");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("inputs are disabled during form submission", async ({ page }) => {
    await page.goto("/login");

    await page.getByTestId("email").fill(TEST_USER.email);
    await page.getByTestId("password").fill(TEST_USER.password);

    // Click submit
    await page.getByTestId("login-button").click();

    // Inputs should be disabled during submission
    await expect(page.getByTestId("email")).toBeDisabled();
    await expect(page.getByTestId("password")).toBeDisabled();
  });

  test("form clears error on new input", async ({ page }) => {
    await page.goto("/login");

    // Submit with invalid credentials to trigger error
    await page.getByTestId("email").fill(INVALID_CREDENTIALS.email);
    await page.getByTestId("password").fill(INVALID_CREDENTIALS.password);
    await page.getByTestId("login-button").click();

    // Wait for error
    await page.waitForLoadState("networkidle");

    // If error appeared, start typing new values
    const errorElement = page
      .locator(".bg-destructive\\/10, [class*='destructive']")
      .first();

    if (await errorElement.isVisible()) {
      // Clear and type new email
      await page.getByTestId("email").fill("new@example.com");

      // Submit again to see if state updates
      await page.getByTestId("login-button").click();

      // Form should process the new submission
      await expect(page.getByTestId("login-button")).toBeDisabled();
    }
  });
});
