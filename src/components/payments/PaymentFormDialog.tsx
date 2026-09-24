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
import type { Payment } from "../../lib/types";

const schema = z
  .object({
    beneficiaryName: z.string().min(2, "Beneficiary name is required"),
    beneficiaryAccount: z.string().optional(),
    beneficiaryBank: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    currencyCode: z.string().length(3),
    sourceAccountId: z.string().min(1, "Source account is required"),
    paymentDate: z.string().min(1, "Due date is required"),
    paymentMethod: z.enum(["TRANSFER", "CHEQUE", "BANK_DRAFT"]),
    invoiceNumber: z.string().optional(),
    description: z.string().optional(),
    reference: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    // A cheque / bank draft has no account to pay into; a transfer does.
    if (v.paymentMethod !== "TRANSFER") return;
    if (!v.beneficiaryAccount || v.beneficiaryAccount.length < 4) ctx.addIssue({ code: "custom", path: ["beneficiaryAccount"], message: "Beneficiary account number is required" });
    if (!v.beneficiaryBank || v.beneficiaryBank.length < 2) ctx.addIssue({ code: "custom", path: ["beneficiaryBank"], message: "Beneficiary bank is required" });
  });
type FormValues = z.infer<typeof schema>;

export function PaymentFormDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (p: Payment) => void }) {
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
    defaultValues: { paymentDate: todayLocal(), currencyCode: "MYR", paymentMethod: "TRANSFER" },
  });

  const sourceAccountId = watch("sourceAccountId");
  const paymentMethod = watch("paymentMethod");
  const selectedAccount = accounts?.items.find((a) => a.id === sourceAccountId);

  const onSubmit = async (values: FormValues) => {
    try {
      // A cheque / bank draft has no beneficiary account - don't send stale
      // values from fields that are hidden for this method.
      const body = values.paymentMethod === "TRANSFER" ? values : { ...values, beneficiaryAccount: undefined, beneficiaryBank: undefined };
      const payment = await api.post<Payment>("/payments", body);
      toast.success("Payment created as draft", { description: "Submit it for approval when ready." });
      if (payment.quotaWarning) toast.warning("Released quota", { description: payment.quotaWarning, duration: 9000 });
      reset();
      onSaved(payment);
    } catch (err) {
      toast.error("Could not create payment", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New Payment"
      description="Create a draft payment. The cash leaves the account on the due date, once it has been submitted and approved."
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
                {a.accountName} ({a.bankName}) — {a.currencyCode} {a.availableCash.toLocaleString()} available
              </option>
            ))}
          </Select>
          <ErrorText>{errors.sourceAccountId?.message}</ErrorText>
          {selectedAccount && selectedAccount.availableCash < 0 && <p className="mt-1 text-xs text-status-warning">This account is currently below its minimum balance.</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="paymentMethod" required>
              Payment Method
            </Label>
            <Select id="paymentMethod" {...register("paymentMethod")}>
              <option value="TRANSFER">Bank transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="BANK_DRAFT">Bank draft</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="invoiceNumber">Invoice No.</Label>
            <Input id="invoiceNumber" {...register("invoiceNumber")} placeholder="Supplier invoice number" />
          </div>
        </div>

        <div>
          <Label htmlFor="beneficiaryName" required>
            {paymentMethod === "TRANSFER" ? "Beneficiary Name" : "Payee Name"}
          </Label>
          <Input id="beneficiaryName" {...register("beneficiaryName")} error={!!errors.beneficiaryName} />
          <ErrorText>{errors.beneficiaryName?.message}</ErrorText>
        </div>

        {paymentMethod === "TRANSFER" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="beneficiaryBank" required>
                Beneficiary Bank
              </Label>
              <Input id="beneficiaryBank" {...register("beneficiaryBank")} error={!!errors.beneficiaryBank} placeholder="e.g. Maybank" />
              <ErrorText>{errors.beneficiaryBank?.message}</ErrorText>
            </div>
            <div>
              <Label htmlFor="beneficiaryAccount" required>
                Beneficiary Account Number
              </Label>
              <Input id="beneficiaryAccount" {...register("beneficiaryAccount")} error={!!errors.beneficiaryAccount} />
              <ErrorText>{errors.beneficiaryAccount?.message}</ErrorText>
            </div>
          </div>
        )}

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
            <Label htmlFor="paymentDate" required>
              Due Date
            </Label>
            <Input id="paymentDate" type="date" {...register("paymentDate")} error={!!errors.paymentDate} />
          </div>
        </div>

        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input id="reference" {...register("reference")} placeholder="Invoice / PO number" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
      </form>
    </Dialog>
  );
}
