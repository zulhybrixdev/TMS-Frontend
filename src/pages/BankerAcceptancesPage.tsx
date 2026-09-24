import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Scroll } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { StatCard } from "../components/ui/StatCard";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { DrawdownDialog, SettleDialog } from "../components/treasury/BankerAcceptanceDialogs";
import { useListQuery } from "../hooks/useListQuery";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { api } from "../lib/api-client";
import { formatDate, formatMoney } from "../lib/format";
import type { BankerAcceptance, BankerAcceptanceSummary } from "../lib/types";

export default function BankerAcceptancesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.ACCOUNTS_MANAGE);
  const qc = useQueryClient();
  const [drawOpen, setDrawOpen] = useState(false);
  const [settling, setSettling] = useState<BankerAcceptance | null>(null);

  const list = useListQuery<BankerAcceptance>("banker-acceptances", (params) => `/banker-acceptances?${params.toString()}`, { defaultSort: "maturityDate" });
  const { data: summary } = useQuery({ queryKey: ["banker-acceptances-summary"], queryFn: () => api.get<BankerAcceptanceSummary[]>("/banker-acceptances/summary") });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["banker-acceptances"] });
    qc.invalidateQueries({ queryKey: ["banker-acceptances-summary"] });
    qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    qc.invalidateQueries({ queryKey: ["cash-position"] });
    qc.invalidateQueries({ queryKey: ["treasury-desk"] });
    qc.invalidateQueries({ queryKey: ["forecast-projection"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const columns: Column<BankerAcceptance>[] = [
    {
      key: "referenceNo",
      header: "BA Reference",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.referenceNo}</p>
          <p className="text-xs text-ink-muted">{r.creditBankName} · {r.creditAccountName}</p>
        </div>
      ),
    },
    { key: "faceAmount", header: "Face Amount", sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.faceAmount, r.currencyCode)}</span> },
    { key: "proceedsAmount", header: "Credited (Proceeds)", align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.proceedsAmount, r.currencyCode)}</span> },
    {
      key: "cost",
      header: "Cost",
      align: "right",
      render: (r) => (
        <div className="tabular-nums">
          <p>{formatMoney(r.discountAmount, r.currencyCode)}</p>
          <p className="text-xs text-ink-muted">{r.effectiveRatePa.toFixed(2)}% p.a.</p>
        </div>
      ),
    },
    { key: "drawdownDate", header: "Drawdown", sortable: true, render: (r) => formatDate(r.drawdownDate) },
    {
      key: "maturityDate",
      header: "Maturity",
      sortable: true,
      render: (r) => (
        <div>
          <p>{formatDate(r.maturityDate)}</p>
          <p className="text-xs text-ink-muted">{r.tenorDays}-day tenor</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.status === "SETTLED" ? (
          <div>
            <Badge tone="good">Settled</Badge>
            {r.settledDate && <p className="mt-0.5 text-xs text-ink-muted">{formatDate(r.settledDate)}</p>}
          </div>
        ) : r.isOverdue ? (
          <Badge tone="critical">{-(r.daysToMaturity ?? 0)}d overdue</Badge>
        ) : (r.daysToMaturity ?? 99) <= 7 ? (
          <Badge tone="warning">{r.daysToMaturity === 0 ? "Due today" : `Due in ${r.daysToMaturity}d`}</Badge>
        ) : (
          <Badge tone="neutral">Outstanding</Badge>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (r: BankerAcceptance) =>
              r.status === "OUTSTANDING" ? (
                <Button size="sm" variant="outline" onClick={() => setSettling(r)}>
                  Settle
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Banker Acceptances"
        description="Drawdowns credited to your accounts and their settlement at maturity, with the cost of each."
        actions={
          canManage && (
            <Button onClick={() => setDrawOpen(true)}>
              <Plus className="h-4 w-4" /> Draw Down BA
            </Button>
          )
        }
      />

      {summary && summary.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((s) => (
            <StatCard
              key={s.currencyCode}
              label={`Outstanding (${s.currencyCode})`}
              value={s.outstanding}
              format={(n) => formatMoney(n, s.currencyCode)}
              tone={s.overdue > 0 ? "critical" : "default"}
              footer={
                <span className="text-xs text-ink-muted">
                  {s.count} BA{s.count > 1 ? "s" : ""}
                  {s.dueIn7Days > 0 ? ` · ${formatMoney(s.dueIn7Days, s.currencyCode)} due within 7 days` : ""}
                  {s.overdue > 0 ? ` · ${formatMoney(s.overdue, s.currencyCode)} overdue` : ""}
                </span>
              }
            />
          ))}
        </div>
      )}

      <Card>
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search BA reference or notes..."
          filters={
            <Select className="h-9 w-40" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
              <option value="">All statuses</option>
              <option value="OUTSTANDING">Outstanding</option>
              <option value="SETTLED">Settled</option>
            </Select>
          }
        />
        {list.isLoading ? (
          <SkeletonTable cols={8} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<Scroll className="h-5 w-5" />} title="No banker acceptances yet" description={canManage ? "Record a drawdown when the bank credits the proceeds." : undefined} />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} />
        )}
        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>

      <DrawdownDialog
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        onSaved={() => {
          setDrawOpen(false);
          refresh();
        }}
      />
      <SettleDialog
        ba={settling}
        onClose={() => setSettling(null)}
        onSaved={() => {
          setSettling(null);
          refresh();
        }}
      />
    </>
  );
}
