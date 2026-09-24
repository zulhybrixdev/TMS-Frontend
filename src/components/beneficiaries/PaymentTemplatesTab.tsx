import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutTemplate, Play } from "lucide-react";
import { todayLocal } from "../../lib/format";
import { api, ApiError } from "../../lib/api-client";
import type { PaymentTemplateRow } from "../../lib/types";
import { useAllAccounts } from "../../hooks/useReferenceData";
import { Toolbar } from "../ui/Toolbar";
import { DataTable, Column } from "../ui/Table";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { Dialog, ConfirmDialog } from "../ui/Dialog";
import { Input, Label, Select, ErrorText } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { Badge } from "../ui/Badge";
import { formatMoney, formatDate } from "../../lib/format";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import { t, tk } from "../../i18n";

const schema = z.object({
  name: z.string().min(2, tk("Required")),
  beneficiaryName: z.string().min(2, tk("Required")),
  beneficiaryAccount: z.string().min(4, tk("Required")),
  beneficiaryBank: z.string().min(2, tk("Required")),
  amount: z.coerce.number().positive(tk("Must be greater than 0")),
  currencyCode: z.string().length(3, tk("Required")),
  sourceAccountId: z.string().min(1, tk("Required")),
  description: z.string().optional(),
  reference: z.string().optional(),
  frequency: z.enum(["NONE", "WEEKLY", "MONTHLY"]),
  nextRunDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function PaymentTemplatesTab() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.BENEFICIARIES_MANAGE);
  const canCreatePayment = hasPermission(PERMISSIONS.PAYMENTS_CREATE);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<PaymentTemplateRow | null | "new">(null);
  const [removing, setRemoving] = useState<PaymentTemplateRow | null>(null);
  const [using, setUsing] = useState<PaymentTemplateRow | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["payment-templates"], queryFn: () => api.get<PaymentTemplateRow[]>("/payment-templates") });

  const columns: Column<PaymentTemplateRow>[] = [
    { key: "name", header: t("Template"), render: (tpl) => <span className="font-medium text-ink">{tpl.name}</span> },
    {
      key: "beneficiaryName",
      header: t("Beneficiary"),
      render: (tpl) => (
        <div>
          <p className="text-ink">{tpl.beneficiaryName}</p>
          <p className="text-xs text-ink-muted">{tpl.beneficiaryBank}</p>
        </div>
      ),
    },
    { key: "amount", header: t("Amount"), align: "right", render: (tpl) => <span className="tabular-nums">{formatMoney(tpl.amount, tpl.currencyCode)}</span> },
    {
      key: "schedule",
      header: t("Schedule"),
      render: (tpl) =>
        tpl.frequency === "NONE" ? (
          <span className="text-xs text-ink-muted">{t("Manual only")}</span>
        ) : (
          <div>
            <Badge tone={tpl.isActive ? "brand" : "neutral"}>{tpl.frequency === "WEEKLY" ? t("Weekly") : t("Monthly")}</Badge>
            {tpl.nextRunDate && <p className="mt-1 text-xs text-ink-muted">{t("Next:")} {formatDate(tpl.nextRunDate)}</p>}
          </div>
        ),
    },
    {
      key: "use",
      header: "",
      align: "right",
      render: (tpl) =>
        canCreatePayment && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setUsing(tpl);
            }}
          >
            <Play className="h-3.5 w-3.5" /> {t("Use")}
          </Button>
        ),
    },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <Toolbar
        search=""
        onSearch={() => {}}
        hideSearch
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> {t("New Template")}
            </Button>
          )
        }
      />
      {!data || data.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-5 w-5" />}
          title={t("No payment templates yet")}
          description={t("Save a recurring payment (rent, retainers, subscriptions) as a template to one-click it into a new draft payment next time, instead of retyping every field.")}
        />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(tpl) => tpl.id} onRowClick={canManage ? setEditing : undefined} />
      )}

      {editing && (
        <TemplateFormDialog
          template={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDelete={
            editing !== "new"
              ? () => {
                  setRemoving(editing);
                  setEditing(null);
                }
              : undefined
          }
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["payment-templates"] });
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={t("Delete template?")}
        description={removing ? t("\"{name}\" will be permanently deleted. This doesn't affect payments already created from it.", { name: removing.name }) : undefined}
        confirmLabel={t("Delete")}
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.delete(`/payment-templates/${removing.id}`);
            toast.success(t("Template deleted"));
            qc.invalidateQueries({ queryKey: ["payment-templates"] });
          } catch (err) {
            toast.error(t("Could not delete template"), { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setRemoving(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!using}
        onClose={() => setUsing(null)}
        title={t("Create payment from template?")}
        description={using ? t("A new DRAFT payment of {amount} to {name} will be created. You can still edit it before submitting for approval.", { amount: formatMoney(using.amount, using.currencyCode), name: using.beneficiaryName }) : undefined}
        confirmLabel={t("Create Draft Payment")}
        onConfirm={async () => {
          if (!using) return;
          try {
            const payment = await api.post<{ id: string }>(`/payment-templates/${using.id}/use`, {});
            toast.success(t("Draft payment created"));
            navigate(`/payments/${payment.id}`);
          } catch (err) {
            toast.error(t("Could not create payment"), { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setUsing(null);
          }
        }}
      />
    </div>
  );
}

function TemplateFormDialog({
  template,
  onClose,
  onSaved,
  onDelete,
}: {
  template: PaymentTemplateRow | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const { data: accounts } = useAllAccounts();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: template?.name ?? "",
      beneficiaryName: template?.beneficiaryName ?? "",
      beneficiaryAccount: template?.beneficiaryAccount ?? "",
      beneficiaryBank: template?.beneficiaryBank ?? "",
      amount: template?.amount ?? 0,
      currencyCode: template?.currencyCode ?? "MYR",
      sourceAccountId: template?.sourceAccountId ?? "",
      description: template?.description ?? "",
      reference: template?.reference ?? "",
      frequency: template?.frequency ?? "NONE",
      nextRunDate: template?.nextRunDate?.slice(0, 10) ?? todayLocal(),
    },
  });

  const frequency = watch("frequency");

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (template) await api.patch(`/payment-templates/${template.id}`, values);
      else await api.post("/payment-templates", values);
      toast.success(t("Template saved"));
      onSaved();
    } catch (err) {
      toast.error(t("Could not save template"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={template ? t("Edit Payment Template") : t("New Payment Template")}
      description={t("A saved payment shape you can one-click into a new draft payment - no auto-scheduling, you still trigger and approve each use.")}
      size="lg"
      footer={
        <>
          {onDelete && (
            <Button variant="outline" className="mr-auto text-status-critical" onClick={onDelete}>
              {t("Delete")}
            </Button>
          )}
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
        <div>
          <Label htmlFor="name" required>
            {t("Template Name")}
          </Label>
          <Input id="name" {...register("name")} error={!!errors.name} placeholder={t("e.g. Monthly Office Rent")} />
          <ErrorText>{errors.name?.message}</ErrorText>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="beneficiaryName" required>
              {t("Beneficiary Name")}
            </Label>
            <Input id="beneficiaryName" {...register("beneficiaryName")} error={!!errors.beneficiaryName} />
            <ErrorText>{errors.beneficiaryName?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="beneficiaryBank" required>
              {t("Beneficiary Bank")}
            </Label>
            <Input id="beneficiaryBank" {...register("beneficiaryBank")} error={!!errors.beneficiaryBank} />
            <ErrorText>{errors.beneficiaryBank?.message}</ErrorText>
          </div>
        </div>

        <div>
          <Label htmlFor="beneficiaryAccount" required>
            {t("Beneficiary Account Number")}
          </Label>
          <Input id="beneficiaryAccount" {...register("beneficiaryAccount")} error={!!errors.beneficiaryAccount} />
          <ErrorText>{errors.beneficiaryAccount?.message}</ErrorText>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="amount" required>
              {t("Amount")}
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} error={!!errors.amount} />
            <ErrorText>{errors.amount?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="currencyCode" required>
              {t("Currency")}
            </Label>
            <Input id="currencyCode" {...register("currencyCode")} error={!!errors.currencyCode} maxLength={3} className="uppercase" />
          </div>
          <div>
            <Label htmlFor="sourceAccountId" required>
              {t("Source Account")}
            </Label>
            <Select id="sourceAccountId" {...register("sourceAccountId")} error={!!errors.sourceAccountId}>
              <option value="">{t("Select account")}</option>
              {accounts?.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName}
                </option>
              ))}
            </Select>
            <ErrorText>{errors.sourceAccountId?.message}</ErrorText>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="reference">{t("Reference")}</Label>
            <Input id="reference" {...register("reference")} />
          </div>
          <div>
            <Label htmlFor="description">{t("Description")}</Label>
            <Input id="description" {...register("description")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <Label htmlFor="frequency">{t("Auto-create schedule")}</Label>
            <Select id="frequency" {...register("frequency")}>
              <option value="NONE">{t("Manual only (use the Use button)")}</option>
              <option value="WEEKLY">{t("Every week")}</option>
              <option value="MONTHLY">{t("Every month")}</option>
            </Select>
          </div>
          {frequency !== "NONE" && (
            <div>
              <Label htmlFor="nextRunDate">{t("Next run date")}</Label>
              <Input id="nextRunDate" type="date" {...register("nextRunDate")} />
            </div>
          )}
        </div>
        {frequency !== "NONE" && (
          <p className="text-xs text-ink-muted">
            {t("A new draft payment will be created automatically on this schedule - you'll still need to review and submit it for approval yourself, same as clicking \"Use\" by hand.")}
          </p>
        )}
      </form>
    </Dialog>
  );
}
