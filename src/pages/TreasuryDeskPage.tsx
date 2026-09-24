import { ReactNode, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Skeleton, SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { BalanceMatrix } from "../components/treasury/BalanceMatrix";
import { QuotaPanel } from "../components/treasury/QuotaPanel";
import { QuotaManagerDialog } from "../components/treasury/QuotaManagerDialog";
import { ReservePanel } from "../components/treasury/ReservePanel";
import { BankerAcceptanceWidget } from "../components/treasury/BankerAcceptanceWidget";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney, formatNumber, todayLocal } from "../lib/format";
import type { BalanceGrid, DailyAccountRow, DailyCurrencyTotals, DailyDesk } from "../lib/types";

// Signed-amount cell: blank dash for zero so a busy day's few movements stand
// out, red for negative balances.
function Num({ value, tone }: { value: number | null | undefined; tone?: "in" | "out" | "balance" }) {
  if (value === null || value === undefined) return <span className="text-ink-muted">—</span>;
  if (value === 0 && tone !== "balance") return <span className="text-ink-muted">–</span>;
  return <span className={clsx("tabular-nums", value < 0 && "text-status-critical", tone === "out" && value > 0 && "text-status-serious")}>{formatNumber(value)}</span>;
}

const th = "whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-ink-muted";
const td = "whitespace-nowrap px-3 py-2.5 text-right";
const stickyName = "sticky left-0 z-10 bg-surface-raised px-5 py-2.5 text-left";

export default function TreasuryDeskPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.ACCOUNTS_MANAGE);
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [quotaOpen, setQuotaOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["treasury-desk", "daily", date],
    queryFn: () => api.get<DailyDesk>(`/treasury-desk/daily?date=${date}`),
  });

  const { data: grid, isLoading: gridLoading } = useQuery({
    queryKey: ["treasury-desk", "grid"],
    queryFn: () => api.get<BalanceGrid>("/treasury-desk/balance-grid?past=5&ahead=10"),
  });

  if (isError) {
    return (
      <>
        <PageHeader title="Daily Cash Desk" description="Balances, overdraft, float and today's movements for every bank account." />
        <Card>
          <ErrorState message={(error as Error)?.message} onRetry={() => refetch()} />
        </Card>
      </>
    );
  }

  const isToday = data?.isToday ?? date === today;
  const overOD = data?.accounts.filter((a) => a.overdraftUtilised > a.overdraftLimit && a.overdraftUtilised > 0) ?? [];

  return (
    <>
      <PageHeader
        title="Daily Cash Desk"
        description="Where cash stands across every bank and currency: balances, overdraft, float, the day's movements, and what is scheduled."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="desk-date" className="text-[13px] text-ink-secondary">
              Date
            </label>
            <Input id="desk-date" type="date" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-9 w-40" />
          </div>
        }
      />

      {!isToday && (
        <div className="mb-4 rounded-lg border border-border bg-plane px-4 py-2.5 text-[13px] text-ink-secondary">
          Showing {formatDate(date)} from the daily balance history. Float, reserved and available figures are live-only and are shown for today.
        </div>
      )}
      {overOD.length > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-status-critical/30 bg-status-critical-soft px-4 py-3 text-[13px] text-status-critical">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{overOD.map((a) => a.accountName).join(", ")} {overOD.length > 1 ? "are" : "is"} overdrawn beyond the recorded overdraft limit.</p>
        </div>
      )}

      {/* Position by currency */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading || !data
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : data.totalsByCurrency.map((t) => <CurrencySummary key={t.currencyCode} t={t} isToday={isToday} />)}
      </div>

      {/* Bank balances & liquidity */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Bank Balances, Overdraft &amp; Float</CardTitle>
        </CardHeader>
        {isLoading || !data ? <SkeletonTable cols={9} /> : data.accounts.length === 0 ? <EmptyState title="No bank accounts yet" /> : <BalancesTable rows={data.accounts} totals={data.totalsByCurrency} isToday={isToday} />}
      </Card>

      {/* Movements */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Movement of Funds · {formatDate(date)}</CardTitle>
        </CardHeader>
        {isLoading || !data ? <SkeletonTable cols={10} /> : <MovementTable rows={data.accounts} totals={data.totalsByCurrency} isToday={isToday} />}
      </Card>

      {/* Quota / reserve / BA */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {isLoading || !data ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)
        ) : (
          <>
            <QuotaPanel quotas={data.quotas} onManage={canManage ? () => setQuotaOpen(true) : undefined} />
            <ReservePanel sites={data.reserves} />
            <BankerAcceptanceWidget data={data.bankerAcceptances} />
          </>
        )}
      </div>

      {/* Daily bank balance, actual + projected */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Daily Bank Balance · last 5 days &amp; next 10</CardTitle>
        </CardHeader>
        {gridLoading || !grid ? (
          <SkeletonTable cols={12} />
        ) : (
          <>
            <BalanceMatrix
              columns={grid.dates}
              rows={grid.accounts.map((a) => ({
                key: a.accountId,
                bankName: a.bankName,
                accountName: a.accountName,
                currencyCode: a.currencyCode,
                note: a.overdraftLimit > 0 ? `OD limit ${a.overdraftLimit.toLocaleString()}` : undefined,
                cells: a.cells.map((c) => c.balance),
              }))}
              totals={grid.totalsByCurrency.map((t) => ({ currencyCode: t.currencyCode, cells: t.cells.map((c) => c.balance) }))}
            />
            <p className="border-t border-border px-5 py-3 text-xs text-ink-muted">
              Past days are the recorded closing balance (a quiet day carries the last balance forward). Shaded, italic columns are projected book balances from scheduled payments, expected collections, transfers and banker acceptance maturities.
            </p>
          </>
        )}
      </Card>

      <QuotaManagerDialog open={quotaOpen} onClose={() => setQuotaOpen(false)} />
    </>
  );
}

