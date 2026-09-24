import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input, Label, Select, ErrorText } from "../ui/Input";
import { useBanks, useCurrencies, useSites } from "../../hooks/useReferenceData";
import { api, ApiError } from "../../lib/api-client";
import { t, tk } from "../../i18n";

const schema = z.object({
  bankId: z.string().min(1, tk("Bank is required")),
  accountName: z.string().min(2, tk("Account name is required")),
  accountNumber: z.string().min(4, tk("Account number is required")),
  currencyCode: z.string().length(3, tk("Currency is required")),
  accountType: z.enum(["OPERATING", "COLLECTION", "DISBURSEMENT", "RESERVE"]),
  // Negative = already in overdraft (bounded by the overdraft limit below).
  currentBalance: z.coerce.number(),
  minimumBalance: z.coerce.number().min(0),
  targetBalance: z.coerce.number().min(0),
  overdraftLimit: z.coerce.number().min(0),
  siteName: z.string().max(100).optional(),
}).refine((v) => v.currentBalance >= -v.overdraftLimit, { message: tk("More overdrawn than the overdraft limit"), path: ["currentBalance"] });
type FormValues = z.infer<typeof schema>;

export function AccountFormDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { data: banks } = useBanks();
  const { data: currencies } = useCurrencies();
  const { data: sites } = useSites();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { accountType: "OPERATING", currentBalance: 0, minimumBalance: 0, targetBalance: 0, overdraftLimit: 0, siteName: "", currencyCode: "MYR" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/bank-accounts", { ...values, siteName: values.siteName?.trim() || null });
      reset();
      onSaved();
    } catch (err) {
      toast.error(t("Could not create account"), { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("Add Bank Account")}
      description={t("Register a new company bank account and its balance thresholds.")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("Cancel")}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {t("Create Account")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="bankId" required>
              {t("Bank")}
            </Label>
            <Select id="bankId" {...register("bankId")} error={!!errors.bankId}>
              <option value="">{t("Select bank")}</option>
              {banks?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <ErrorText>{errors.bankId?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="currencyCode" required>
              {t("Currency")}
            </Label>
            <Select id="currencyCode" {...register("currencyCode")} error={!!errors.currencyCode}>
              {currencies?.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
            <ErrorText>{errors.currencyCode?.message}</ErrorText>
          </div>
        </div>

        <div>
          <Label htmlFor="accountName" required>
            {t("Account Name")}
          </Label>
          <Input id="accountName" {...register("accountName")} error={!!errors.accountName} placeholder={t("e.g. Maybank Operating Account")} />
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
            <Label htmlFor="accountType" required>
              {t("Account Type")}
            </Label>
            <Select id="accountType" {...register("accountType")}>
              <option value="OPERATING">{t("Operating")}</option>
              <option value="COLLECTION">{t("Collection")}</option>
              <option value="DISBURSEMENT">{t("Disbursement")}</option>
              <option value="RESERVE">{t("Reserve")}</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="currentBalance" required>
              {t("Opening Balance")}
            </Label>
            <Input id="currentBalance" type="number" step="0.01" {...register("currentBalance")} error={!!errors.currentBalance} />
            <ErrorText>{errors.currentBalance?.message}</ErrorText>
          </div>
          <div>
            <Label htmlFor="minimumBalance" required>
              {t("Minimum Balance")}
            </Label>
            <Input id="minimumBalance" type="number" step="0.01" {...register("minimumBalance")} error={!!errors.minimumBalance} />
          </div>
          <div>
            <Label htmlFor="targetBalance" required>
              {t("Target Balance")}
            </Label>
            <Input id="targetBalance" type="number" step="0.01" {...register("targetBalance")} error={!!errors.targetBalance} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="overdraftLimit">{t("Overdraft Limit")}</Label>
            <Input id="overdraftLimit" type="number" step="0.01" {...register("overdraftLimit")} error={!!errors.overdraftLimit} />
            <p className="mt-1 text-[11.5px] text-ink-muted">{t("Approved overdraft facility on this account (0 = none).")}</p>
          </div>
          <div>
            <Label htmlFor="siteName">{t("Site / Entity")}</Label>
            <Input id="siteName" list="site-options" {...register("siteName")} placeholder={t("e.g. PJRM, Bukit Raja")} />
            <datalist id="site-options">
              {sites?.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <p className="mt-1 text-[11.5px] text-ink-muted">{t("Groups this account's cash reserve by site.")}</p>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
