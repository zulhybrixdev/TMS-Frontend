import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, BookUser } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { Beneficiary } from "../../lib/types";
import { Toolbar } from "../ui/Toolbar";
import { DataTable, Column } from "../ui/Table";
import { EmptyState } from "../ui/EmptyState";
import { Button } from "../ui/Button";
import { Dialog, ConfirmDialog } from "../ui/Dialog";
import { Input, Label, ErrorText } from "../ui/Input";
import { Skeleton } from "../ui/Skeleton";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import { t, tk } from "../../i18n";

const schema = z.object({
  nickname: z.string().min(2, tk("Required")),
  accountName: z.string().min(2, tk("Required")),
  accountNumber: z.string().min(4, tk("Required")),
  bankName: z.string().min(2, tk("Required")),
  currencyCode: z.string().length(3).optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function BeneficiariesTab() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.BENEFICIARIES_MANAGE);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Beneficiary | null | "new">(null);
  const [removing, setRemoving] = useState<Beneficiary | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["beneficiaries", search],
    queryFn: () => api.get<Beneficiary[]>(`/beneficiaries${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  });

  const columns: Column<Beneficiary>[] = [
    {
      key: "nickname",
      header: t("Beneficiary"),
      render: (b) => (
        <div>
          <p className="font-medium text-ink">{b.nickname}</p>
          <p className="text-xs text-ink-muted">{b.accountName}</p>
        </div>
      ),
    },
    { key: "bankName", header: t("Bank"), render: (b) => b.bankName },
    { key: "accountNumber", header: t("Account Number"), render: (b) => <span className="tabular-nums">{b.accountNumber}</span> },
    { key: "currencyCode", header: t("Currency"), render: (b) => b.currencyCode ?? "—" },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder={t("Search beneficiaries...")}
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> {t("Add Beneficiary")}
            </Button>
          )
        }
      />
      {!data || data.length === 0 ? (
        <EmptyState
          icon={<BookUser className="h-5 w-5" />}
          title={t("No beneficiaries saved")}
          description={t("Save a payee here to prefill their details next time you create a payment, instead of retyping them.")}
        />
      ) : (
        <DataTable columns={columns} rows={data} rowKey={(b) => b.id} onRowClick={canManage ? setEditing : undefined} />
      )}

      {editing && (
        <BeneficiaryFormDialog
          beneficiary={editing === "new" ? null : editing}
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
            qc.invalidateQueries({ queryKey: ["beneficiaries"] });
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={t("Remove beneficiary?")}
        description={removing ? t("\"{name}\" will no longer appear in the saved payee list. Past payments are unaffected.", { name: removing.nickname }) : undefined}
        confirmLabel={t("Remove")}
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.delete(`/beneficiaries/${removing.id}`);
            toast.success(t("Beneficiary removed"));
            qc.invalidateQueries({ queryKey: ["beneficiaries"] });
          } catch (err) {
            toast.error(t("Could not remove beneficiary"), { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setRemoving(null);
          }
        }}
      />
    </div>
  );
}

function BeneficiaryFormDialog({
  beneficiary,
  onClose,
  onSaved,
  onDelete,
}: {
  beneficiary: Beneficiary | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: beneficiary?.nickname ?? "",
      accountName: beneficiary?.accountName ?? "",
      accountNumber: beneficiary?.accountNumber ?? "",
      bankName: beneficiary?.bankName ?? "",
      currencyCode: beneficiary?.currencyCode ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload = { ...values, currencyCode: values.currencyCode || undefined };
    try {
      if (beneficiary) await api.patch(`/beneficiaries/${beneficiary.id}`, payload);
      else await api.post("/beneficiaries", payload);
      toast.success(t("Beneficiary saved"));
      onSaved();
    } catch (err) {
      toast.error(t("Could not save beneficiary"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={beneficiary ? t("Edit Beneficiary") : t("Add Beneficiary")}
      description={t("Saved payees prefill the beneficiary fields on a new payment.")}
      footer={
        <>
          {onDelete && (
            <Button variant="outline" className="mr-auto text-status-critical" onClick={onDelete}>
              {t("Remove")}
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
          <Label htmlFor="nickname" required>
            {t("Nickname")}
          </Label>
          <Input id="nickname" {...register("nickname")} error={!!errors.nickname} placeholder={t("e.g. Main Landlord")} />
          <ErrorText>{errors.nickname?.message}</ErrorText>
        </div>
        <div>
          <Label htmlFor="accountName" required>
            {t("Account Holder Name")}
          </Label>
          <Input id="accountName" {...register("accountName")} error={!!errors.accountName} />
          <ErrorText>{errors.accountName?.message}</ErrorText>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="accountNumber" required>
              {t("Account Number")}
            </Label>
            <Input id="accountNumber" {...register("accountNumber")} error={!!errors.accountNumber} />
            <ErrorText>{errors.accountNumber?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="bankName" required>
              {t("Bank")}
            </Label>
            <Input id="bankName" {...register("bankName")} error={!!errors.bankName} />
            <ErrorText>{errors.bankName?.message}</ErrorText>
          </div>
        </div>
        <div>
          <Label htmlFor="currencyCode">{t("Currency (optional)")}</Label>
          <Input id="currencyCode" {...register("currencyCode")} placeholder="MYR" maxLength={3} className="w-24 uppercase" />
        </div>
      </form>
    </Dialog>
  );
}
