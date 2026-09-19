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
    { key: "availableCash", header: "Available", align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.availableCash, r.currencyCode)}</span> },
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Total Cash" value={data.totalCash} format={(n) => formatMoney(n)} icon={Wallet} />
            <StatCard label="Available Cash" value={data.availableCash} format={(n) => formatMoney(n)} icon={Wallet} />
            <StatCard label="Total Shortfall" value={data.totalShortfall} format={(n) => formatMoney(n)} tone={data.totalShortfall > 0 ? "critical" : "default"} />
            <StatCard label="Total Excess (over target)" value={data.totalExcess} format={(n) => formatMoney(n)} />
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
        {isLoading || !data ? <SkeletonTable cols={6} /> : data.accounts.length === 0 ? <EmptyState title="No accounts" /> : <DataTable columns={columns} rows={data.accounts} rowKey={(r) => r.id} />}
      </Card>
    </>
  );
}
