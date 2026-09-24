import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { StatCard } from "../components/ui/StatCard";
import { DataTable, Column } from "../components/ui/Table";
import { Skeleton, SkeletonTable, SkeletonStatCard } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { Tabs } from "../components/ui/Tabs";
import { ForecastChart } from "../components/charts/ForecastChart";
import { BalanceMatrix, MatrixRow } from "../components/treasury/BalanceMatrix";
import { useCurrencies } from "../hooks/useReferenceData";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney, todayLocal } from "../lib/format";
import type { ForecastEntry, ProjectionDetail } from "../lib/types";
import { ForecastEntryDialog } from "../components/forecast/ForecastEntryDialog";
import { t, tk, tEnum } from "../i18n";

const HORIZONS = [
  { label: tk("10 days"), days: 10 },
  { label: tk("14 days"), days: 14 },
  { label: tk("30 days"), days: 30 },
  { label: tk("60 days"), days: 60 },
  { label: tk("90 days"), days: 90 },
];

const confidenceTone = { HIGH: "good", MEDIUM: "warning", LOW: "neutral" } as const;

type Metric = "available" | "liquidity" | "book";
const METRIC_TABS: { key: Metric; label: string }[] = [
  { key: "available", label: tk("Available") },
  { key: "liquidity", label: tk("Available incl. overdraft") },
  { key: "book", label: tk("Book balance") },
];

