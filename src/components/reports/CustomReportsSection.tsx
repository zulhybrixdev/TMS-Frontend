import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Download, Plus, Trash2, Wand2 } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { AvailableReport, ReportDefinitionRow } from "../../lib/types";
import { PlanGate } from "../PlanGate";
import { Card, CardBody, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Dialog, ConfirmDialog } from "../ui/Dialog";
import { Input, Label, Select } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";

export function CustomReportsSection() {
  return (
    <PlanGate module="advanced_insights" feature="Custom Report Builder">
      <CustomReportsInner />
    </PlanGate>
  );
}

function CustomReportsInner() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReportDefinitionRow | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: definitions, isLoading } = useQuery({ queryKey: ["report-definitions"], queryFn: () => api.get<ReportDefinitionRow[]>("/report-definitions") });

  const download = async (def: ReportDefinitionRow, format: "csv" | "xlsx") => {
    setDownloading(`${def.id}.${format}`);
    try {
      await api.downloadCsv(`/report-definitions/${def.id}/run?format=${format}`, `${def.name}.${format}`);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Export failed", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Wand2 className="h-4 w-4 text-ink-muted" /> Custom Reports
        </CardTitle>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New Custom Report
        </Button>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !definitions || definitions.length === 0 ? (
          <EmptyState
            icon={<Wand2 className="h-5 w-5" />}
            title="No custom reports yet"
            description="Pick a base dataset (Payments, Transfers, ...) and choose exactly the columns you want, saved for one-click export next time."
          />
        ) : (
          <div className="space-y-2">
            {definitions.map((def) => (
              <div key={def.id} className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{def.name}</p>
                  <p className="text-xs text-ink-muted">
                    {def.baseReportLabel} · {def.columns.length} columns · by {def.createdBy.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" loading={downloading === `${def.id}.csv`} onClick={() => download(def, "csv")}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" loading={downloading === `${def.id}.xlsx`} onClick={() => download(def, "xlsx")}>
                    <Download className="h-3.5 w-3.5" /> Excel
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(def)}>
                    <Trash2 className="h-3.5 w-3.5 text-status-critical" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      {createOpen && (
        <CreateReportDialog
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            qc.invalidateQueries({ queryKey: ["report-definitions"] });
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this custom report?"
        description={deleteTarget ? `"${deleteTarget.name}" will be permanently deleted.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await api.delete(`/report-definitions/${deleteTarget.id}`);
            toast.success("Custom report deleted");
            qc.invalidateQueries({ queryKey: ["report-definitions"] });
          } catch (err) {
            toast.error("Could not delete", { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setDeleteTarget(null);
          }
        }}
      />
    </Card>
  );
}

function CreateReportDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: availableReports } = useQuery({ queryKey: ["report-definitions", "available"], queryFn: () => api.get<AvailableReport[]>("/report-definitions/available-reports") });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm({ defaultValues: { name: "", baseReport: "", columns: [] as string[] } });

  const baseReport = watch("baseReport");
  const selectedColumns = watch("columns");
  const columnsForBase = availableReports?.find((r) => r.key === baseReport)?.columns ?? [];

  const toggleColumn = (col: string) => {
    const set = new Set(selectedColumns);
    set.has(col) ? set.delete(col) : set.add(col);
    setValue("columns", Array.from(set));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!values.baseReport || values.columns.length === 0) {
      toast.error("Pick a base report and at least one column");
      return;
    }
    try {
      await api.post("/report-definitions", values);
      toast.success("Custom report saved");
      onSaved();
    } catch (err) {
      toast.error("Could not save custom report", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="New Custom Report"
      description="Pick a base dataset, then choose exactly the columns you want."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="name" required>
            Report Name
          </Label>
          <Input id="name" {...register("name", { required: true, minLength: 2 })} placeholder="e.g. Monthly Payment Summary for Board" />
        </div>
        <div>
          <Label htmlFor="baseReport" required>
            Base Dataset
          </Label>
          <Select
            id="baseReport"
            {...register("baseReport")}
            onChange={(e) => {
              setValue("baseReport", e.target.value);
              setValue("columns", []);
            }}
          >
            <option value="">Select a dataset</option>
            {availableReports?.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        {baseReport && (
          <div>
            <Label required>Columns</Label>
            <div className="flex flex-wrap gap-2">
              {columnsForBase.map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => toggleColumn(col)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    selectedColumns.includes(col) ? "border-brand bg-brand-soft text-brand" : "border-border text-ink-secondary hover:bg-plane"
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
