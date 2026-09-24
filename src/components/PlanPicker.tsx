import { Check } from "lucide-react";
import clsx from "clsx";
import { Button } from "./ui/Button";
import { PLAN_CATALOG } from "../lib/plans";
import type { PlanKey } from "../lib/types";
import { t, tk } from "../i18n";

// One module key can back more than one distinct, individually-worth-
// mentioning feature (e.g. advanced_insights bundles four) - this is an
// array per key, not a 1:1 string map, specifically so every shipped
// feature gets its own bullet on the pricing page instead of a vague
// module-level summary (or, worse, the bare module key falling through
// unlabelled - see git history for that bug).
const MODULE_FEATURE_LABELS: Record<string, string[]> = {
  incoming: [tk("Incoming transactions")],
  transfers: [tk("Inter-bank transfers")],
  approval_rules: [tk("Configurable multi-level approval rules"), tk("Approval SLA & auto-escalation"), tk("Cost center/department approval routing")],
  forecast: [tk("Cash forecasting")],
  reports_export: [tk("Reports & CSV/Excel export")],
  beneficiaries: [tk("Saved beneficiary book"), tk("Bulk payment upload"), tk("Payment templates")],
  audit: [tk("Self-serve audit trail")],
  advanced_insights: [tk("Executive dashboard"), tk("Custom report builder"), tk("Cash totals converted across currencies (live FX)"), tk("Saved dashboard layout")],
  treasury_desk: [tk("Daily Cash Desk (per-bank daily movements)"), tk("Banker acceptance drawdown & settlement"), tk("Cheque / bank draft released quotas"), tk("Cash reserve by site")],
  sso: [tk("Single sign-on with your identity provider (SAML / OIDC)")],
};

const CORE_FEATURES = [tk("Dashboard & cash position"), tk("Bank accounts"), tk("Payments"), tk("Single-level approval"), tk("Two-factor authentication (enforceable org-wide)")];

function planFeatures(planKey: PlanKey): string[] {
  const plan = PLAN_CATALOG[planKey];
  const features = [...CORE_FEATURES, ...plan.modules.flatMap((m) => MODULE_FEATURE_LABELS[m] ?? [m])];
  const userLimit = plan.limits.users === null ? t("Unlimited users") : `Up to ${plan.limits.users} users`;
  const accountLimit = plan.limits.bankAccounts === null ? t("Unlimited bank accounts") : t("Up to {n} bank accounts", { n: plan.limits.bankAccounts });
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
              {isCurrent && <span className="rounded-full bg-plane px-2 py-0.5 text-[11px] font-medium text-ink-secondary">{t("Current")}</span>}
            </div>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {plan.priceMYR === 0 ? t("Free") : `RM${plan.priceMYR}`}
              {plan.billingCycle && <span className="text-[13px] font-normal text-ink-muted"> /month</span>}
            </p>
            <p className="mt-2 text-[13px] text-ink-secondary">{t(plan.description)}</p>
            <ul className="mt-4 flex-1 space-y-2">
              {planFeatures(plan.key).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px] text-ink-secondary">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                  {t(feature)}
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
              {isCurrent ? t("Current plan") : submitLabel}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
