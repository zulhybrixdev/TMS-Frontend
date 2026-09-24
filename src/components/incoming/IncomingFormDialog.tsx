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

const schema = z.object({
  sourceName: z.string().min(2, "Source name is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currencyCode: z.string().length(3),
  destinationAccountId: z.string().min(1, "Destination account is required"),
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
      toast.success("Incoming transaction recorded as expected");
      reset();
      onSaved(row);
    } catch (err) {
      toast.error("Could not save", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record Incoming Transaction"
      description="Log an expected collection with its due date. Mark it received once funds land."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="sourceName" required>
            Source (Payer)
          </Label>
          <Input id="sourceName" {...register("sourceName")} error={!!errors.sourceName} />
          <ErrorText>{errors.sourceName?.message}</ErrorText>
        </div>
        <div>
          <Label htmlFor="destinationAccountId" required>
            Destination Account
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
            <option value="">Select account</option>
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
              Amount
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} error={!!errors.amount} />
          </div>
          <div>
            <Label htmlFor="currencyCode">Currency</Label>
            <Input id="currencyCode" {...register("currencyCode")} disabled />
          </div>
          <div>
            <Label htmlFor="valueDate" required>
              Due Date
            </Label>
            <Input id="valueDate" type="date" {...register("valueDate")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="invoiceNumber">Invoice No.</Label>
            <Input id="invoiceNumber" {...register("invoiceNumber")} placeholder="Sales invoice number" />
          </div>
          <div>
            <Label htmlFor="floatDays">Clearing (float)</Label>
            <Select id="floatDays" {...register("floatDays")}>
              <option value={0}>Cleared immediately</option>
              <option value={1}>Day 1 float (cheque, T+1)</option>
              <option value={2}>Day 2 float (cheque, T+2)</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...register("description")} placeholder="Invoice reference, contract, etc." />
        </div>
      </form>
    </Dialog>
  );
}
