import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSubscription } from "../../hooks/useSubscription";
import { PlanPicker } from "../../components/PlanPicker";
import { StatusBadge } from "../../components/ui/Badge";
import { DataTable } from "../../components/ui/Table";
import { Skeleton } from "../../components/ui/Skeleton";
import { api, ApiError } from "../../lib/api-client";
import { formatDateTime, formatMoney } from "../../lib/format";
import type { PlanKey, SubscriptionInvoiceRow } from "../../lib/types";

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((current / limit) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-ink-secondary">{label}</span>
        <span className="font-medium text-ink">
          {current} {limit !== null ? `/ ${limit}` : "(unlimited)"}
        </span>
      </div>
      {limit !== null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-plane">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-status-critical" : pct >= 80 ? "bg-status-warning" : "bg-brand"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export function SubscriptionTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useSubscription();
  const [changingTo, setChangingTo] = useState<PlanKey | null>(null);

  if (isLoading || !data) return <Skeleton className="h-64 w-full" />;

  const onSelectPlan = async (planKey: PlanKey) => {
    setChangingTo(planKey);
    try {
      const result = await api.post<{ immediate: boolean; checkoutUrl?: string }>("/subscriptions/change", { planKey });
      if (result.immediate) {
        toast.success(`Switched to the ${planKey.replace("_", "+")} plan`);
        qc.invalidateQueries({ queryKey: ["subscriptions"] });
      } else if (result.checkoutUrl) {
        toast.success("Redirecting to complete payment...");
        window.location.href = result.checkoutUrl;
      }
    } catch (err) {
      toast.error("Could not change plan", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setChangingTo(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-card border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[13px] text-ink-secondary">Current plan</p>
            <p className="font-display text-xl font-semibold text-ink">{data.subscription.plan.name}</p>
          </div>
          <StatusBadge status={data.subscription.status} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UsageBar label="Users" current={data.usage.users.current} limit={data.usage.users.limit} />
          <UsageBar label="Bank accounts" current={data.usage.bankAccounts.current} limit={data.usage.bankAccounts.limit} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-[13px] font-medium text-ink">Change plan</p>
        <PlanPicker currentPlan={data.subscription.planKey} onSelect={onSelectPlan} submitLabel="Switch" loadingPlan={changingTo} />
      </div>

      <div>
        <p className="mb-3 text-[13px] font-medium text-ink">Billing history</p>
        {data.invoices.length === 0 ? (
          <p className="text-[13px] text-ink-muted">No invoices yet.</p>
        ) : (
          <div className="rounded-card border border-border">
            <DataTable<SubscriptionInvoiceRow>
              columns={[
                { key: "createdAt", header: "Date", render: (r) => formatDateTime(r.createdAt) },
                { key: "planKey", header: "Plan", render: (r) => r.planKey.replace("_", "+") },
                { key: "amountMYR", header: "Amount", render: (r) => formatMoney(r.amountMYR) },
                { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
                { key: "gatewayOrderId", header: "Order", render: (r) => <span className="font-mono text-[12px] text-ink-muted">{r.gatewayOrderId}</span> },
              ]}
              rows={data.invoices}
              rowKey={(r) => r.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
