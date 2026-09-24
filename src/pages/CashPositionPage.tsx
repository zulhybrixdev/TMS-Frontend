import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { api } from "../lib/api-client";
import type { CashPositionSummary } from "../lib/types";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { SkeletonStatCard, Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { ErrorState, EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { DataTable, Column } from "../components/ui/Table";
import { BreakdownBarChart } from "../components/charts/BreakdownBarChart";
import { CashFlowTrendChart } from "../components/charts/CashFlowTrendChart";
import { Select } from "../components/ui/Input";
import { formatMoney } from "../lib/format";
import type { BankAccountRow } from "../lib/types";
import { ConsolidatedCashCard } from "../components/cash-position/ConsolidatedCashCard";
import { LiveFxRatesCard } from "../components/cash-position/LiveFxRatesCard";

export default function CashPositionPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["cash-position"],
    queryFn: () => api.get<CashPositionSummary>("/cash-position"),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["cash-position-history", period],
    queryFn: () => api.get<{ date: string; closingBalance: number }[]>(`/cash-position/history?period=${period}`),
  });

  const columns: Column<BankAccountRow>[] = [
    { key: "accountName", header: "Account", render: (r) => <div><p className="font-medium text-ink">{r.accountName}</p><p className="text-xs text-ink-muted">{r.bankName}</p></div> },
    { key: "currencyCode", header: "Currency", render: (r) => r.currencyCode },
    { key: "currentBalance", header: "Balance", align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.currentBalance, r.currencyCode)}</span> },
    { key: "availableCash", header: "Available", align: "right", render: (r) => <span className={`tabular-nums ${r.availableCash < 0 ? "text-status-warning" : ""}`}>{formatMoney(r.availableCash, r.currencyCode)}</span> },
    {
      key: "overdraft",
      header: "Overdraft",
      align: "right",
      render: (r) =>
        r.overdraftLimit > 0 ? (
          <div className="tabular-nums">
            <p className={r.overdraftUtilised > 0 ? "text-status-warning" : "text-ink-secondary"}>{formatMoney(r.overdraftUtilised, r.currencyCode)} used</p>
            <p className="text-xs text-ink-muted">{formatMoney(r.overdraftAvailable, r.currencyCode)} left of {formatMoney(r.overdraftLimit, r.currencyCode)}</p>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: "float",
      header: "Float D1 / D2",
      align: "right",
      render: (r) => (r.floatTotal > 0 ? <span className="tabular-nums text-ink-secondary">{formatMoney(r.floatDay1, r.currencyCode)} / {formatMoney(r.floatDay2, r.currencyCode)}</span> : <span className="text-ink-muted">—</span>),
    },
    {
      key: "gap",
      header: "vs. Minimum",
      align: "right",
      render: (r) => (
        <span className={`tabular-nums font-medium ${r.shortfall > 0 ? "text-status-critical" : "text-status-good"}`}>
          {r.shortfall > 0 ? `-${formatMoney(r.shortfall, r.currencyCode)}` : `+${formatMoney(r.availableCash - r.minimumBalance, r.currencyCode)}`}
        </span>
      ),
    },
    { key: "cashStatus", header: "Status", render: (r) => <StatusBadge status={r.cashStatus} /> },
  ];

  if (isError) {
    return (
      <>
        <PageHeader title="Cash Position" description="Consolidated view of the company's cash across every bank." />
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Cash Position" description="Consolidated view of the company's cash across every bank, account, and currency." />

      {data && data.unconvertedCurrencies.length > 0 && (
        <div className="mb-4 rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">
          {data.fxConversion
            ? `No exchange rate available for ${data.unconvertedCurrencies.join(", ")} right now, so those balances are left out of the ${data.baseCurrency} totals below (they still show per account and per currency).`
            : `The totals below cover ${data.baseCurrency} accounts only. ${data.unconvertedCurrencies.join(", ")} balances are shown per account and per currency; totals converted across currencies are part of the Pro+ plan.`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label={`Total Cash (${data.baseCurrency})`} value={data.totalCash} format={(n) => formatMoney(n, data.baseCurrency)} icon={Wallet} />
            <StatCard
              label="Available Cash"
              value={data.availableCash}
              format={(n) => formatMoney(n, data.baseCurrency)}
              icon={Wallet}
              footer={data.totalFloat > 0 && <span className="text-xs text-ink-muted">after {formatMoney(data.totalFloat, data.baseCurrency)} uncleared float</span>}
            />
            <StatCard
              label="Overdraft Used"
              value={data.overdraftUtilised}
              format={(n) => formatMoney(n, data.baseCurrency)}
              tone={data.overdraftUtilised > 0 ? "critical" : "default"}
              footer={data.overdraftLimit > 0 && <span className="text-xs text-ink-muted">of {formatMoney(data.overdraftLimit, data.baseCurrency)} facilities · {formatMoney(data.liquidity, data.baseCurrency)} available incl. OD</span>}
            />
            <StatCard label="Total Shortfall" value={data.totalShortfall} format={(n) => formatMoney(n, data.baseCurrency)} tone={data.totalShortfall > 0 ? "critical" : "default"} footer={<span className="text-xs text-ink-muted">excess over target {formatMoney(data.totalExcess, data.baseCurrency)}</span>} />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Historical Balances</CardTitle>
            <Select className="h-8 w-32 text-xs" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </Select>
          </CardHeader>
          <CardBody>{historyLoading || !history ? <Skeleton className="h-[260px] w-full" /> : history.length === 0 ? <EmptyState title="No history yet" /> : <CashFlowTrendChart data={history} />}</CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Position by Currency</CardTitle>
          </CardHeader>
          <CardBody>{isLoading || !data ? <Skeleton className="h-[220px] w-full" /> : <BreakdownBarChart data={data.byCurrency} />}</CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ConsolidatedCashCard />
        <LiveFxRatesCard />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Position by Account</CardTitle>
        </CardHeader>
        {isLoading || !data ? <SkeletonTable cols={8} /> : data.accounts.length === 0 ? <EmptyState title="No accounts" /> : <DataTable columns={columns} rows={data.accounts} rowKey={(r) => r.id} />}
      </Card>
    </>
  );
}
