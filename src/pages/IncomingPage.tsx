import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownLeft, CheckCircle2, Plus, RefreshCcw } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { ConfirmDialog } from "../components/ui/Dialog";
import { useListQuery } from "../hooks/useListQuery";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { api, ApiError } from "../lib/api-client";
import { formatDate, formatMoney } from "../lib/format";
import type { IncomingTransaction } from "../lib/types";
import { IncomingFormDialog } from "../components/incoming/IncomingFormDialog";

export default function IncomingPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.INCOMING_MANAGE);
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ row: IncomingTransaction; action: "receive" | "reconcile" | "cancel" } | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useListQuery<IncomingTransaction>("incoming", (params) => `/incoming-transactions?${params.toString()}`, { defaultSort: "valueDate" });

  const runAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await api.post(`/incoming-transactions/${pendingAction.row.id}/${pendingAction.action}`);
      toast.success(`Marked as ${pendingAction.action === "receive" ? "received" : pendingAction.action === "reconcile" ? "reconciled" : "cancelled"}`);
      qc.invalidateQueries({ queryKey: ["incoming"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setPendingAction(null);
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<IncomingTransaction>[] = [
    { key: "reference", header: "Reference", render: (r) => <span className="font-medium text-ink">{r.reference}</span> },
    { key: "sourceName", header: "Source", render: (r) => r.sourceName },
    { key: "destinationAccountName", header: "Destination Account", render: (r) => <span className="text-ink-secondary">{r.destinationAccountName}</span> },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "valueDate", header: "Value Date", sortable: true, render: (r) => formatDate(r.valueDate) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (r: IncomingTransaction) => (
              <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                {r.status === "EXPECTED" && (
                  <Button size="sm" variant="outline" onClick={() => setPendingAction({ row: r, action: "receive" })}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Receive
                  </Button>
                )}
                {r.status === "RECEIVED" && (
                  <Button size="sm" variant="outline" onClick={() => setPendingAction({ row: r, action: "reconcile" })}>
                    <RefreshCcw className="h-3.5 w-3.5" /> Reconcile
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Incoming Transactions"
        description="Expected and received incoming payments across all company accounts."
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Record Incoming
            </Button>
          )
        }
      />

      <Card>
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search reference or source..."
          filters={
            <Select className="h-9 w-44" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
              <option value="">All statuses</option>
              <option value="EXPECTED">Expected</option>
              <option value="RECEIVED">Received</option>
              <option value="RECONCILED">Reconciled</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          }
        />

        {list.isLoading ? (
          <SkeletonTable cols={6} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<ArrowDownLeft className="h-5 w-5" />} title="No incoming transactions found" />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} />
        )}

        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>

      <IncomingFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["incoming"] });
        }}
      />

      <ConfirmDialog
        open={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title={pendingAction?.action === "receive" ? "Mark as received?" : "Mark as reconciled?"}
        description={
          pendingAction?.action === "receive"
            ? "This posts a ledger entry and immediately increases the destination account's balance."
            : "This confirms the incoming transaction has been matched against the bank statement."
        }
        confirmLabel="Confirm"
        loading={busy}
      />
    </>
  );
}