function CurrencySummary({ t, isToday }: { t: DailyCurrencyTotals; isToday: boolean }) {
  const c = t.currencyCode;
  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-ink-secondary">{c} balance</p>
        <p className="text-[11px] uppercase tracking-wide text-ink-muted">closing</p>
      </div>
      <p className={clsx("font-mono mt-1 text-[24px] font-medium tracking-tight", t.closing < 0 ? "text-status-critical" : "text-ink")}>{formatMoney(t.closing, c)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {t.overdraftLimit > 0 && <Stat wide label="Overdraft used / limit" value={`${formatMoney(t.overdraftUtilised, c)} / ${formatMoney(t.overdraftLimit, c)}`} warn={t.overdraftUtilised > 0} />}
        {isToday ? (
          <>
            <Stat label="Available" value={formatMoney(t.availableCash, c)} />
            <Stat label="Day 1 float" value={formatMoney(t.floatDay1, c)} />
            <Stat label="Day 2 float" value={formatMoney(t.floatDay2, c)} />
            {t.overdraftLimit > 0 && <Stat label="Available incl. OD" value={formatMoney(t.liquidity, c)} />}
          </>
        ) : (
          <Stat label="Opening" value={formatMoney(t.opening, c)} />
        )}
      </dl>
    </Card>
  );
}

function Stat({ label, value, warn, wide }: { label: string; value: string; warn?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-ink-muted">{label}</dt>
      <dd className={clsx("tabular-nums font-medium", warn ? "text-status-warning" : "text-ink")}>{value}</dd>
    </div>
  );
}

