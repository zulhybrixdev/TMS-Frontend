import { ReactNode } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, rows, rowKey, sortBy, sortDir, onSort, onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "whitespace-nowrap px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-muted",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                  col.sortable && "cursor-pointer select-none hover:text-ink-secondary"
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className={clsx("inline-flex items-center gap-1", col.align === "right" && "flex-row-reverse")}>
                  {col.header}
                  {col.sortable && (sortBy === col.key ? sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3 opacity-40" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={clsx("group relative border-b border-border last:border-0 transition-colors", onRowClick && "cursor-pointer hover:bg-plane")}
            >
              {columns.map((col, i) => (
                <td key={col.key} className={clsx("relative px-5 py-3 text-ink", col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left", col.className)}>
                  {i === 0 && onRowClick && (
                    <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 origin-center rounded-r-full bg-brand transition-[height] duration-200 ease-out group-hover:h-[60%]" />
                  )}
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, total, pageSize, onPage }: { page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[13px] text-ink-secondary">
      <span>
        Showing <span className="font-medium text-ink">{start}-{end}</span> of <span className="font-medium text-ink">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-md px-2.5 py-1 hover:bg-plane disabled:opacity-40 disabled:hover:bg-transparent">
          Previous
        </button>
        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-md px-2.5 py-1 hover:bg-plane disabled:opacity-40 disabled:hover:bg-transparent">
          Next
        </button>
      </div>
    </div>
  );
}
