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

const schema = z.object({
  name: z.string().min(2, "Required"),
  beneficiaryName: z.string().min(2, "Required"),
  beneficiaryAccount: z.string().min(4, "Required"),
  beneficiaryBank: z.string().min(2, "Required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  currencyCode: z.string().length(3, "Required"),
  sourceAccountId: z.string().min(1, "Required"),
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
    { key: "name", header: "Template", render: (t) => <span className="font-medium text-ink">{t.name}</span> },
    {
      key: "beneficiaryName",
      header: "Beneficiary",
      render: (t) => (
        <div>
          <p className="text-ink">{t.beneficiaryName}</p>
          <p className="text-xs text-ink-muted">{t.beneficiaryBank}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", align: "right", render: (t) => <span className="tabular-nums">{formatMoney(t.amount, t.currencyCode)}</span> },
    {
      key: "schedule",
      header: "Schedule",
      render: (t) =>
        t.frequency === "NONE" ? (
          <span className="text-xs text-ink-muted">Manual only</span>
        ) : (
          <div>
            <Badge tone={t.isActive ? "brand" : "neutral"}>{t.frequency === "WEEKLY" ? "Weekly" : "Monthly"}</Badge>
            {t.nextRunDate && <p className="mt-1 text-xs text-ink-muted">Next: {formatDate(t.nextRunDate)}</p>}
          </div>
        ),
    },
    {
      key: "use",
      header: "",
      align: "right",
      render: (t) =>
        canCreatePayment && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setUsing(t);
            }}
          >
            <Play className="h-3.5 w-3.5" /> Use
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
              <Plus className="h-4 w-4" /> New Template
            </Button>
          )
        }
      />
      {!data || data.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-5 w-5" />}
          title="No payment templates yet"
          description="Save a recurring payment (rent, retainers, subscriptions) as a template to one-click it into a new draft payment next time, instead of retyping every field."
        />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(t) => t.id} onRowClick={canManage ? setEditing : undefined} />
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
        title="Delete template?"
        description={removing ? `"${removing.name}" will be permanently deleted. This doesn't affect payments already created from it.` : undefined}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.delete(`/payment-templates/${removing.id}`);
            toast.success("Template deleted");
            qc.invalidateQueries({ queryKey: ["payment-templates"] });
          } catch (err) {
            toast.error("Could not delete template", { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setRemoving(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!using}
        onClose={() => setUsing(null)}
        title="Create payment from template?"
        description={using ? `A new DRAFT payment of ${formatMoney(using.amount, using.currencyCode)} to ${using.beneficiaryName} will be created. You can still edit it before submitting for approval.` : undefined}
        confirmLabel="Create Draft Payment"
        onConfirm={async () => {
          if (!using) return;
          try {
            const payment = await api.post<{ id: string }>(`/payment-templates/${using.id}/use`, {});
            toast.success("Draft payment created");
            navigate(`/payments/${payment.id}`);
          } catch (err) {
            toast.error("Could not create payment", { description: err instanceof ApiError ? err.message : undefined });
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
      toast.success("Template saved");
      onSaved();
    } catch (err) {
      toast.error("Could not save template", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={template ? "Edit Payment Template" : "New Payment Template"}
      description="A saved payment shape you can one-click into a new draft payment - no auto-scheduling, you still trigger and approve each use."
      size="lg"
      footer={
        <>
          {onDelete && (
            <Button variant="outline" className="mr-auto text-status-critical" onClick={onDelete}>
              Delete
            </Button>
          )}
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
            Template Name
          </Label>
          <Input id="name" {...register("name")} error={!!errors.name} placeholder="e.g. Monthly Office Rent" />
          <ErrorText>{errors.name?.message}</ErrorText>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="beneficiaryName" required>
              Beneficiary Name
            </Label>
            <Input id="beneficiaryName" {...register("beneficiaryName")} error={!!errors.beneficiaryName} />
            <ErrorText>{errors.beneficiaryName?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="beneficiaryBank" required>
              Beneficiary Bank
            </Label>
            <Input id="beneficiaryBank" {...register("beneficiaryBank")} error={!!errors.beneficiaryBank} />
            <ErrorText>{errors.beneficiaryBank?.message}</ErrorText>
          </div>
        </div>

        <div>
          <Label htmlFor="beneficiaryAccount" required>
            Beneficiary Account Number
          </Label>
          <Input id="beneficiaryAccount" {...register("beneficiaryAccount")} error={!!errors.beneficiaryAccount} />
          <ErrorText>{errors.beneficiaryAccount?.message}</ErrorText>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="amount" required>
              Amount
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} error={!!errors.amount} />
            <ErrorText>{errors.amount?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="currencyCode" required>
              Currency
            </Label>
            <Input id="currencyCode" {...register("currencyCode")} error={!!errors.currencyCode} maxLength={3} className="uppercase" />
          </div>
          <div>
            <Label htmlFor="sourceAccountId" required>
              Source Account
            </Label>
            <Select id="sourceAccountId" {...register("sourceAccountId")} error={!!errors.sourceAccountId}>
              <option value="">Select account</option>
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
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" {...register("reference")} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <Label htmlFor="frequency">Auto-create schedule</Label>
            <Select id="frequency" {...register("frequency")}>
              <option value="NONE">Manual only (use the Use button)</option>
              <option value="WEEKLY">Every week</option>
              <option value="MONTHLY">Every month</option>
            </Select>
          </div>
          {frequency !== "NONE" && (
            <div>
              <Label htmlFor="nextRunDate">Next run date</Label>
              <Input id="nextRunDate" type="date" {...register("nextRunDate")} />
            </div>
          )}
        </div>
        {frequency !== "NONE" && (
          <p className="text-xs text-ink-muted">
            A new draft payment will be created automatically on this schedule - you'll still need to review and submit it for approval yourself, same as clicking "Use" by hand.
          </p>
        )}
      </form>
    </Dialog>
  );
}
