import { Check } from "lucide-react";
import clsx from "clsx";
import { Button } from "./ui/Button";
import { PLAN_CATALOG } from "../lib/plans";
import type { PlanKey } from "../lib/types";

// One module key can back more than one distinct, individually-worth-
// mentioning feature (e.g. advanced_insights bundles four) - this is an
// array per key, not a 1:1 string map, specifically so every shipped
// feature gets its own bullet on the pricing page instead of a vague
// module-level summary (or, worse, the bare module key falling through
// unlabelled - see git history for that bug).
const MODULE_FEATURE_LABELS: Record<string, string[]> = {
  incoming: ["Incoming transactions"],
  transfers: ["Inter-bank transfers"],
  approval_rules: ["Configurable multi-level approval rules", "Approval SLA & auto-escalation", "Cost center/department approval routing"],
  forecast: ["Cash forecasting"],
  reports_export: ["Reports & CSV/Excel export"],
  beneficiaries: ["Saved beneficiary book", "Bulk payment upload", "Payment templates"],
  audit: ["Self-serve audit trail"],
  advanced_insights: ["Executive dashboard", "Custom report builder", "Cash totals converted across currencies (live FX)", "Saved dashboard layout"],
  treasury_desk: ["Daily Cash Desk (per-bank daily movements)", "Banker acceptance drawdown & settlement", "Cheque / bank draft released quotas", "Cash reserve by site"],
  sso: ["Single sign-on with your identity provider (SAML / OIDC)"],
};

const CORE_FEATURES = ["Dashboard & cash position", "Bank accounts", "Payments", "Single-level approval", "Two-factor authentication (enforceable org-wide)"];

function planFeatures(planKey: PlanKey): string[] {
  const plan = PLAN_CATALOG[planKey];
  const features = [...CORE_FEATURES, ...plan.modules.flatMap((m) => MODULE_FEATURE_LABELS[m] ?? [m])];
  const userLimit = plan.limits.users === null ? "Unlimited users" : `Up to ${plan.limits.users} users`;
  const accountLimit = plan.limits.bankAccounts === null ? "Unlimited bank accounts" : `Up to ${plan.limits.bankAccounts} bank accounts`;
  return [...features, userLimit, accountLimit];
}

export function PlanPicker({
  selected,
  onSelect,
  currentPlan,
  submitLabel = "Select",
  loadingPlan,
}: {
  selected?: PlanKey;
  onSelect: (planKey: PlanKey) => void;
  currentPlan?: PlanKey;
  submitLabel?: string;
  loadingPlan?: PlanKey | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Object.values(PLAN_CATALOG).map((plan) => {
        const isSelected = selected === plan.key;
        const isCurrent = currentPlan === plan.key;
        return (
          <div
            key={plan.key}
            className={clsx(
              "flex flex-col rounded-card border p-5 transition-colors",
              isSelected ? "border-brand ring-2 ring-brand/30" : "border-border",
              plan.key === "PRO" && !isSelected && "border-brand/40"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-[15px] font-semibold text-ink">{plan.name}</p>
              {isCurrent && <span className="rounded-full bg-plane px-2 py-0.5 text-[11px] font-medium text-ink-secondary">Current</span>}
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {plan.priceMYR === 0 ? "Free" : `RM${plan.priceMYR}`}
              {plan.billingCycle && <span className="text-[13px] font-normal text-ink-muted"> /month</span>}
            </p>
            <p className="mt-2 text-[13px] text-ink-secondary">{plan.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {planFeatures(plan.key).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] text-ink-secondary">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant={isSelected ? "primary" : "outline"}
              className="mt-5 w-full justify-center"
              disabled={isCurrent}
              loading={loadingPlan === plan.key}
              onClick={() => onSelect(plan.key)}
            >
              {isCurrent ? "Current plan" : submitLabel}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
