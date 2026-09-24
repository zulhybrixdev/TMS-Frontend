import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Plus } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { useListQuery } from "../hooks/useListQuery";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney } from "../lib/format";
import { PAYMENT_METHOD_LABEL, type Payment } from "../lib/types";
import { PaymentFormDialog } from "../components/payments/PaymentFormDialog";

const STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PROCESSED", "CANCELLED"];

export default function PaymentsPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.PAYMENTS_CREATE);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const list = useListQuery<Payment>("payments", (params) => `/payments?${params.toString()}`, { defaultSort: "createdAt" });

  const columns: Column<Payment>[] = [
    { key: "paymentNumber", header: "Payment #", render: (r) => <span className="font-medium text-ink">{r.paymentNumber}</span> },
    {
      key: "beneficiaryName",
      header: "Beneficiary",
      render: (r) => (
        <div>
          <p className="text-ink">{r.beneficiaryName}</p>
          <p className="text-xs text-ink-muted">{r.paymentMethod === "TRANSFER" ? r.beneficiaryBank : PAYMENT_METHOD_LABEL[r.paymentMethod]}{r.invoiceNumber ? ` · ${r.invoiceNumber}` : ""}</p>
        </div>
      ),
    },
    { key: "sourceAccountName", header: "Source Account", render: (r) => <span className="text-ink-secondary">{r.sourceAccountName}</span> },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "paymentDate", header: "Due Date", sortable: true, render: (r) => formatDate(r.paymentDate) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "requestedBy", header: "Requested By", render: (r) => <span className="text-xs text-ink-muted">{r.requestedBy?.name}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Payments"
        description="Create, submit, and track outgoing payments through approval."
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Payment
            </Button>
          )
        }
      />

      <Card>
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search payment #, beneficiary, reference..."
          filters={
            <>
              <Select className="h-9 w-44" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
              <Select className="h-9 w-40" value={list.filters.paymentMethod ?? ""} onChange={(e) => list.setFilter("paymentMethod", e.target.value)}>
                <option value="">All methods</option>
                <option value="TRANSFER">Bank transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_DRAFT">Bank draft</option>
              </Select>
            </>
          }
        />

        {list.isLoading ? (
          <SkeletonTable cols={7} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<ArrowUpRight className="h-5 w-5" />} title="No payments found" description="Create a new payment to get started." />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} onRowClick={(r) => navigate(`/payments/${r.id}`)} />
        )}

        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>

      <PaymentFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(payment) => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["payments"] });
          navigate(`/payments/${payment.id}`);
        }}
      />
    </>
  );
}
