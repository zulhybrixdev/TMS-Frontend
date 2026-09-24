import { useEffect } from "react";
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
import type { Transfer, TransferRecommendation } from "../../lib/types";

const schema = z
  .object({
    sourceAccountId: z.string().min(1, "Source account is required"),
    destinationAccountId: z.string().min(1, "Destination account is required"),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    currencyCode: z.string().length(3),
    reason: z.string().optional(),
    transferDate: z.string().min(1),
    suggestedAmount: z.coerce.number().optional(),
    isSystemRecommended: z.boolean().optional(),
  })
  .refine((v) => v.sourceAccountId !== v.destinationAccountId, { message: "Source and destination must differ", path: ["destinationAccountId"] });
type FormValues = z.infer<typeof schema>;

export function TransferFormDialog({ open, onClose, onSaved, prefill }: { open: boolean; onClose: () => void; onSaved: (t: Transfer) => void; prefill?: TransferRecommendation | null }) {
  const { data: accounts } = useAllAccounts();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { transferDate: todayLocal(), currencyCode: "MYR" },
  });

  useEffect(() => {
    if (open && prefill) {
      reset({
        sourceAccountId: prefill.sourceAccountId,
        destinationAccountId: prefill.destinationAccountId,
        amount: prefill.amount,
        currencyCode: prefill.currencyCode,
        reason: prefill.reason,
        transferDate: todayLocal(),
        suggestedAmount: prefill.amount,
        isSystemRecommended: true,
      });
    } else if (open) {
      reset({ transferDate: todayLocal(), currencyCode: "MYR" });
    }
  }, [open, prefill, reset]);

  const sourceAccountId = watch("sourceAccountId");
  const selectedSource = accounts?.items.find((a) => a.id === sourceAccountId);

  const onSubmit = async (values: FormValues) => {
    try {
      const transfer = await api.post<Transfer>("/transfers", values);
      toast.success("Transfer created as draft");
      onSaved(transfer);
    } catch (err) {
      toast.error("Could not create transfer", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New Inter-Bank Transfer"
      description={prefill ? "Pre-filled from the system's recommendation — review and adjust before saving." : "Move funds between company bank accounts."}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save as Draft
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sourceAccountId" required>
              Source Account
            </Label>
            <Select
              id="sourceAccountId"
              {...register("sourceAccountId")}
              error={!!errors.sourceAccountId}
              onChange={(e) => {
                register("sourceAccountId").onChange(e);
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
            <ErrorText>{errors.sourceAccountId?.message}</ErrorText>
            {selectedSource && (
              <p className="mt-1 text-xs text-ink-muted">
                Available: {selectedSource.availableCash.toLocaleString()} {selectedSource.currencyCode}
                {selectedSource.overdraftLimit > 0 ? ` (${selectedSource.liquidity.toLocaleString()} incl. overdraft)` : ""} · Minimum: {selectedSource.minimumBalance.toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="destinationAccountId" required>
              Destination Account
            </Label>
            <Select id="destinationAccountId" {...register("destinationAccountId")} error={!!errors.destinationAccountId}>
              <option value="">Select account</option>
              {/* One amount, one currency - the destination must hold the same currency as the source. */}
              {accounts?.items.filter((a) => !selectedSource || a.currencyCode === selectedSource.currencyCode).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.bankName})
                </option>
              ))}
            </Select>
            <ErrorText>{errors.destinationAccountId?.message}</ErrorText>
          </div>
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
            <Input id="currencyCode" {...register("currencyCode")} disabled />
          </div>
          <div>
            <Label htmlFor="transferDate" required>
              Transfer Date
            </Label>
            <Input id="transferDate" type="date" {...register("transferDate")} />
          </div>
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" rows={2} {...register("reason")} placeholder="e.g. Cover projected shortfall at destination account" />
        </div>
      </form>
    </Dialog>
  );
}
