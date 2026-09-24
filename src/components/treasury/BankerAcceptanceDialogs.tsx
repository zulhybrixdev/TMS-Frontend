import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input, Label, Select, Textarea } from "../ui/Input";
import { useAllAccounts } from "../../hooks/useReferenceData";
import { api, ApiError } from "../../lib/api-client";
import { dateOnly, formatDate, formatMoney, todayLocal } from "../../lib/format";
import type { BankerAcceptance } from "../../lib/types";

const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);

// Draw down a new BA: the bank credits `proceeds` today and the face amount is
// repaid at maturity. The cost (discount and annualised rate) is calculated
// live from the two amounts and the dates.
export function DrawdownDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { data: accounts } = useAllAccounts();
  const [form, setForm] = useState({ referenceNo: "", creditAccountId: "", settlementAccountId: "", faceAmount: "", proceedsAmount: "", drawdownDate: todayLocal(), maturityDate: todayLocal(90), description: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const credit = accounts?.items.find((a) => a.id === form.creditAccountId);
  const face = Number(form.faceAmount) || 0;
  const proceeds = Number(form.proceedsAmount) || 0;
  const tenor = daysBetween(form.drawdownDate, form.maturityDate);
  const discount = face - proceeds;
  const ratePa = proceeds > 0 && tenor > 0 ? (discount / proceeds) * (365 / tenor) * 100 : 0;
  const sameCurrency = useMemo(() => accounts?.items.filter((a) => !credit || a.currencyCode === credit.currencyCode) ?? [], [accounts, credit]);
  const valid = form.referenceNo.trim().length >= 2 && form.creditAccountId && face > 0 && proceeds > 0 && proceeds <= face && tenor > 0;

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/banker-acceptances", {
        referenceNo: form.referenceNo.trim(),
        creditAccountId: form.creditAccountId,
        settlementAccountId: form.settlementAccountId || undefined,
        faceAmount: face,
        proceedsAmount: proceeds,
        drawdownDate: form.drawdownDate,
        maturityDate: form.maturityDate,
        description: form.description || undefined,
      });
      toast.success("Banker acceptance drawn down", { description: `${formatMoney(proceeds, credit?.currencyCode)} credited to ${credit?.accountName}.` });
      setForm({ referenceNo: "", creditAccountId: "", settlementAccountId: "", faceAmount: "", proceedsAmount: "", drawdownDate: todayLocal(), maturityDate: todayLocal(90), description: "" });
      onSaved();
    } catch (err) {
      toast.error("Could not record drawdown", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Draw down banker acceptance"
      description="Records the funds credited by the bank. The face amount is scheduled to be debited at maturity."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!valid}>
            Record drawdown
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ba-ref" required>
              BA reference
            </Label>
            <Input id="ba-ref" value={form.referenceNo} onChange={set("referenceNo")} placeholder="Bank's BA number" />
          </div>
          <div>
            <Label htmlFor="ba-credit" required>
              Credited to account
            </Label>
            <Select id="ba-credit" value={form.creditAccountId} onChange={set("creditAccountId")}>
              <option value="">Select account</option>
              {accounts?.items.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountName} ({a.bankName}, {a.currencyCode})
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ba-face" required>
              Face amount (payable at maturity)
            </Label>
            <Input id="ba-face" type="number" min="0" step="0.01" value={form.faceAmount} onChange={set("faceAmount")} />
          </div>
          <div>
            <Label htmlFor="ba-proceeds" required>
              Proceeds credited by the bank
            </Label>
            <Input id="ba-proceeds" type="number" min="0" step="0.01" value={form.proceedsAmount} onChange={set("proceedsAmount")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ba-draw" required>
              Drawdown date
            </Label>
            <Input id="ba-draw" type="date" value={form.drawdownDate} onChange={set("drawdownDate")} />
          </div>
          <div>
            <Label htmlFor="ba-mat" required>
              Maturity date
            </Label>
            <Input id="ba-mat" type="date" value={form.maturityDate} onChange={set("maturityDate")} />
          </div>
        </div>
        <div>
          <Label htmlFor="ba-settle">Repay from (defaults to the credited account)</Label>
          <Select id="ba-settle" value={form.settlementAccountId} onChange={set("settlementAccountId")}>
            <option value="">Same as credited account</option>
            {sameCurrency.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountName} ({a.bankName})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ba-desc">Purpose / notes</Label>
          <Textarea id="ba-desc" rows={2} value={form.description} onChange={set("description")} placeholder="e.g. steel coil import - PO 4471" />
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg bg-plane p-3 text-xs">
          <Calc label="Tenor" value={tenor > 0 ? `${tenor} days` : "—"} />
          <Calc label="Discount / cost" value={face > 0 && proceeds > 0 ? formatMoney(discount, credit?.currencyCode) : "—"} warn={proceeds > face} />
          <Calc label="Effective rate p.a." value={ratePa > 0 ? `${ratePa.toFixed(2)}%` : "—"} />
        </div>
        {proceeds > face && <p className="text-xs text-status-critical">Proceeds cannot be more than the face amount.</p>}
      </div>
    </Dialog>
  );
}

function Calc({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-ink-muted">{label}</p>
      <p className={`mt-0.5 text-[14px] font-semibold tabular-nums ${warn ? "text-status-critical" : "text-ink"}`}>{value}</p>
    </div>
  );
}

export function SettleDialog({ ba, onClose, onSaved }: { ba: BankerAcceptance | null; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(todayLocal());
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!ba) return;
    setSaving(true);
    try {
      await api.post(`/banker-acceptances/${ba.id}/settle`, { settledDate: date, settledAmount: amount ? Number(amount) : undefined });
      toast.success("Banker acceptance settled", { description: `${formatMoney(amount ? Number(amount) : ba.faceAmount, ba.currencyCode)} debited from ${ba.settlementAccountName}.` });
      setAmount("");
      onSaved();
    } catch (err) {
      toast.error("Could not settle", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!ba}
      onClose={onClose}
      title={`Settle ${ba?.referenceNo ?? ""}`}
      description={ba ? `Matures ${formatDate(ba.maturityDate)}. The amount is debited from ${ba.settlementAccountName} straight away.` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Settle
          </Button>
        </>
      }
    >
      {ba && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="settle-date">Settlement date</Label>
            <Input id="settle-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="settle-amount">Amount debited by the bank</Label>
            <Input id="settle-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(ba.faceAmount)} />
            <p className="mt-1 text-[11.5px] text-ink-muted">Leave blank to use the face amount ({formatMoney(ba.faceAmount, ba.currencyCode)}).</p>
          </div>
          {dateOnly(ba.maturityDate) > date && <p className="text-xs text-status-warning">This is being settled before its maturity date.</p>}
        </div>
      )}
    </Dialog>
  );
}
