import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Tabs } from "../components/ui/Tabs";
import { DataTable, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge, Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney } from "../lib/format";
import type { ApprovalRequestSummary, Paginated } from "../lib/types";
import { ApprovalActionDialog } from "../components/approvals/ApprovalActionDialog";

type TabKey = "pending" | "mine" | "all";

export default function ApprovalCenterPage() {
  const { hasPermission } = useAuth();
  const canAct = hasPermission(PERMISSIONS.APPROVALS_ACT);
  const [tab, setTab] = useState<TabKey>(canAct ? "pending" : "mine");
  const [selected, setSelected] = useState<ApprovalRequestSummary | null>(null);
  const qc = useQueryClient();

  const endpoint = tab === "pending" ? "/approvals/pending" : tab === "mine" ? "/approvals/mine" : "/approvals";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["approvals", tab],
    queryFn: () => api.getPaginated<ApprovalRequestSummary>(`${endpoint}?pageSize=50`),
  });

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["approvals"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["payments"] });
    qc.invalidateQueries({ queryKey: ["transfers"] });
    setSelected(null);
  };

  const columns: Column<ApprovalRequestSummary>[] = [
    {
      key: "label",
      header: "Request",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.label}</p>
          <p className="text-xs text-ink-muted">{r.entityType === "PAYMENT" ? "Payment" : "Transfer"}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "level", header: "Level", render: (r) => <Badge tone="neutral">{r.currentLevel} / {r.requiredLevels}</Badge> },
    { key: "createdAt", header: "Submitted", render: (r) => formatDate(r.createdAt) },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button size="sm" variant={tab === "pending" ? "primary" : "outline"} onClick={() => setSelected(r)}>
          {tab === "pending" ? "Review" : "View"}
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Approval Center" description="Review and act on pending payment and transfer requests." />

      <Card>
        <Tabs
          tabs={[
            ...(canAct ? [{ key: "pending", label: "Pending My Action", count: tab === "pending" ? data?.meta.total : undefined }] : []),
            { key: "mine", label: "My Requests" },
            { key: "all", label: "All Requests" },
          ]}
          active={tab}
          onChange={(k) => setTab(k as TabKey)}
        />

        {isLoading ? (
          <SkeletonTable cols={6} />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="Nothing here" description={tab === "pending" ? "You're all caught up — no approvals waiting on you." : "No requests found."} />
        ) : (
          <DataTable columns={columns} rows={data.items} rowKey={(r) => r.id} onRowClick={setSelected} />
        )}
      </Card>

      {selected && <ApprovalActionDialog request={selected} onClose={() => setSelected(null)} onDone={refreshAll} />}
    </>
  );
}
