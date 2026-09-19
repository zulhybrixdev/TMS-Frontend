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

const schema = z.object({
  nickname: z.string().min(2, "Required"),
  accountName: z.string().min(2, "Required"),
  accountNumber: z.string().min(4, "Required"),
  bankName: z.string().min(2, "Required"),
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
      header: "Beneficiary",
      render: (b) => (
        <div>
          <p className="font-medium text-ink">{b.nickname}</p>
          <p className="text-xs text-ink-muted">{b.accountName}</p>
        </div>
      ),
    },
    { key: "bankName", header: "Bank", render: (b) => b.bankName },
    { key: "accountNumber", header: "Account Number", render: (b) => <span className="tabular-nums">{b.accountNumber}</span> },
    { key: "currencyCode", header: "Currency", render: (b) => b.currencyCode ?? "—" },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search beneficiaries..."
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Add Beneficiary
            </Button>
          )
        }
      />
      {!data || data.length === 0 ? (
        <EmptyState
          icon={<BookUser className="h-5 w-5" />}
          title="No beneficiaries saved"
          description="Save a payee here to prefill their details next time you create a payment, instead of retyping them."
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
        title="Remove beneficiary?"
        description={removing ? `"${removing.nickname}" will no longer appear in the saved payee list. Past payments are unaffected.` : undefined}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={async () => {
          if (!removing) return;
          try {
            await api.delete(`/beneficiaries/${removing.id}`);
            toast.success("Beneficiary removed");
            qc.invalidateQueries({ queryKey: ["beneficiaries"] });
          } catch (err) {
            toast.error("Could not remove beneficiary", { description: err instanceof ApiError ? err.message : undefined });
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
      toast.success("Beneficiary saved");
      onSaved();
    } catch (err) {
      toast.error("Could not save beneficiary", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={beneficiary ? "Edit Beneficiary" : "Add Beneficiary"}
      description="Saved payees prefill the beneficiary fields on a new payment."
      footer={
        <>
          {onDelete && (
            <Button variant="outline" className="mr-auto text-status-critical" onClick={onDelete}>
              Remove
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
          <Label htmlFor="nickname" required>
            Nickname
          </Label>
          <Input id="nickname" {...register("nickname")} error={!!errors.nickname} placeholder="e.g. Main Landlord" />
          <ErrorText>{errors.nickname?.message}</ErrorText>
        </div>
        <div>
          <Label htmlFor="accountName" required>
            Account Holder Name
          </Label>
          <Input id="accountName" {...register("accountName")} error={!!errors.accountName} />
          <ErrorText>{errors.accountName?.message}</ErrorText>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="accountNumber" required>
              Account Number
            </Label>
            <Input id="accountNumber" {...register("accountNumber")} error={!!errors.accountNumber} />
            <ErrorText>{errors.accountNumber?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="bankName" required>
              Bank
            </Label>
            <Input id="bankName" {...register("bankName")} error={!!errors.bankName} />
            <ErrorText>{errors.bankName?.message}</ErrorText>
          </div>
        </div>
        <div>
          <Label htmlFor="currencyCode">Currency (optional)</Label>
          <Input id="currencyCode" {...register("currencyCode")} placeholder="MYR" maxLength={3} className="w-24 uppercase" />
        </div>
      </form>
    </Dialog>
  );
}
