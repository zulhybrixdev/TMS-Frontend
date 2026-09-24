import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input, Label, Select, Textarea, ErrorText } from "../ui/Input";
import { useAllAccounts } from "../../hooks/useReferenceData";
import { api, ApiError } from "../../lib/api-client";
import { todayLocal } from "../../lib/format";
import type { IncomingTransaction } from "../../lib/types";
import { t, tk } from "../../i18n";

const schema = z.object({
  sourceName: z.string().min(2, tk("Source name is required")),
  amount: z.coerce.number().positive(tk("Amount must be greater than zero")),
  currencyCode: z.string().length(3),
  destinationAccountId: z.string().min(1, tk("Destination account is required")),
  valueDate: z.string().min(1),
  invoiceNumber: z.string().optional(),
  floatDays: z.coerce.number().int().min(0).max(2),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function IncomingFormDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (row: IncomingTransaction) => void }) {
  const { data: accounts } = useAllAccounts();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { valueDate: todayLocal(), currencyCode: "MYR", floatDays: 0 } });

  const onSubmit = async (values: FormValues) => {
    try {
      const row = await api.post<IncomingTransaction>("/incoming-transactions", values);
      toast.success(t("Incoming transaction recorded as expected"));
      reset();
      onSaved(row);
    } catch (err) {
      toast.error(t("Could not save"), { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("Record Incoming Transaction")}
      description={t("Log an expected collection with its due date. Mark it received once funds land.")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {t("Save")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="sourceName" required>
            {t("Source (Payer)")}
          </Label>
          <Input id="sourceName" {...register("sourceName")} error={!!errors.sourceName} />
          <ErrorText>{errors.sourceName?.message}</ErrorText>
        </div>
        <div>
          <Label htmlFor="destinationAccountId" required>
            {t("Destination Account")}
          </Label>
          <Select
            id="destinationAccountId"
            {...register("destinationAccountId")}
            error={!!errors.destinationAccountId}
            onChange={(e) => {
              register("destinationAccountId").onChange(e);
              const acc = accounts?.items.find((a) => a.id === e.target.value);
              if (acc) setValue("currencyCode", acc.currencyCode);
            }}
          >
            <option value="">{t("Select account")}</option>
            {accounts?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName} ({a.bankName})
              </option>
            ))}
          </Select>
          <ErrorText>{errors.destinationAccountId?.message}</ErrorText>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="amount" required>
              {t("Amount")}
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} error={!!errors.amount} />
          </div>
          <div>
            <Label htmlFor="currencyCode">{t("Currency")}</Label>
            <Input id="currencyCode" {...register("currencyCode")} disabled />
          </div>
          <div>
            <Label htmlFor="valueDate" required>
              {t("Due Date")}
            </Label>
            <Input id="valueDate" type="date" {...register("valueDate")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="invoiceNumber">{t("Invoice No.")}</Label>
            <Input id="invoiceNumber" {...register("invoiceNumber")} placeholder={t("Sales invoice number")} />
          </div>
          <div>
            <Label htmlFor="floatDays">{t("Clearing (float)")}</Label>
            <Select id="floatDays" {...register("floatDays")}>
              <option value={0}>{t("Cleared immediately")}</option>
              <option value={1}>{t("Day 1 float (cheque, T+1)")}</option>
              <option value={2}>{t("Day 2 float (cheque, T+2)")}</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">{t("Description")}</Label>
          <Textarea id="description" rows={2} {...register("description")} placeholder={t("Invoice reference, contract, etc.")} />
        </div>
      </form>
    </Dialog>
  );
}
