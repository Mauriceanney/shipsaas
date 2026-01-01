# Issue #215 Implementation Plan: React Hook Form Migration

## Overview
Complete the react-hook-form migration started in Issue #180. Only 2 of 7 forms have been migrated. This plan ensures consistent implementation across all forms.

## Current State
- ✅ Migrated: login-form.tsx, register-form.tsx
- ❌ Not migrated: forgot-password-form, reset-password-form, profile-form, api-key-create-form, two-factor-verify-form
- ✅ Dependencies installed: react-hook-form@7.53.2, @hookform/resolvers@3.9.1, zod@3.23.8
- ✅ shadcn/ui Form component installed

## Migration Pattern (from login-form.tsx)
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<SchemaType>({
  resolver: zodResolver(validationSchema),
  mode: "onBlur",
});

// Field pattern:
<Input
  {...register("fieldName")}
  aria-invalid={!!errors.fieldName}
  aria-describedby={errors.fieldName ? "fieldName-error" : undefined}
/>
{errors.fieldName && (
  <p id="fieldName-error" className="text-sm text-destructive mt-1" role="alert">
    {errors.fieldName.message}
  </p>
)}
```

## Phase 1: Create Reusable Components ✅

### 1.1 shadcn/ui Form Component ✅
- Status: Installed via `npx shadcn@latest add form`
- Location: src/components/ui/form.tsx

### 1.2 PasswordStrengthIndicator Component
- Location: src/components/ui/password-strength-indicator.tsx
- Features:
  - Calculate strength: weak (0-25%), fair (26-50%), good (51-75%), strong (76-100%)
  - Color-coded meter: red → orange → yellow → green
  - Criteria display: uppercase, lowercase, numbers, special chars, length
  - WCAG 2.1 AA compliant with aria-live announcements
- Usage: `<PasswordStrengthIndicator password={watchedPassword} />`

### 1.3 CharacterCount Component  
- Location: src/components/ui/character-count.tsx
- Features:
  - Display format: "X / MAX"
  - Color change when approaching limit (80%: warning, 100%: danger)
  - WCAG 2.1 AA compliant with proper contrast
- Usage: `<CharacterCount current={value.length} max={100} />`

## Phase 2: Migrate Forms

### 2.1 forgot-password-form.tsx
- Schema: `forgotPasswordSchema` from lib/validations/auth.ts
- Fields: email
- Current: Using FormData, no validation feedback
- Migration: Add useForm, inline errors

### 2.2 reset-password-form.tsx
- Schema: `resetPasswordSchema` from lib/validations/auth.ts
- Fields: password, confirmPassword
- Current: Using FormData, no validation feedback
- Migration: Add useForm, inline errors, PasswordStrengthIndicator
- Enhancement: Add password strength indicator for new password

### 2.3 profile-form.tsx
- Schema: `updateProfileSchema` from lib/validations/profile.ts
- Fields: name (max 100), email (conditional)
- Current: Manual validation in handleSubmit
- Migration: Add useForm, inline errors, CharacterCount for name
- Enhancement: Add character count for name field

### 2.4 api-key-create-form.tsx
- Schema: `createApiKeySchema` from lib/validations/api-key.ts
- Fields: name (max 100), environment
- Current: Using FormData, error state variable
- Migration: Add useForm, inline errors, CharacterCount for name
- Enhancement: Add character count for name field

### 2.5 two-factor-verify-form.tsx
- Schema: `verifyTwoFactorSchema` from lib/validations/auth.ts
- Fields: code (6 digits or backup code), rememberDevice (checkbox)
- Current: Local state with manual validation
- Migration: Add useForm, inline errors
- Note: Keep special paste/input handling for TOTP codes

## Phase 3: Testing & QA

### 3.1 Component Tests
- PasswordStrengthIndicator.test.tsx
  - Test strength calculation for all levels
  - Test color coding
  - Test ARIA announcements
- CharacterCount.test.tsx
  - Test count display
  - Test color changes at thresholds
  - Test accessibility

### 3.2 Form Integration Tests
- Test inline validation on blur
- Test submit with invalid data
- Test submit with valid data
- Test loading states
- Test accessibility (keyboard navigation, screen readers)

### 3.3 Coverage Requirements
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%

## Acceptance Criteria Checklist

- [ ] All 7 forms using react-hook-form with zodResolver
- [ ] Inline error messages on all fields
- [ ] Real-time validation on blur (mode: "onBlur")
- [ ] Password strength indicator for password fields (register, reset-password)
- [ ] Character counts for limited fields (profile name, API key name)
- [ ] Reusable Form components from shadcn/ui
- [ ] WCAG 2.1 AA compliant (aria-invalid, aria-describedby, role="alert")
- [ ] All tests passing
- [ ] Coverage thresholds met
- [ ] TypeScript strict mode (no errors)
- [ ] ESLint passing

## Migration Order

1. ✅ Phase 1: Create reusable components
2. Phase 2: Migrate forms (one at a time, test after each)
   - forgot-password-form.tsx (simplest)
   - reset-password-form.tsx (add PasswordStrengthIndicator)
   - profile-form.tsx (add CharacterCount)
   - api-key-create-form.tsx (add CharacterCount)
   - two-factor-verify-form.tsx (complex validation logic)
3. Phase 3: Comprehensive testing

## Files to Create/Modify

### New Files
- src/components/ui/password-strength-indicator.tsx
- src/components/ui/character-count.tsx
- tests/unit/components/ui/password-strength-indicator.test.tsx
- tests/unit/components/ui/character-count.test.tsx

### Modified Files
- src/components/auth/forgot-password-form.tsx
- src/components/auth/reset-password-form.tsx
- src/components/settings/profile-form.tsx
- src/components/settings/api-key-create-form.tsx
- src/components/auth/two-factor-verify-form.tsx

## Notes

- Follow existing pattern from login-form.tsx and register-form.tsx
- Maintain existing functionality (redirects, toast messages, loading states)
- Keep special handling for two-factor code input (numeric only, paste handling)
- Ensure proper TypeScript types throughout
- Use existing validation schemas (do not modify)
