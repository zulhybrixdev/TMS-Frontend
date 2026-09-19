import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { StatCard } from "../components/ui/StatCard";
import { DataTable, Column } from "../components/ui/Table";
import { Skeleton, SkeletonTable, SkeletonStatCard } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { ForecastChart } from "../components/charts/ForecastChart";
import { api } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney } from "../lib/format";
import type { ForecastEntry, ForecastProjectionPoint } from "../lib/types";
import { ForecastEntryDialog } from "../components/forecast/ForecastEntryDialog";

const HORIZONS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
];

const confidenceTone = { HIGH: "good", MEDIUM: "warning", LOW: "neutral" } as const;

export default function ForecastPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.FORECASTS_MANAGE);
  const [horizon, setHorizon] = useState(30);
  const [createOpen, setCreateOpen] = useState(false);
  const qc = useQueryClient();

  const to = new Date(Date.now() + horizon * 86400000).toISOString().slice(0, 10);
  const from = new Date().toISOString().slice(0, 10);

  const { data: projection, isLoading: projectionLoading } = useQuery({
    queryKey: ["forecast-projection", horizon],
    queryFn: () => api.get<ForecastProjectionPoint[]>(`/forecasts/projection?from=${from}&to=${to}`),
  });

  const { data: entries, isLoading: entriesLoading, isError, error, refetch } = useQuery({
    queryKey: ["forecast-entries", horizon],
    queryFn: () => api.get<ForecastEntry[]>(`/forecasts?from=${from}&to=${to}`),
  });

  const totalInflow = projection?.reduce((s, p) => s + p.inflow, 0) ?? 0;
  const totalOutflow = projection?.reduce((s, p) => s + p.outflow, 0) ?? 0;
  const endBalance = projection?.length ? projection[projection.length - 1].projectedBalance : 0;
  const worstDay = projection?.reduce((min, p) => (p.projectedBalance < min.projectedBalance ? p : min), projection[0]);

  const columns: Column<ForecastEntry>[] = [
    { key: "forecastDate", header: "Date", sortable: false, render: (r) => formatDate(r.forecastDate) },
    { key: "description", header: "Description", render: (r) => <span className="text-ink">{r.description || r.sourceReference || "—"}</span> },
    { key: "accountName", header: "Account", render: (r) => <span className="text-ink-secondary">{r.accountName}</span> },
    { key: "category", header: "Category", render: (r) => <Badge tone={r.category === "INFLOW" ? "good" : "critical"}>{r.category === "INFLOW" ? "Inflow" : "Outflow"}</Badge> },
    { key: "amount", header: "Amount", align: "right", render: (r) => <span className="tabular-nums font-medium">{formatMoney(r.amount, r.currencyCode)}</span> },
    { key: "confidence", header: "Confidence", render: (r) => <Badge tone={confidenceTone[r.confidence]}>{r.confidence}</Badge> },
    { key: "sourceType", header: "Source", render: (r) => <span className="text-xs text-ink-muted">{r.sourceType === "MANUAL" ? "Manual" : r.sourceType}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Cash Forecast"
        description="Projected balance combining pending payments, expected receipts, transfers, and manual entries."
        actions={
          <>
            <Select className="h-9 w-32" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
              {HORIZONS.map((h) => (
                <option key={h.days} value={h.days}>
                  {h.label}
                </option>
              ))}
            </Select>
            {canManage && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {projectionLoading || !projection ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard label="Expected Inflows" value={totalInflow} format={(n) => formatMoney(n)} icon={TrendingUp} />
            <StatCard label="Expected Outflows" value={totalOutflow} format={(n) => formatMoney(n)} icon={TrendingDown} />
            <StatCard label={`Projected Balance (${horizon}d)`} value={endBalance} format={(n) => formatMoney(n)} tone={endBalance < 0 ? "critical" : "default"} />
            <StatCard label="Lowest Projected Point" value={worstDay?.projectedBalance ?? 0} format={(n) => formatMoney(n)} tone={worstDay && worstDay.projectedBalance < 0 ? "critical" : "default"} footer={worstDay && <span className="text-xs text-ink-muted">on {formatDate(worstDay.date)}</span>} />
          </>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Projected Balance</CardTitle>
        </CardHeader>
        <CardBody>{projectionLoading || !projection ? <Skeleton className="h-[300px] w-full" /> : projection.length === 0 ? <EmptyState title="No forecast data" /> : <ForecastChart data={projection} />}</CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Forecast Line Items</CardTitle>
        </CardHeader>
        {entriesLoading ? (
          <SkeletonTable cols={7} />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message} onRetry={refetch} />
        ) : !entries || entries.length === 0 ? (
          <EmptyState title="No forecast line items in this window" />
        ) : (
          <DataTable columns={columns} rows={entries} rowKey={(r) => r.id} />
        )}
      </Card>

      <ForecastEntryDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          qc.invalidateQueries({ queryKey: ["forecast-entries"] });
          qc.invalidateQueries({ queryKey: ["forecast-projection"] });
        }}
      />
    </>
  );
}
