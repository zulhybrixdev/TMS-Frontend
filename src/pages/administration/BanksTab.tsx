import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { Bank } from "../../lib/types";
import { Toolbar } from "../../components/ui/Toolbar";
import { DataTable, Column } from "../../components/ui/Table";
import { EmptyState } from "../../components/ui/EmptyState";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Input, Label, Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { t } from "../../i18n";

export function BanksTab() {
  const qc = useQueryClient();
  const { data: banks, isLoading } = useQuery({ queryKey: ["banks"], queryFn: () => api.get<Bank[]>("/banks") });
  const [editing, setEditing] = useState<Bank | null | "new">(null);
  const [search, setSearch] = useState("");

  const filtered = banks?.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<Bank>[] = [
    { key: "name", header: t("Bank Name"), render: (b) => <span className="font-medium text-ink">{b.name}</span> },
    { key: "swiftCode", header: t("SWIFT Code"), render: (b) => b.swiftCode ?? "—" },
    { key: "country", header: t("Country"), render: (b) => b.country },
    { key: "accounts", header: t("Linked Accounts"), align: "right", render: (b) => b._count?.accounts ?? 0 },
    { key: "status", header: t("Status"), render: (b) => <StatusBadge status={b.status} /> },
  ];

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <Toolbar
        search={search}
        onSearch={setSearch}
        placeholder={t("Search banks...")}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> {t("Add Bank")}
          </Button>
        }
      />
      {!filtered || filtered.length === 0 ? (
        <EmptyState title={t("No banks found")} />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(b) => b.id} onRowClick={setEditing} />
      )}

      {editing && (
        <BankFormDialog
          bank={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            qc.invalidateQueries({ queryKey: ["banks"] });
          }}
        />
      )}
    </div>
  );
}

function BankFormDialog({ bank, onClose, onSaved }: { bank: Bank | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: bank?.name ?? "", swiftCode: bank?.swiftCode ?? "", country: bank?.country ?? "MY", status: bank?.status ?? "ACTIVE" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (bank) await api.patch(`/banks/${bank.id}`, values);
      else await api.post("/banks", values);
      toast.success(t("Bank saved"));
      onSaved();
    } catch (err) {
      toast.error(t("Could not save bank"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title={bank ? t("Edit Bank") : t("Add Bank")}
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
        <div>
          <Label htmlFor="name" required>
            {t("Bank Name")}
          </Label>
          <Input id="name" {...register("name", { required: true })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="swiftCode">{t("SWIFT Code")}</Label>
            <Input id="swiftCode" {...register("swiftCode")} />
          </div>
          <div>
            <Label htmlFor="country">{t("Country")}</Label>
            <Input id="country" {...register("country")} />
          </div>
        </div>
        {bank && (
          <div>
            <Label htmlFor="status">{t("Status")}</Label>
            <Select id="status" {...register("status")}>
              <option value="ACTIVE">{t("Active")}</option>
              <option value="INACTIVE">{t("Inactive")}</option>
            </Select>
          </div>
        )}
      </form>
    </Dialog>
  );
}
