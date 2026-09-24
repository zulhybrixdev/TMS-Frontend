import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { ApprovalRule, Role } from "../../lib/types";
import { DataTable, Column } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { Input, Label, Select } from "../../components/ui/Input";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatMoney } from "../../lib/format";
import { t, tEnum } from "../../i18n";

export function ApprovalRulesTab() {
  const qc = useQueryClient();
  const { data: rules, isLoading } = useQuery({ queryKey: ["approval-rules"], queryFn: () => api.get<ApprovalRule[]>("/approval-rules") });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/roles") });
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApprovalRule | null>(null);

  const columns: Column<ApprovalRule>[] = [
    { key: "entityType", header: t("Applies To"), render: (r) => <Badge tone="neutral">{tEnum(r.entityType)}</Badge> },
    {
      key: "range",
      header: t("Amount Range"),
      render: (r) => (
        <span className="tabular-nums">
          {formatMoney(r.minAmount, r.currencyCode ?? "MYR")} – {r.maxAmount ? formatMoney(r.maxAmount, r.currencyCode ?? "MYR") : "∞"}
        </span>
      ),
    },
    { key: "currencyCode", header: t("Currency"), render: (r) => r.currencyCode ?? "Any" },
    { key: "department", header: t("Department"), render: (r) => r.department ?? "Any" },
    { key: "requiredLevels", header: t("Levels"), render: (r) => r.requiredLevels },
    { key: "roles", header: t("Required Approvers"), render: (r) => <span className="text-ink-secondary">{r.requiredRoleLevel1}{r.requiredRoleLevel2 ? ` → ${r.requiredRoleLevel2}` : ""}</span> },
    { key: "isActive", header: t("Active"), render: (r) => (r.isActive ? <Badge tone="good">{t("Active")}</Badge> : <Badge tone="neutral">{t("Inactive")}</Badge>) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}>
          <Trash2 className="h-3.5 w-3.5 text-status-critical" />
        </Button>
      ),
    },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <p className="mb-4 text-[13px] text-ink-secondary">
        {t("Approval levels are resolved by matching the payment/transfer's entity type, currency, and amount against these rules (highest priority, most specific first). If no rule matches, a single Finance Checker approval is required by default.")}
      </p>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t("Add Rule")}
        </Button>
      </div>

      {!rules || rules.length === 0 ? (
        <EmptyState title={t("No approval rules configured")} description={t("The system default of a single Finance Checker approval will apply to everything.")} />
      ) : (
        <DataTable columns={columns} rows={rules} rowKey={(r) => r.id} />
      )}

      {open && (
        <RuleFormDialog
          roles={roles ?? []}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["approval-rules"] });
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await api.delete(`/approval-rules/${deleteTarget.id}`);
            toast.success(t("Rule removed"));
            qc.invalidateQueries({ queryKey: ["approval-rules"] });
          } catch (err) {
            toast.error(t("Could not remove rule"), { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setDeleteTarget(null);
          }
        }}
        title={t("Remove this approval rule?")}
        confirmLabel={t("Remove")}
        tone="danger"
      />
    </div>
  );
}

function RuleFormDialog({ roles, onClose, onSaved }: { roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const { data: departments } = useQuery({ queryKey: ["users", "departments"], queryFn: () => api.get<string[]>("/users/departments") });
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { entityType: "PAYMENT", currencyCode: "", department: "", minAmount: 0, maxAmount: "", requiredLevels: 1, requiredRoleLevel1: "Finance Checker", requiredRoleLevel2: "", priority: 0 },
  });
  const requiredLevels = Number(watch("requiredLevels"));

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await api.post<{ departmentWarning?: string | null }>("/approval-rules", {
        ...values,
        currencyCode: values.currencyCode || undefined,
        department: values.department || undefined,
        maxAmount: values.maxAmount ? Number(values.maxAmount) : undefined,
        minAmount: Number(values.minAmount),
        requiredLevels: Number(values.requiredLevels),
        priority: Number(values.priority),
        requiredRoleLevel2: Number(values.requiredLevels) === 2 ? values.requiredRoleLevel2 : undefined,
      });
      toast.success(t("Approval rule created"));
      if (saved.departmentWarning) toast.warning(saved.departmentWarning);
      onSaved();
    } catch (err) {
      toast.error(t("Could not create rule"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("Add Approval Rule")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={onSubmit} loading={isSubmitting}>
            {t("Save")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="entityType" required>
              {t("Applies To")}
            </Label>
            <Select id="entityType" {...register("entityType")}>
              <option value="PAYMENT">{t("Payment")}</option>
              <option value="TRANSFER">{t("Transfer")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="currencyCode">{t("Currency (optional)")}</Label>
            <Input id="currencyCode" placeholder={t("Any")} {...register("currencyCode")} />
          </div>
        </div>
        <div>
          <Label htmlFor="department">{t("Department / cost center (optional)")}</Label>
          <Input id="department" list="department-options" placeholder={t("Any - matches requester's department")} {...register("department")} />
          <datalist id="department-options">
            {departments?.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="minAmount" required>
              {t("Minimum Amount")}
            </Label>
            <Input id="minAmount" type="number" step="0.01" {...register("minAmount")} />
          </div>
          <div>
            <Label htmlFor="maxAmount">{t("Maximum Amount (optional)")}</Label>
            <Input id="maxAmount" type="number" step="0.01" placeholder={t("No limit")} {...register("maxAmount")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="requiredLevels" required>
              {t("Required Approval Levels")}
            </Label>
            <Select id="requiredLevels" {...register("requiredLevels")}>
              <option value={1}>{t("1 Level")}</option>
              <option value={2}>{t("2 Levels")}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">{t("Priority (higher wins on overlap)")}</Label>
            <Input id="priority" type="number" {...register("priority")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="requiredRoleLevel1" required>
              {t("Level 1 Approver Role")}
            </Label>
            <Select id="requiredRoleLevel1" {...register("requiredRoleLevel1")}>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          {requiredLevels === 2 && (
            <div>
              <Label htmlFor="requiredRoleLevel2" required>
                {t("Level 2 Approver Role")}
              </Label>
              <Select id="requiredRoleLevel2" {...register("requiredRoleLevel2")}>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}
