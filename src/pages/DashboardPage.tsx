import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeftRight, ArrowUpRight, ClipboardCheck, Info, TrendingUp, Wallet, XCircle } from "lucide-react";
import { api } from "../lib/api-client";
import type { DashboardSummary } from "../lib/types";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { SkeletonStatCard, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { CashFlowTrendChart } from "../components/charts/CashFlowTrendChart";
import { BreakdownBarChart } from "../components/charts/BreakdownBarChart";
import { ForecastChart } from "../components/charts/ForecastChart";
import { formatDate, formatMoney } from "../lib/format";
import { useAuth } from "../lib/auth-context";
import { OnboardingChecklist } from "../components/dashboard/OnboardingChecklist";
import { CustomizeDashboardButton } from "../components/dashboard/CustomizeDashboardButton";
import { useHasModule } from "../hooks/useSubscription";
import { useDashboardWidgetPrefs } from "../hooks/useDashboardWidgetPrefs";
import { t } from "../i18n";
import { tServer } from "../i18n/server-messages";

const alertIcon = { critical: XCircle, warning: AlertTriangle, info: Info } as const;
const alertTone = { critical: "text-status-critical bg-status-critical-soft", warning: "text-status-warning bg-status-warning-soft", info: "text-brand bg-brand-soft" } as const;

export default function DashboardPage() {
  const { user } = useAuth();
  const { hasModule } = useHasModule("advanced_insights");
  const { isVisible } = useDashboardWidgetPrefs(hasModule);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
  });

  if (isError) {
    return (
      <>
        <PageHeader title={t("Dashboard")} description={t("Treasury overview")} />
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("Good day, {name}", { name: user?.name.split(" ")[0] })} description={t("Here's where your company's cash stands today.")} actions={<CustomizeDashboardButton />} />

      <OnboardingChecklist />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label={t("Total Cash")} value={data.totals.totalCash} format={(n) => formatMoney(n)} icon={Wallet} spark={data.cashFlowTrend.map((p) => p.closingBalance)} />
            <StatCard label={t("Available Cash")} value={data.totals.availableCash} format={(n) => formatMoney(n)} icon={Wallet} spark={data.cashFlowTrend.map((p) => p.closingBalance * 0.98)} />
            <StatCard
              label={t("Shortfall / Excess")}
              value={data.totals.totalShortfall > 0 ? -data.totals.totalShortfall : data.totals.totalExcess}
              format={(n) => formatMoney(Math.abs(n))}
              tone={data.totals.totalShortfall > 0 ? "critical" : "default"}
              icon={data.totals.totalShortfall > 0 ? AlertTriangle : TrendingUp}
              footer={
                <span className="text-xs text-ink-muted">
                  {data.totals.totalShortfall > 0 ? t("{n} account(s) below minimum", { n: data.accountsInShortfall }) : t("All accounts above minimum")}
                </span>
              }
            />
            <StatCard label={t("Pending Approvals")} value={data.pendingApprovalsCount} icon={ClipboardCheck} footer={<Link to="/approvals" className="text-xs font-medium text-brand hover:underline">{t("Review now →")}</Link>} />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label={t("Incoming (30d)")} value={data.incoming30d} format={(n) => formatMoney(n)} icon={ArrowUpRight} />
            <StatCard label={t("Outgoing (30d)")} value={data.outgoing30d} format={(n) => formatMoney(n)} icon={ArrowLeftRight} />
            <StatCard label={t("Projected Balance (30d)")} value={data.projectedBalanceEnd} format={(n) => formatMoney(n)} icon={TrendingUp} />
            <StatCard label={t("Minimum Required")} value={data.totals.minimumRequired} format={(n) => formatMoney(n)} icon={Wallet} />
          </>
        )}
      </div>

      {(isVisible("cashFlowTrend") || isVisible("cashByBank")) && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {isVisible("cashFlowTrend") && (
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{t("Cash-Flow Trend · Last 30 Days")}</CardTitle>
              </CardHeader>
              <CardBody>{isLoading || !data ? <Skeleton className="h-[260px] w-full" /> : data.cashFlowTrend.length ? <CashFlowTrendChart data={data.cashFlowTrend} /> : <EmptyState title={t("No balance history yet")} />}</CardBody>
            </Card>
          )}

          {isVisible("cashByBank") && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Cash by Bank")}</CardTitle>
              </CardHeader>
              <CardBody>{isLoading || !data ? <Skeleton className="h-[220px] w-full" /> : <BreakdownBarChart data={data.cashByBank} />}</CardBody>
            </Card>
          )}
        </div>
      )}

      {(isVisible("forecast") || isVisible("alerts")) && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          {isVisible("forecast") && (
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{t("30-Day Forecast")}</CardTitle>
                <Link to="/forecast" className="text-xs font-medium text-brand hover:underline">
                  {t("Full forecast →")}
                </Link>
              </CardHeader>
              <CardBody>{isLoading || !data ? <Skeleton className="h-[300px] w-full" /> : <ForecastChart data={data.forecast30d} />}</CardBody>
            </Card>
          )}

          {isVisible("alerts") && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Alerts")}</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2.5 p-3">
                {isLoading || !data ? (
                  <Skeleton className="h-40 w-full" />
                ) : data.alerts.length === 0 ? (
                  <EmptyState title={t("No alerts")} description={t("All accounts are within policy.")} />
                ) : (
                  data.alerts.slice(0, 6).map((alert, i) => {
                    const Icon = alertIcon[alert.severity];
                    return (
                      <div key={i} className="flex gap-2.5 rounded-lg p-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${alertTone[alert.severity]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium leading-tight text-ink">{tServer(alert.title)}</p>
                          <p className="mt-0.5 text-[12px] leading-snug text-ink-secondary">{tServer(alert.message)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {(isVisible("recommendations") || isVisible("pendingApprovals")) && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {isVisible("recommendations") && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Recommended Transfers")}</CardTitle>
                <Link to="/transfers" className="text-xs font-medium text-brand hover:underline">
                  {t("Go to transfers →")}
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {isLoading || !data ? (
                  <Skeleton className="m-5 h-32" />
                ) : data.recommendations.length === 0 ? (
                  <EmptyState title={t("No transfers recommended")} description={t("Every account currently meets its minimum balance.")} />
                ) : (
                  <div className="divide-y divide-border">
                    {data.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink">
                            {rec.sourceAccountName} <ArrowLeftRight className="mx-1 inline h-3 w-3 text-ink-muted" /> {rec.destinationAccountName}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-ink-secondary">{tServer(rec.reason)}</p>
                        </div>
                        <p className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">{formatMoney(rec.amount, rec.currencyCode)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {isVisible("pendingApprovals") && (
            <Card>
              <CardHeader>
                <CardTitle>{t("Pending Approvals")}</CardTitle>
                <Link to="/approvals" className="text-xs font-medium text-brand hover:underline">
                  {t("Approval Center →")}
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {isLoading || !data ? (
                  <Skeleton className="m-5 h-32" />
                ) : data.pendingApprovals.length === 0 ? (
                  <EmptyState title={t("Nothing pending")} description={t("You're all caught up.")} />
                ) : (
                  <div className="divide-y divide-border">
                    {data.pendingApprovals.map((req) => (
                      <div key={req.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-ink">{tServer(req.label)}</p>
                          <p className="mt-0.5 text-[12px] text-ink-secondary">
                            {formatDate(req.createdAt)} {t("· Level")} {req.currentLevel}/{req.requiredLevels}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="text-[13px] font-semibold tabular-nums text-ink">{formatMoney(req.amount, req.currencyCode)}</p>
                          <StatusBadge status={req.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
