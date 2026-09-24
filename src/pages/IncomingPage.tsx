import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownLeft, CalendarClock, CheckCircle2, Plus, RefreshCcw } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { ConfirmDialog, Dialog } from "../components/ui/Dialog";
import { RescheduleDialog } from "../components/ui/RescheduleDialog";
import { Label } from "../components/ui/Input";
import { useListQuery } from "../hooks/useListQuery";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { api, ApiError } from "../lib/api-client";
import { dateOnly, formatDate, formatMoney, todayLocal } from "../lib/format";
import type { IncomingTransaction } from "../lib/types";
import { IncomingFormDialog } from "../components/incoming/IncomingFormDialog";

export default function IncomingPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.INCOMING_MANAGE);
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ row: IncomingTransaction; action: "receive" | "reconcile" | "cancel" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState<IncomingTransaction | null>(null);
  const [receiveFloat, setReceiveFloat] = useState(0);

  const list = useListQuery<IncomingTransaction>("incoming", (params) => `/incoming-transactions?${params.toString()}`, { defaultSort: "valueDate" });

  const reschedule = async (valueDate: string, reason: string) => {
    if (!rescheduling) return;
    setBusy(true);
    try {
      await api.post(`/incoming-transactions/${rescheduling.id}/reschedule`, { valueDate, reason: reason || undefined });
      toast.success("Due date updated");
      qc.invalidateQueries({ queryKey: ["incoming"] });
      qc.invalidateQueries({ queryKey: ["forecast-projection"] });
      qc.invalidateQueries({ queryKey: ["treasury-desk"] });
      setRescheduling(null);
    } catch (err) {
      toast.error("Could not change the date", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const runAction = async () => {
    if (!pendingAction) return;
    setBusy(true);
    try {
      await api.post(`/incoming-transactions/${pendingAction.row.id}/${pendingAction.action}`, pendingAction.action === "receive" ? { floatDays: receiveFloat } : undefined);
      toast.success(`Marked as ${pendingAction.action === "receive" ? "received" : pendingAction.action === "reconcile" ? "reconciled" : "cancelled"}`);
      qc.invalidateQueries({ queryKey: ["incoming"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["bank-accounts"] });
      qc.invalidateQueries({ queryKey: ["cash-position"] });
      qc.invalidateQueries({ queryKey: ["treasury-desk"] });
      setPendingAction(null);
    } catch (err) {
      toast.error("Action failed", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<IncomingTransaction>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.reference}</p>
          {r.invoiceNumber && <p className="text-xs text-ink-muted">Inv. {r.invoiceNumber}</p>}
        </div>
      ),
    },
    { key: "sourceName", header: "Source", render: (r) => <span className="min-w-[8rem] inline-block">{r.sourceName}</span> },
    { key: "destinationAccountName", header: "Destination Account", render: (r) => <span className="text-ink-secondary">{r.destinationAccountName}</span> },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "valueDate", header: "Due Date", sortable: true, render: (r) => formatDate(r.valueDate) },
    {
      key: "float",
      header: "Float",
      render: (r) =>
        r.clearingDate && dateOnly(r.clearingDate) > todayLocal() ? (
          <span className="whitespace-nowrap text-xs text-status-warning">Clears {formatDate(r.clearingDate, { day: "2-digit", month: "short" })}</span>
        ) : r.floatDays > 0 && r.status === "EXPECTED" ? (
          <span className="whitespace-nowrap text-xs text-ink-secondary">Day {r.floatDays}</span>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
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
                  <Button size="sm" variant="outline" onClick={() => setRescheduling(r)} aria-label="Adjust due date" title="Adjust due date">
                    <CalendarClock className="h-3.5 w-3.5" />
                  </Button>
                )}
                {r.status === "EXPECTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReceiveFloat(r.floatDays);
                      setPendingAction({ row: r, action: "receive" });
                    }}
                  >
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
          <SkeletonTable cols={8} />
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
        open={pendingAction?.action === "reconcile"}
        onClose={() => setPendingAction(null)}
        onConfirm={runAction}
        title="Mark as reconciled?"
        description="This confirms the incoming transaction has been matched against the bank statement."
        confirmLabel="Confirm"
        loading={busy}
      />

      <Dialog
        open={pendingAction?.action === "receive"}
        onClose={() => setPendingAction(null)}
        title="Mark as received?"
        description="This posts a ledger entry and immediately increases the destination account's balance."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={runAction} loading={busy}>
              Confirm
            </Button>
          </>
        }
      >
        <Label htmlFor="receive-float">How do the funds clear?</Label>
        <Select id="receive-float" value={receiveFloat} onChange={(e) => setReceiveFloat(Number(e.target.value))}>
          <option value={0}>Cleared - available now</option>
          <option value={1}>Day 1 float - usable from the next business day</option>
          <option value={2}>Day 2 float - usable two business days on</option>
        </Select>
        <p className="mt-2 text-[12px] text-ink-muted">The balance goes up now either way; float is shown separately and kept out of available cash until it clears.</p>
      </Dialog>

      <RescheduleDialog
        open={!!rescheduling}
        onClose={() => setRescheduling(null)}
        onConfirm={reschedule}
        currentDate={rescheduling?.valueDate ?? todayLocal()}
        subject={rescheduling ? `${rescheduling.reference} · ${rescheduling.sourceName}` : ""}
        loading={busy}
      />
    </>
  );
}
