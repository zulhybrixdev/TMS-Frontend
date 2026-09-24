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
import { t } from "../i18n";

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
    { key: "accountName", header: t("Account"), render: (r) => <div><p className="font-medium text-ink">{r.accountName}</p><p className="text-xs text-ink-muted">{r.bankName}</p></div> },
    { key: "currencyCode", header: t("Currency"), render: (r) => r.currencyCode },
    { key: "currentBalance", header: t("Balance"), align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.currentBalance, r.currencyCode)}</span> },
    { key: "availableCash", header: t("Available"), align: "right", render: (r) => <span className={`tabular-nums ${r.availableCash < 0 ? "text-status-warning" : ""}`}>{formatMoney(r.availableCash, r.currencyCode)}</span> },
    {
      key: "overdraft",
      header: t("Overdraft"),
      align: "right",
      render: (r) =>
        r.overdraftLimit > 0 ? (
          <div className="tabular-nums">
            <p className={r.overdraftUtilised > 0 ? "text-status-warning" : "text-ink-secondary"}>{formatMoney(r.overdraftUtilised, r.currencyCode)} {t("used")}</p>
            <p className="text-xs text-ink-muted">{t("{available} left of {limit}", { available: formatMoney(r.overdraftAvailable, r.currencyCode), limit: formatMoney(r.overdraftLimit, r.currencyCode) })}</p>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: "float",
      header: t("Float D1 / D2"),
      align: "right",
      render: (r) => (r.floatTotal > 0 ? <span className="tabular-nums text-ink-secondary">{formatMoney(r.floatDay1, r.currencyCode)} / {formatMoney(r.floatDay2, r.currencyCode)}</span> : <span className="text-ink-muted">—</span>),
    },
    {
      key: "gap",
      header: t("vs. Minimum"),
      align: "right",
      render: (r) => (
        <span className={`tabular-nums font-medium ${r.shortfall > 0 ? "text-status-critical" : "text-status-good"}`}>
          {r.shortfall > 0 ? `-${formatMoney(r.shortfall, r.currencyCode)}` : `+${formatMoney(r.availableCash - r.minimumBalance, r.currencyCode)}`}
        </span>
      ),
    },
    { key: "cashStatus", header: t("Status"), render: (r) => <StatusBadge status={r.cashStatus} /> },
  ];

  if (isError) {
    return (
      <>
        <PageHeader title={t("Cash Position")} description={t("Consolidated view of the company's cash across every bank.")} />
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t("Cash Position")} description={t("Consolidated view of the company's cash across every bank, account, and currency.")} />

      {data && data.unconvertedCurrencies.length > 0 && (
        <div className="mb-4 rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">
          {data.fxConversion
            ? t("No exchange rate available for {currencies} right now, so those balances are left out of the {base} totals below (they still show per account and per currency).", { currencies: data.unconvertedCurrencies.join(", "), base: data.baseCurrency })
            : t("The totals below cover {base} accounts only. {currencies} balances are shown per account and per currency; totals converted across currencies are part of the Pro+ plan.", { base: data.baseCurrency, currencies: data.unconvertedCurrencies.join(", ") })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label={t("Total Cash ({base})", { base: data.baseCurrency })} value={data.totalCash} format={(n) => formatMoney(n, data.baseCurrency)} icon={Wallet} />
            <StatCard
              label={t("Available Cash")}
              value={data.availableCash}
              format={(n) => formatMoney(n, data.baseCurrency)}
              icon={Wallet}
              footer={data.totalFloat > 0 && <span className="text-xs text-ink-muted">{t("after {amount} uncleared float", { amount: formatMoney(data.totalFloat, data.baseCurrency) })}</span>}
            />
            <StatCard
              label={t("Overdraft Used")}
              value={data.overdraftUtilised}
              format={(n) => formatMoney(n, data.baseCurrency)}
              tone={data.overdraftUtilised > 0 ? "critical" : "default"}
              footer={data.overdraftLimit > 0 && <span className="text-xs text-ink-muted">{t("of {limit} facilities · {liquidity} available incl. OD", { limit: formatMoney(data.overdraftLimit, data.baseCurrency), liquidity: formatMoney(data.liquidity, data.baseCurrency) })}</span>}
            />
            <StatCard label={t("Total Shortfall")} value={data.totalShortfall} format={(n) => formatMoney(n, data.baseCurrency)} tone={data.totalShortfall > 0 ? "critical" : "default"} footer={<span className="text-xs text-ink-muted">{t("excess over target")} {formatMoney(data.totalExcess, data.baseCurrency)}</span>} />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t("Historical Balances")}</CardTitle>
            <Select className="h-8 w-32 text-xs" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="daily">{t("Daily")}</option>
              <option value="weekly">{t("Weekly")}</option>
              <option value="monthly">{t("Monthly")}</option>
            </Select>
          </CardHeader>
          <CardBody>{historyLoading || !history ? <Skeleton className="h-[260px] w-full" /> : history.length === 0 ? <EmptyState title={t("No history yet")} /> : <CashFlowTrendChart data={history} />}</CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("Position by Currency")}</CardTitle>
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
          <CardTitle>{t("Position by Account")}</CardTitle>
        </CardHeader>
        {isLoading || !data ? <SkeletonTable cols={8} /> : data.accounts.length === 0 ? <EmptyState title={t("No accounts")} /> : <DataTable columns={columns} rows={data.accounts} rowKey={(r) => r.id} />}
      </Card>
    </>
  );
}
