import { useQuery } from "@tanstack/react-query";
import { Clock, ShieldCheck, TrendingUp, Trophy } from "lucide-react";
import { api } from "../lib/api-client";
import type { ExecutiveSummary } from "../lib/types";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { SkeletonStatCard, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { CashFlowTrendChart } from "../components/charts/CashFlowTrendChart";
import { MonthlyVolumeChart } from "../components/charts/MonthlyVolumeChart";
import { BreakdownBarChart } from "../components/charts/BreakdownBarChart";
import { formatMoney } from "../lib/format";

export default function ExecutiveDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard", "executive"],
    queryFn: () => api.get<ExecutiveSummary>("/dashboard/executive"),
  });

  if (isError) {
    return (
      <>
        <PageHeader title="Executive Dashboard" description="Board/CFO-level KPIs across cash, payments, and approvals." />
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Executive Dashboard" description="Board/CFO-level KPIs across cash, payments, and approvals - Pro+." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading || !data ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Avg Approval Turnaround"
              value={data.avgApprovalTurnaroundHours ?? 0}
              format={(n) => (data.avgApprovalTurnaroundHours === null ? "—" : `${n.toFixed(1)}h`)}
              icon={Clock}
            />
            <StatCard
              label="SLA Compliance Rate"
              value={data.slaComplianceRate ?? 0}
              format={(n) => (data.slaComplianceRate === null ? "—" : `${(n * 100).toFixed(0)}%`)}
              icon={ShieldCheck}
            />
            <StatCard label="Completed Approvals" value={data.completedApprovalsCount} format={(n) => n.toLocaleString()} icon={TrendingUp} />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cash Trend (90 days)</CardTitle>
          </CardHeader>
          <CardBody>{isLoading || !data ? <Skeleton className="h-64 w-full" /> : <CashFlowTrendChart data={data.cashTrend90d} />}</CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Volume by Month</CardTitle>
          </CardHeader>
          <CardBody>
            {isLoading || !data ? (
              <Skeleton className="h-56 w-full" />
            ) : data.paymentVolumeByMonth.length === 0 ? (
              <EmptyState title="No processed payments yet" />
            ) : (
              <MonthlyVolumeChart data={data.paymentVolumeByMonth} />
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-ink-muted" /> Top Beneficiaries by Spend
            </CardTitle>
          </CardHeader>
          <CardBody>
            {isLoading || !data ? (
              <Skeleton className="h-52 w-full" />
            ) : data.topBeneficiaries.length === 0 ? (
              <EmptyState title="No processed payments yet" />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BreakdownBarChart data={data.topBeneficiaries.map((b) => ({ key: b.name, total: b.total }))} />
                <div className="space-y-2">
                  {data.topBeneficiaries.map((b) => (
                    <div key={b.account} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-[13px]">
                      <div>
                        <p className="font-medium text-ink">{b.name}</p>
                        <p className="text-xs text-ink-muted">{b.count} payment{b.count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="tabular-nums font-medium text-ink">{formatMoney(b.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
