import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, ShieldAlert } from "lucide-react";
import { Dialog } from "../../components/ui/Dialog";
import { DataTable, Pagination } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { platformApiFor } from "../../lib/platform-api-client";
import type { PlatformEnvironment } from "../../lib/platform-environments";
import { formatDateTime, initials } from "../../lib/format";
import type { AuditLogRow } from "../../lib/types";
import type { PlatformTenantRow } from "../../lib/platform-types";

// The combined audit timeline for one tenant - both what its own users did
// and every platform-admin action taken on it (suspend/activate/plan
// override/impersonation), interleaved by time. This replaces the
// tenant-facing Audit Logs page - audit oversight is platform-only now.
export function TenantAuditLogDialog({ tenant, env, onClose }: { tenant: PlatformTenantRow; env: PlatformEnvironment; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["platform", "tenants", env.key, tenant.id, "audit-logs", page],
    queryFn: () => platformApiFor(env).getPaginated<AuditLogRow>(`/tenants/${tenant.id}/audit-logs?page=${page}&pageSize=${pageSize}`),
  });

  return (
    <Dialog open onClose={onClose} title={`Audit log — ${tenant.name} (${env.label})`} description="Tenant user activity and platform-admin actions, newest first." size="xl">
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon={<History className="h-5 w-5" />} title="No audit records yet" />
      ) : (
        <div className="-mx-5">
          <DataTable<AuditLogRow>
            columns={[
              { key: "createdAt", header: "Date", render: (r) => <span className="whitespace-nowrap text-ink-secondary">{formatDateTime(r.createdAt)}</span> },
              {
                key: "actor",
                header: "Actor",
                render: (r) =>
                  r.action.startsWith("platform.") ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-warning-soft px-2 py-0.5 text-[12px] font-medium text-status-warning">
                      <ShieldAlert className="h-3 w-3" /> Platform support
                    </span>
                  ) : r.actor ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[9.5px] font-semibold text-brand">{initials(r.actor.name)}</span>
                      {r.actor.name}
                    </span>
                  ) : (
                    <span className="text-ink-muted">System</span>
                  ),
              },
              {
                key: "action",
                header: "Action",
                render: (r) => (
                  <Badge tone={r.action.startsWith("platform.") ? "warning" : "neutral"} className="font-mono !text-[11px]">
                    {r.action}
                  </Badge>
                ),
              },
              { key: "entityType", header: "Entity", render: (r) => <span className="text-ink-muted">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ""}</span> },
            ]}
            rows={data.items}
            rowKey={(r) => r.id}
          />
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} pageSize={pageSize} onPage={setPage} />
        </div>
      )}
    </Dialog>
  );
}
