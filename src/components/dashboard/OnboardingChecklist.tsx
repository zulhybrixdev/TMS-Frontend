import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Check, Landmark, Users, ShieldCheck, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { api } from "../../lib/api-client";
import { Card, CardBody } from "../ui/Card";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";

interface OnboardingStatus {
  hasBankAccount: boolean;
  hasTeam: boolean;
  hasApprovalRule: boolean;
  hasPayment: boolean;
}

// Derived entirely from existing data (accounts/users/rules/payments
// counts) rather than a "dismissed" flag in the DB - it just disappears
// once every step is genuinely done, so there's nothing to reset or get
// stuck in a dismissed-but-still-incomplete state.
export function OnboardingChecklist() {
  const { hasPermission } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "onboarding"],
    queryFn: () => api.get<OnboardingStatus>("/dashboard/onboarding"),
  });

  if (isLoading || !data) return null;

  const steps = [
    { key: "hasBankAccount", label: "Add your first bank account", to: "/bank-accounts", icon: Landmark, done: data.hasBankAccount, visible: hasPermission(PERMISSIONS.ACCOUNTS_MANAGE) },
    { key: "hasTeam", label: "Invite your team", to: "/administration", icon: Users, done: data.hasTeam, visible: hasPermission(PERMISSIONS.USERS_MANAGE) },
    {
      key: "hasApprovalRule",
      label: "Set an approval rule",
      to: "/administration?tab=approval-rules",
      icon: ShieldCheck,
      done: data.hasApprovalRule,
      visible: hasPermission(PERMISSIONS.APPROVAL_RULES_MANAGE),
    },
    { key: "hasPayment", label: "Create your first payment", to: "/payments", icon: ArrowUpRight, done: data.hasPayment, visible: hasPermission(PERMISSIONS.PAYMENTS_CREATE) },
  ].filter((s) => s.visible);

  if (steps.length === 0 || steps.every((s) => s.done)) return null;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="mb-5 border-brand/20 bg-brand-soft/30">
      <CardBody className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-semibold text-ink">Get set up ({doneCount}/{steps.length})</p>
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-raised">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => (
            <Link
              key={step.key}
              to={step.to}
              className={clsx(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-colors",
                step.done ? "border-status-good/30 bg-status-good-soft text-status-good" : "border-border bg-surface-raised text-ink hover:border-brand/40 hover:bg-brand-soft"
              )}
            >
              {step.done ? <Check className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
              {step.label}
            </Link>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
