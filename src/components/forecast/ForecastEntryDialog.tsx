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
import type { ForecastEntry } from "../../lib/types";

const schema = z.object({
  accountId: z.string().optional(),
  currencyCode: z.string().length(3),
  forecastDate: z.string().min(1),
  category: z.enum(["INFLOW", "OUTFLOW"]),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ForecastEntryDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (e: ForecastEntry) => void }) {
  const { data: accounts } = useAllAccounts();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currencyCode: "MYR", category: "OUTFLOW", confidence: "MEDIUM", forecastDate: todayLocal() } });

  const onSubmit = async (values: FormValues) => {
    try {
      const entry = await api.post<ForecastEntry>("/forecasts", { ...values, accountId: values.accountId || undefined });
      toast.success("Forecast entry added");
      reset();
      onSaved(entry);
    } catch (err) {
      toast.error("Could not save forecast entry", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Forecast Entry"
      description="Manually project a known future inflow or outflow (e.g. tax payment, expected receivable)."
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="category" required>
              Category
            </Label>
            <Select id="category" {...register("category")}>
              <option value="INFLOW">Inflow</option>
              <option value="OUTFLOW">Outflow</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="confidence" required>
              Confidence
            </Label>
            <Select id="confidence" {...register("confidence")}>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="accountId">Account (optional — leave blank for company-wide)</Label>
          <Select id="accountId" {...register("accountId")}>
            <option value="">Company-wide</option>
            {accounts?.items.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName} ({a.bankName})
              </option>
            ))}
          </Select>
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
            <Label htmlFor="currencyCode">Currency</Label>
            <Input id="currencyCode" {...register("currencyCode")} />
          </div>
          <div>
            <Label htmlFor="forecastDate" required>
              Date
            </Label>
            <Input id="forecastDate" type="date" {...register("forecastDate")} />
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
      </form>
    </Dialog>
  );
}
