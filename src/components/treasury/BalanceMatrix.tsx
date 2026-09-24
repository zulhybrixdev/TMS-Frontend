import clsx from "clsx";
import { formatDate, formatNumber } from "../../lib/format";

export interface MatrixColumn {
  date: string;
  kind: "actual" | "today" | "projected";
}

export interface MatrixRow {
  key: string;
  bankName: string;
  accountName: string;
  currencyCode: string;
  /** Shown as a small note under the account name, e.g. "OD limit 100,000". */
  note?: string;
  cells: (number | null)[];
}

// Bank x date grid of balances - used for the Daily Cash Desk (recent actuals,
// today, then projected days) and for the per-bank forecast. Each currency
// gets its own subtotal row: balances in different currencies are never summed.
export function BalanceMatrix({ columns, rows, totals }: { columns: MatrixColumn[]; rows: MatrixRow[]; totals: { currencyCode: string; cells: (number | null)[] }[] }) {
  const columnTone = (kind: MatrixColumn["kind"]) => (kind === "today" ? "bg-brand-soft" : kind === "projected" ? "bg-plane" : "");

  const renderCell = (value: number | null, kind: MatrixColumn["kind"]) => {
    if (value === null) return <span className="text-ink-muted">—</span>;
    return <span className={clsx("tabular-nums", value < 0 && "text-status-critical", kind === "projected" && "italic")}>{formatNumber(value)}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 min-w-[220px] bg-surface-raised px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">Bank / Account</th>
            <th className="px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">Ccy</th>
            {columns.map((c) => (
              <th key={c.date} className={clsx("whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-ink-muted", columnTone(c.kind))}>
                <p className="uppercase tracking-wide">{formatDate(c.date, { weekday: "short", day: "2-digit", month: "short" })}</p>
                <p className="text-[10px] font-normal normal-case">{c.kind === "actual" ? "actual" : c.kind === "today" ? "today" : "projected"}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <td className="sticky left-0 z-10 bg-surface-raised px-5 py-2.5">
                <p className="font-medium text-ink">{row.accountName}</p>
                <p className="text-xs text-ink-muted">
                  {row.bankName}
                  {row.note ? ` · ${row.note}` : ""}
                </p>
              </td>
              <td className="px-3 py-2.5 text-ink-secondary">{row.currencyCode}</td>
              {row.cells.map((v, i) => (
                <td key={columns[i].date} className={clsx("whitespace-nowrap px-3 py-2.5 text-right", columnTone(columns[i].kind))}>
                  {renderCell(v, columns[i].kind)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {totals.map((t) => (
            <tr key={t.currencyCode} className="border-t-2 border-border font-semibold">
              <td className="sticky left-0 z-10 bg-surface-raised px-5 py-2.5 text-ink">Total</td>
              <td className="px-3 py-2.5 text-ink-secondary">{t.currencyCode}</td>
              {t.cells.map((v, i) => (
                <td key={columns[i].date} className={clsx("whitespace-nowrap px-3 py-2.5 text-right", columnTone(columns[i].kind))}>
                  {renderCell(v, columns[i].kind)}
                </td>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}
