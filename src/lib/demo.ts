/**
 * Demo constants (single source of truth)
 * - Avoid duplicated hardcoded UUIDs across pages/components.
 * - Allows overriding via NEXT_PUBLIC env var.
 */
export const DEMO_FULL_ASSESSMENT_ID =
  process.env.NEXT_PUBLIC_DEMO_FULL_ASSESSMENT_ID ||
  'b4b63b9b-4412-4628-8a9a-527b0696426a'