function BalancesTable({ rows, totals, isToday }: { rows: DailyAccountRow[]; totals: DailyCurrencyTotals[]; isToday: boolean }) {
  const cols: { key: string; label: string; live?: boolean }[] = [
    { key: "closing", label: "Balance" },
    { key: "overdraft", label: "Overdraft used / limit" },
    { key: "floatDay1", label: "Day 1 float", live: true },
    { key: "floatDay2", label: "Day 2 float", live: true },
    { key: "reserved", label: "Reserved", live: true },
    { key: "availableCash", label: "Available", live: true },
    { key: "liquidity", label: "Available incl. OD", live: true },
  ];
  const visible = cols.filter((c) => isToday || !c.live);

  const cell = (r: DailyAccountRow | DailyCurrencyTotals, key: string): ReactNode => {
    if (key === "overdraft") {
      return r.overdraftLimit > 0 ? (
        <span className={clsx("tabular-nums", r.overdraftUtilised > 0 && "text-status-warning")}>
          {formatNumber(r.overdraftUtilised)} / {formatNumber(r.overdraftLimit)}
        </span>
      ) : (
        <span className="text-ink-muted">—</span>
      );
    }
    return <Num value={(r as unknown as Record<string, number | null>)[key]} tone={key === "closing" || key === "availableCash" || key === "liquidity" ? "balance" : undefined} />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className={clsx(stickyName, "min-w-[220px] text-xs font-medium uppercase tracking-wide text-ink-muted")}>Bank / Account</th>
            <th className={clsx(th, "text-left")}>Ccy</th>
            {visible.map((c) => (
              <th key={c.key} className={th}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.accountId} className="border-b border-border last:border-0">
              <td className={stickyName}>
                <p className="font-medium text-ink">{r.accountName}</p>
                <p className="text-xs text-ink-muted">
                  {r.bankName} · {r.accountNumber}
                  {r.siteName ? ` · ${r.siteName}` : ""}
                </p>
              </td>
              <td className="px-3 py-2.5 text-ink-secondary">{r.currencyCode}</td>
              {visible.map((c) => (
                <td key={c.key} className={td}>
                  {cell(r, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.map((t) => (
            <tr key={t.currencyCode} className="border-t-2 border-border font-semibold">
              <td className={clsx(stickyName, "text-ink")}>Total</td>
              <td className="px-3 py-2.5 text-ink-secondary">{t.currencyCode}</td>
              {visible.map((c) => (
                <td key={c.key} className={td}>
                  {cell(t, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}

function MovementTable({ rows, totals, isToday }: { rows: DailyAccountRow[]; totals: DailyCurrencyTotals[]; isToday: boolean }) {
  const cols: { key: string; label: string; tone?: "in" | "out" | "balance"; live?: boolean }[] = [
    { key: "opening", label: "Opening", tone: "balance" },
    { key: "collections", label: "Collections (+)", tone: "in" },
    { key: "baDrawdown", label: "BA drawdown credited (+)", tone: "in" },
    { key: "transfersIn", label: "Transfers in (+)", tone: "in" },
    { key: "baSettlement", label: "BA settlement (−)", tone: "out" },
    { key: "paymentsOut", label: "Payments (−)", tone: "out" },
    { key: "transfersOut", label: "Transfers out (−)", tone: "out" },
    { key: "otherMovement", label: "Other" },
    { key: "closing", label: "Closing", tone: "balance" },
    { key: "expectedCollections", label: "Still expected in", live: true },
    { key: "scheduledPayments", label: "Still due out", live: true },
    { key: "baMaturing", label: "BA maturing", live: true },
  ];
  const visible = cols.filter((c) => isToday || !c.live);
  const get = (r: DailyAccountRow | DailyCurrencyTotals, key: string) => (r as unknown as Record<string, number | null>)[key];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className={clsx(stickyName, "min-w-[220px] text-xs font-medium uppercase tracking-wide text-ink-muted")}>Bank / Account</th>
            <th className={clsx(th, "text-left")}>Ccy</th>
            {visible.map((c) => (
              <th key={c.key} className={clsx(th, c.live && "bg-plane", c.key === "closing" && "border-l border-border")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.accountId} className="border-b border-border last:border-0">
              <td className={stickyName}>
                <p className="font-medium text-ink">{r.accountName}</p>
                <p className="text-xs text-ink-muted">{r.bankName}</p>
              </td>
              <td className="px-3 py-2.5 text-ink-secondary">{r.currencyCode}</td>
              {visible.map((c) => (
                <td key={c.key} className={clsx(td, c.live && "bg-plane", c.key === "closing" && "border-l border-border font-medium")}>
                  <Num value={get(r, c.key)} tone={c.tone} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.map((t) => (
            <tr key={t.currencyCode} className="border-t-2 border-border font-semibold">
              <td className={clsx(stickyName, "text-ink")}>Total</td>
              <td className="px-3 py-2.5 text-ink-secondary">{t.currencyCode}</td>
              {visible.map((c) => (
                <td key={c.key} className={clsx(td, c.live && "bg-plane", c.key === "closing" && "border-l border-border")}>
                  <Num value={get(t, c.key)} tone={c.tone} />
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
      <p className="border-t border-border px-5 py-3 text-xs text-ink-muted">
        Collections are receipts marked received; BA drawdown is the proceeds credited by the bank and BA settlement the amount debited at maturity. “Other” is any balance change without a ledger entry, such as a manual correction from a bank statement.
        {isToday ? " The shaded columns are what is still scheduled for today (overdue items included)." : ""}
      </p>
    </div>
  );
}