export default function ForecastPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.FORECASTS_MANAGE);
  const [horizon, setHorizon] = useState(14);
  const [currency, setCurrency] = useState("");
  const [metric, setMetric] = useState<Metric>("available");
  const [createOpen, setCreateOpen] = useState(false);
  const qc = useQueryClient();
  const { data: currencies } = useCurrencies();

  const from = todayLocal();
  const to = todayLocal(horizon);
  const currencyQuery = currency ? `&currencyCode=${currency}` : "";

  const { data: detail, isLoading: projectionLoading, isError: projectionError, error: projectionErr, refetch: refetchProjection } = useQuery({
    queryKey: ["forecast-projection", horizon, currency],
    queryFn: () => api.get<ProjectionDetail>(`/forecasts/projection/detail?from=${from}&to=${to}${currencyQuery}`),
  });

  const { data: entries, isLoading: entriesLoading, isError, error, refetch } = useQuery({
    queryKey: ["forecast-entries", horizon],
    queryFn: () => api.get<ForecastEntry[]>(`/forecasts?from=${from}&to=${to}`),
  });

  const projection = detail?.points;
  const money = (n: number) => formatMoney(n, detail?.baseCurrency ?? "MYR");
  const totalInflow = projection?.reduce((s, p) => s + p.inflow, 0) ?? 0;
  const totalOutflow = projection?.reduce((s, p) => s + p.outflow, 0) ?? 0;
  const endBalance = projection?.length ? projection[projection.length - 1].projectedBalance : 0;
  const worstDay = projection?.reduce((min, p) => (p.projectedBalance < min.projectedBalance ? p : min), projection[0]);
  const firstOverdraftDay = projection?.find((p) => p.overdraftAccounts.length > 0);
  const firstShortfallDay = projection?.find((p) => p.shortfallAccounts.length > 0);
  const hasOverdraftFacilities = !!detail?.accounts.some((a) => a.overdraftLimit > 0);

  const matrixColumns = (detail?.points ?? []).map((p, i) => ({ date: p.date, kind: (i === 0 ? "today" : "projected") as "today" | "projected" }));
  const matrixRows: MatrixRow[] = (detail?.accounts ?? []).map((a) => ({
    key: a.accountId,
    bankName: a.bankName,
    accountName: a.accountName,
    currencyCode: a.currencyCode,
    note: a.overdraftLimit > 0 ? t("OD limit {amount}", { amount: a.overdraftLimit.toLocaleString() }) : undefined,
    cells: a.days.map((d) => d[metric]),
  }));
  const matrixTotals = Array.from(new Set((detail?.accounts ?? []).map((a) => a.currencyCode))).map((code) => ({
    currencyCode: code,
    cells: (detail?.points ?? []).map((_, i) => Math.round((detail!.accounts.filter((a) => a.currencyCode === code).reduce((s, a) => s + a.days[i][metric], 0)) * 100) / 100),
  }));

  const columns: Column<ForecastEntry>[] = [
    { key: "forecastDate", header: t("Date"), sortable: false, render: (r) => formatDate(r.forecastDate) },
    { key: "description", header: t("Description"), render: (r) => <span className="text-ink">{r.description || r.sourceReference || "—"}</span> },
    { key: "accountName", header: t("Account"), render: (r) => <span className="text-ink-secondary">{r.accountName}</span> },
    { key: "category", header: t("Category"), render: (r) => <Badge tone={r.category === "INFLOW" ? "good" : "critical"}>{r.category === "INFLOW" ? t("Inflow") : t("Outflow")}</Badge> },
    { key: "amount", header: t("Amount"), align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "confidence", header: t("Confidence"), render: (r) => <Badge tone={confidenceTone[r.confidence]}>{t(r.confidence[0] + r.confidence.slice(1).toLowerCase())}</Badge> },
    { key: "sourceType", header: t("Source"), render: (r) => <span className="text-xs text-ink-muted">{r.sourceType === "MANUAL" ? t("Manual") : tEnum(r.sourceType)}</span> },
  ];

  return (
    <>
      <PageHeader
        title={t("Cash Forecast")}
        description={t("Day-by-day projection from today's available balance: AP due, expected collections (after float), transfers, banker acceptance maturities and manual entries.")}
        actions={
          <>
            <Select className="h-9 w-40" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={t("Currency")}>
              <option value="">{t("All (in base currency)")}</option>
              {currencies?.map((c) => (
                <option key={c.code} value={c.code}>
                  {t("{code} only", { code: c.code })}
                </option>
              ))}
            </Select>
            <Select className="h-9 w-32" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} aria-label={t("Horizon")}>
              {HORIZONS.map((h) => (
                <option key={h.days} value={h.days}>
                  {t(h.label)}
                </option>
              ))}
            </Select>
            {canManage && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> {t("Add Entry")}
              </Button>
            )}
          </>
        }
      />

      {projectionError && (
        <Card className="mb-4">
          <ErrorState message={(projectionErr as Error)?.message} onRetry={() => refetchProjection()} />
        </Card>
      )}

      {detail && detail.unconvertedCurrencies.length > 0 && (
        <Notice tone="warning">
          {detail.fxConversion
            ? t("No exchange rate available for {currencies} right now, so those accounts are left out of the {base} totals.", { currencies: detail.unconvertedCurrencies.join(", "), base: detail.baseCurrency })
            : t("The totals cover {base} accounts only; totals converted across currencies are part of the Pro+ plan.", { base: detail.baseCurrency })}{" "}
          {t("Pick a single currency above to see {currencies} on their own.", { currencies: detail.unconvertedCurrencies.join(", ") })}
        </Notice>
      )}
      {detail && detail.overdue.payables.length > 0 && (
        <Notice tone="warning">
          {t("Overdue payables counted as going out today: {list}. Adjust the due date on any that are not actually due.", { list: detail.overdue.payables.map((o) => `${formatMoney(o.amount, o.currencyCode)} (${o.count})`).join(", ") })}
        </Notice>
      )}
      {detail && detail.overdue.receivables.length > 0 && (
        <Notice tone="info">
          {t("Overdue collections not counted (not yet received): {list}. Reschedule or mark them received to bring them into the projection.", { list: detail.overdue.receivables.map((o) => `${formatMoney(o.amount, o.currencyCode)} (${o.count})`).join(", ") })}
        </Notice>
      )}
      {(firstShortfallDay || firstOverdraftDay) && (
        <Notice tone="critical">
          {firstShortfallDay
            ? t("{accounts} would fall below minimum balance even after using overdraft, from {date}.", { accounts: firstShortfallDay.shortfallAccounts.join(", "), date: formatDate(firstShortfallDay.date) })
            : t("{accounts} would be drawing on overdraft from {date}.", { accounts: firstOverdraftDay!.overdraftAccounts.join(", "), date: formatDate(firstOverdraftDay!.date) })}
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {projectionLoading || !projection ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label={t("Expected Inflows")} value={totalInflow} format={money} icon={TrendingUp} footer={<span className="text-xs text-ink-muted">{t("excludes transfers between your own accounts")}</span>} />
            <StatCard label={t("Expected Outflows")} value={totalOutflow} format={money} icon={TrendingDown} />
            <StatCard label={t("Projected Available ({n}d)", { n: horizon })} value={endBalance} format={money} tone={endBalance < 0 ? "critical" : "default"} footer={hasOverdraftFacilities && <span className="text-xs text-ink-muted">{money(projection[projection.length - 1]?.projectedLiquidity ?? 0)} {t("incl. overdraft")}</span>} />
            <StatCard
              label={t("Lowest Projected Point")}
              value={worstDay?.projectedBalance ?? 0}
              format={money}
              tone={worstDay && worstDay.projectedBalance < 0 ? "critical" : "default"}
              footer={worstDay && <span className="text-xs text-ink-muted">{t("on {date}", { date: formatDate(worstDay.date) })}</span>}
            />
          </>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{detail ? t("Projected Balance ({base})", { base: detail.baseCurrency }) : t("Projected Balance")}</CardTitle>
        </CardHeader>
        <CardBody>
          {projectionLoading || !projection ? <Skeleton className="h-[300px] w-full" /> : projection.length === 0 ? <EmptyState title={t("No forecast data")} /> : <ForecastChart data={projection} currency={detail?.baseCurrency} showLiquidity={hasOverdraftFacilities} />}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("By Bank & Account")}</CardTitle>
          <Tabs tabs={METRIC_TABS} active={metric} onChange={(k) => setMetric(k as Metric)} />
        </CardHeader>
        {projectionLoading || !detail ? (
          <SkeletonTable cols={8} />
        ) : detail.accounts.length === 0 ? (
          <EmptyState title={t("No accounts to project")} />
        ) : (
          <>
            <BalanceMatrix columns={matrixColumns} rows={matrixRows} totals={matrixTotals} />
            <p className="border-t border-border px-5 py-3 text-xs text-ink-muted">
              {t("Available = book balance − reserved amount − cheque float not yet cleared. A payment reduces the balance on its due date; a collection with float only becomes available once it clears. Each currency is totalled separately.")}
            </p>
          </>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t("Forecast Line Items")}</CardTitle>
        </CardHeader>
        {entriesLoading ? (
          <SkeletonTable cols={7} />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={refetch} />
        ) : !entries || entries.length === 0 ? (
          <EmptyState title={t("No forecast line items in this window")} />
        ) : (
          <DataTable columns={columns} rows={entries} rowKey={(r) => r.id} />
        )}
      </Card>

      <ForecastEntryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["forecast-entries"] });
          qc.invalidateQueries({ queryKey: ["forecast-projection"] });
        }}
      />
    </>
  );
}

function Notice({ tone, children }: { tone: "warning" | "info" | "critical"; children: React.ReactNode }) {
  const styles = {
    warning: "border-status-warning/30 bg-status-warning-soft text-status-warning",
    critical: "border-status-critical/30 bg-status-critical-soft text-status-critical",
    info: "border-border bg-plane text-ink-secondary",
  }[tone];
  return (
    <div className={`mb-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] ${styles}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
