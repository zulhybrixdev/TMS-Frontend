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
import { t, tk } from "../../i18n";
import { tServer } from "../../i18n/server-messages";

const schema = z
  .object({
    sourceAccountId: z.string().min(1, tk("Source account is required")),
    destinationAccountId: z.string().min(1, tk("Destination account is required")),
    amount: z.coerce.number().positive(tk("Amount must be greater than zero")),
    currencyCode: z.string().length(3),
    reason: z.string().optional(),
    transferDate: z.string().min(1),
    suggestedAmount: z.coerce.number().optional(),
    isSystemRecommended: z.boolean().optional(),
  })
  .refine((v) => v.sourceAccountId !== v.destinationAccountId, { message: tk("Source and destination must differ"), path: ["destinationAccountId"] });
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
        reason: tServer(prefill.reason),
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
      toast.success(t("Transfer created as draft"));
      onSaved(transfer);
    } catch (err) {
      toast.error(t("Could not create transfer"), { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("New Inter-Bank Transfer")}
      description={prefill ? t("Pre-filled from the system's recommendation — review and adjust before saving.") : t("Move funds between company bank accounts.")}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {t("Save as Draft")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sourceAccountId" required>
              {t("Source Account")}
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
              <option value="">{t("Select account")}</option>
              {accounts?.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.bankName})
                </option>
              ))}
            </Select>
            <ErrorText>{errors.sourceAccountId?.message}</ErrorText>
            {selectedSource && (
              <p className="mt-1 text-xs text-ink-muted">
                {selectedSource.overdraftLimit > 0
                  ? t("Available: {available} {currency} ({liquidity} incl. overdraft) · Minimum: {minimum}", { available: selectedSource.availableCash.toLocaleString(), currency: selectedSource.currencyCode, liquidity: selectedSource.liquidity.toLocaleString(), minimum: selectedSource.minimumBalance.toLocaleString() })
                  : t("Available: {available} {currency} · Minimum: {minimum}", { available: selectedSource.availableCash.toLocaleString(), currency: selectedSource.currencyCode, minimum: selectedSource.minimumBalance.toLocaleString() })}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="destinationAccountId" required>
              {t("Destination Account")}
            </Label>
            <Select id="destinationAccountId" {...register("destinationAccountId")} error={!!errors.destinationAccountId}>
              <option value="">{t("Select account")}</option>
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
              {t("Amount")}
            </Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} error={!!errors.amount} />
            <ErrorText>{errors.amount?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="currencyCode" required>
              {t("Currency")}
            </Label>
            <Input id="currencyCode" {...register("currencyCode")} disabled />
          </div>
          <div>
            <Label htmlFor="transferDate" required>
              {t("Transfer Date")}
            </Label>
            <Input id="transferDate" type="date" {...register("transferDate")} />
          </div>
        </div>

        <div>
          <Label htmlFor="reason">{t("Reason")}</Label>
          <Textarea id="reason" rows={2} {...register("reason")} placeholder={t("e.g. Cover projected shortfall at destination account")} />
        </div>
      </form>
    </Dialog>
  );
}
