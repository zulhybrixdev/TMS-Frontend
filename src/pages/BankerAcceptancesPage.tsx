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
import { t } from "../i18n";

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
      header: t("BA Reference"),
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.referenceNo}</p>
          <p className="text-xs text-ink-muted">{r.creditBankName} · {r.creditAccountName}</p>
        </div>
      ),
    },
    { key: "faceAmount", header: t("Face Amount"), sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.faceAmount, r.currencyCode)}</span> },
    { key: "proceedsAmount", header: t("Credited (Proceeds)"), align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.proceedsAmount, r.currencyCode)}</span> },
    {
      key: "cost",
      header: t("Cost"),
      align: "right",
      render: (r) => (
        <div className="tabular-nums">
          <p>{formatMoney(r.discountAmount, r.currencyCode)}</p>
          <p className="text-xs text-ink-muted">{t("{rate}% p.a.", { rate: r.effectiveRatePa.toFixed(2) })}</p>
        </div>
      ),
    },
    { key: "drawdownDate", header: t("Drawdown"), sortable: true, render: (r) => formatDate(r.drawdownDate) },
    {
      key: "maturityDate",
      header: t("Maturity"),
      sortable: true,
      render: (r) => (
        <div>
          <p>{formatDate(r.maturityDate)}</p>
          <p className="text-xs text-ink-muted">{t("{n}-day tenor", { n: r.tenorDays })}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: t("Status"),
      render: (r) =>
        r.status === "SETTLED" ? (
          <div>
            <Badge tone="good">{t("Settled")}</Badge>
            {r.settledDate && <p className="mt-0.5 text-xs text-ink-muted">{formatDate(r.settledDate)}</p>}
          </div>
        ) : r.isOverdue ? (
          <Badge tone="critical">{t("{n}d overdue", { n: -(r.daysToMaturity ?? 0) })}</Badge>
        ) : (r.daysToMaturity ?? 99) <= 7 ? (
          <Badge tone="warning">{r.daysToMaturity === 0 ? t("Due today") : t("Due in {n}d", { n: r.daysToMaturity ?? 0 })}</Badge>
        ) : (
          <Badge tone="neutral">{t("Outstanding")}</Badge>
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
                  {t("Settle")}
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t("Banker Acceptances")}
        description={t("Drawdowns credited to your accounts and their settlement at maturity, with the cost of each.")}
        actions={
          canManage && (
            <Button onClick={() => setDrawOpen(true)}>
              <Plus className="h-4 w-4" /> {t("Draw Down BA")}
            </Button>
          )
        }
      />

      {summary && summary.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((s) => (
            <StatCard
              key={s.currencyCode}
              label={t("Outstanding ({currency})", { currency: s.currencyCode })}
              value={s.outstanding}
              format={(n) => formatMoney(n, s.currencyCode)}
              tone={s.overdue > 0 ? "critical" : "default"}
              footer={
                <span className="text-xs text-ink-muted">
                  {t("{n} BA(s)", { n: s.count })}
                  {s.dueIn7Days > 0 ? t(" · {amount} due within 7 days", { amount: formatMoney(s.dueIn7Days, s.currencyCode) }) : ""}
                  {s.overdue > 0 ? t(" · {amount} overdue", { amount: formatMoney(s.overdue, s.currencyCode) }) : ""}
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
          placeholder={t("Search BA reference or notes...")}
          filters={
            <Select className="h-9 w-40" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
              <option value="">{t("All statuses")}</option>
              <option value="OUTSTANDING">{t("Outstanding")}</option>
              <option value="SETTLED">{t("Settled")}</option>
            </Select>
          }
        />
        {list.isLoading ? (
          <SkeletonTable cols={8} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<Scroll className="h-5 w-5" />} title={t("No banker acceptances yet")} description={canManage ? t("Record a drawdown when the bank credits the proceeds.") : undefined} />
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
