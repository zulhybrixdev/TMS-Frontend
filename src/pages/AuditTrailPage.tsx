import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select, Input, Label } from "../components/ui/Input";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { useListQuery } from "../hooks/useListQuery";
import { api } from "../lib/api-client";
import { formatDateTime } from "../lib/format";
import type { AuditLogRow } from "../lib/types";

export default function AuditTrailPage() {
  const { data: entityTypes } = useQuery({ queryKey: ["audit-logs", "entity-types"], queryFn: () => api.get<string[]>("/audit-logs/entity-types") });
  const list = useListQuery<AuditLogRow>("audit-logs", (params) => `/audit-logs?${params.toString()}`, { defaultSort: "createdAt" });

  const columns: Column<AuditLogRow>[] = [
    { key: "createdAt", header: "When", render: (r) => <span className="text-xs text-ink-muted tabular-nums">{formatDateTime(r.createdAt)}</span> },
    {
      key: "actor",
      header: "Who",
      render: (r) => (r.actor ? <span className="text-ink">{r.actor.name}</span> : <span className="text-ink-muted">System</span>),
    },
    { key: "action", header: "Action", render: (r) => <code className="rounded bg-plane px-1.5 py-0.5 text-xs text-ink-secondary">{r.action}</code> },
    { key: "entityType", header: "Entity", render: (r) => r.entityType },
    { key: "entityId", header: "Entity ID", render: (r) => <span className="text-xs text-ink-muted">{r.entityId ?? "—"}</span> },
    { key: "ipAddress", header: "IP", render: (r) => <span className="text-xs text-ink-muted">{r.ipAddress ?? "—"}</span> },
  ];

  return (
    <>
      <PageHeader title="Audit Trail" description="Every recorded action in your tenant, who did it, and when - your own copy, self-serve (Pro+)." />

      <Card>
        <Toolbar
          search=""
          onSearch={() => {}}
          hideSearch
          filters={
            <>
              <Select className="h-9 w-44" value={list.filters.entityType ?? ""} onChange={(e) => list.setFilter("entityType", e.target.value)}>
                <option value="">All entities</option>
                {entityTypes?.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-1.5">
                <Label className="mb-0 whitespace-nowrap">From</Label>
                <Input type="date" className="h-9 w-36" value={list.filters.from ?? ""} onChange={(e) => list.setFilter("from", e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="mb-0 whitespace-nowrap">To</Label>
                <Input type="date" className="h-9 w-36" value={list.filters.to ?? ""} onChange={(e) => list.setFilter("to", e.target.value)} />
              </div>
            </>
          }
        />

        {list.isLoading ? (
          <SkeletonTable cols={6} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<History className="h-5 w-5" />} title="No audit events found" description="Try widening your date range or clearing the entity filter." />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} />
        )}

        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>
    </>
  );
}
