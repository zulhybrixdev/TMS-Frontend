import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api-client";
import type { Currency } from "../../lib/types";
import { DataTable, Column } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Input, Label } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { t } from "../../i18n";

export function CurrenciesTab() {
  const qc = useQueryClient();
  const { data: currencies, isLoading } = useQuery({ queryKey: ["currencies"], queryFn: () => api.get<Currency[]>("/currencies") });
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { code: "", name: "", symbol: "" } });

  const columns: Column<Currency>[] = [
    { key: "code", header: t("Code"), render: (c) => <span className="font-medium text-ink">{c.code}</span> },
    { key: "name", header: t("Name"), render: (c) => c.name },
    { key: "symbol", header: t("Symbol"), render: (c) => c.symbol },
    { key: "flags", header: "", render: (c) => (c.isBase ? <Badge tone="brand">{t("Base currency")}</Badge> : null) },
  ];

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.post("/currencies", { ...values, code: values.code.toUpperCase() });
      toast.success(t("Currency added"));
      reset();
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["currencies"] });
    } catch (err) {
      toast.error(t("Could not add currency"), { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> {t("Add Currency")}
        </Button>
      </div>
      <DataTable columns={columns} rows={currencies ?? []} rowKey={(c) => c.code} />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("Add Currency")}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={onSubmit} loading={isSubmitting}>
              {t("Save")}
            </Button>
          </>
        }
      >
        <form className="grid grid-cols-3 gap-3" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="code" required>
              {t("Code")}
            </Label>
            <Input id="code" maxLength={3} placeholder="USD" {...register("code", { required: true, minLength: 3, maxLength: 3 })} />
          </div>
          <div>
            <Label htmlFor="name" required>
              {t("Name")}
            </Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
          <div>
            <Label htmlFor="symbol" required>
              {t("Symbol")}
            </Label>
            <Input id="symbol" {...register("symbol", { required: true })} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
