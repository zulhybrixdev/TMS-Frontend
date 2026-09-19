import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable, Skeleton } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge, Badge } from "../components/ui/Badge";
import { useListQuery } from "../hooks/useListQuery";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { api } from "../lib/api-client";
import { formatDate, formatMoney } from "../lib/format";
import type { Transfer, TransferRecommendation } from "../lib/types";
import { TransferFormDialog } from "../components/transfers/TransferFormDialog";

const STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"];

export default function TransfersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.TRANSFERS_CREATE);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<TransferRecommendation | null>(null);

  const list = useListQuery<Transfer>("transfers", (params) => `/transfers?${params.toString()}`, { defaultSort: "createdAt" });

  const { data: recommendations, isLoading: recLoading } = useQuery({
    queryKey: ["transfer-recommendations"],
    queryFn: () => api.get<TransferRecommendation[]>("/transfers/recommendations"),
  });

  const columns: Column<Transfer>[] = [
    { key: "transferNumber", header: "Transfer #", render: (r) => <span className="font-medium text-ink">{r.transferNumber}</span> },
    { key: "sourceAccountName", header: "From", render: (r) => <span className="text-ink-secondary">{r.sourceAccountName}</span> },
    { key: "destinationAccountName", header: "To", render: (r) => <span className="text-ink-secondary">{r.destinationAccountName}</span> },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "transferDate", header: "Date", sortable: true, render: (r) => formatDate(r.transferDate) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "isSystemRecommended", header: "Source", render: (r) => (r.isSystemRecommended ? <Badge tone="brand">System recommended</Badge> : <span className="text-xs text-ink-muted">Manual</span>) },
  ];

  return (
    <>
      <PageHeader
        title="Inter-Bank Transfers"
        description="Move funds between company accounts to cover shortfalls or sweep excess cash."
        actions={
          canCreate && (
            <Button
              onClick={() => {
                setPrefill(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New Transfer
            </Button>
          )
        }
      />

      {canCreate && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand" /> Recommended Transfers
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {recLoading ? (
              <Skeleton className="m-5 h-16" />
            ) : !recommendations || recommendations.length === 0 ? (
              <EmptyState title="No transfers recommended right now" description="Every account is currently within its configured minimum balance." />
            ) : (
              <div className="divide-y divide-border">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {rec.sourceAccountName} <ArrowLeftRight className="mx-1 inline h-3 w-3 text-ink-muted" /> {rec.destinationAccountName}
                      </p>
                      <p className="mt-0.5 text-[12px] text-ink-secondary">{rec.reason}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-[14px] font-semibold tabular-nums text-ink">{formatMoney(rec.amount, rec.currencyCode)}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPrefill(rec);
                          setFormOpen(true);
                        }}
                      >
                        Review & Create
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder="Search transfer #..."
          filters={
            <Select className="h-9 w-44" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          }
        />

        {list.isLoading ? (
          <SkeletonTable cols={7} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<ArrowLeftRight className="h-5 w-5" />} title="No transfers found" />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} onRowClick={(r) => navigate(`/transfers/${r.id}`)} />
        )}

        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>

      <TransferFormDialog
        open={formOpen}
        prefill={prefill}
        onClose={() => setFormOpen(false)}
        onSaved={(transfer) => {
          setFormOpen(false);
          qc.invalidateQueries({ queryKey: ["transfers"] });
          qc.invalidateQueries({ queryKey: ["transfer-recommendations"] });
          navigate(`/transfers/${transfer.id}`);
        }}
      />
    </>
  );
}
