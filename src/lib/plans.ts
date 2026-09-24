// Mirrors backend/src/common/plans.ts - kept as a small standalone copy on
// the frontend (same convention as ./permissions.ts) so pricing/plan cards
// can render without waiting on an API round-trip. The backend's
// /subscriptions/me response is still the source of truth for what the
// current tenant actually has.
import type { PlanDefinition, PlanKey } from "./types";

export const PLAN_KEYS: Record<string, PlanKey> = {
  FREE: "FREE",
  PRO: "PRO",
  PRO_PLUS: "PRO_PLUS",
};

const PRO_MODULES: PlanDefinition["modules"] = ["incoming", "transfers", "approval_rules", "forecast", "reports_export", "beneficiaries"];
const PRO_PLUS_MODULES: PlanDefinition["modules"] = [...PRO_MODULES, "audit", "advanced_insights", "treasury_desk", "sso"];

export const PLAN_CATALOG: Record<PlanKey, PlanDefinition> = {
  FREE: {
    key: "FREE",
    name: "Free",
    priceMYR: 0,
    billingCycle: null,
    description: "Core treasury essentials to get started.",
    modules: [],
    limits: { users: 3, bankAccounts: 2 },
  },
  PRO: {
    key: "PRO",
    name: "Pro",
    priceMYR: 99,
    billingCycle: "monthly",
    description: "The full treasury workflow, for a growing finance team.",
    modules: PRO_MODULES,
    limits: { users: 15, bankAccounts: 10 },
  },
  PRO_PLUS: {
    key: "PRO_PLUS",
    name: "Pro+",
    priceMYR: 299,
    billingCycle: "monthly",
    description: "Everything in Pro, plus compliance, executive-level insight and single sign-on.",
    modules: PRO_PLUS_MODULES,
    limits: { users: null, bankAccounts: null },
  },
};

export const ACCOUNT_TYPE_OPTIONS: { value: "INDIVIDUAL" | "TEAM" | "ENTERPRISE"; label: string; description: string }[] = [
  { value: "INDIVIDUAL", label: "Individual", description: "Just you - capped at 1 user on any plan." },
  { value: "TEAM", label: "Team", description: "A finance team of a few to a few dozen people." },
  { value: "ENTERPRISE", label: "Enterprise", description: "A larger organisation, typically on Pro+." },
];
