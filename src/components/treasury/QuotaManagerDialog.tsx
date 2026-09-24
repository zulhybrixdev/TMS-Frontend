import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, ConfirmDialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input, Label, Select } from "../ui/Input";
import { useBanks } from "../../hooks/useReferenceData";
import { api, ApiError } from "../../lib/api-client";
import { formatMoney } from "../../lib/format";
import type { InstrumentQuota } from "../../lib/types";

const METHOD_LABEL = { CHEQUE: "Cheque", BANK_DRAFT: "Bank draft" } as const;

// Configure the per-day cheque / bank draft ceilings (all banks, or one bank -
// e.g. the MBSB bank draft quota).
export function QuotaManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: banks } = useBanks();
  const { data: quotas } = useQuery({ queryKey: ["instrument-quotas"], queryFn: () => api.get<InstrumentQuota[]>("/instrument-quotas"), enabled: open });

  const [method, setMethod] = useState<"CHEQUE" | "BANK_DRAFT">("CHEQUE");
  const [bankId, setBankId] = useState("");
  const [amount, setAmount] = useState("");
  const [count, setCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<InstrumentQuota | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["instrument-quotas"] });
    qc.invalidateQueries({ queryKey: ["treasury-desk"] });
  };

  const add = async () => {
    setSaving(true);
    try {
      await api.post("/instrument-quotas", {
        paymentMethod: method,
        bankId: bankId || null,
        dailyAmountLimit: amount ? Number(amount) : null,
        dailyCountLimit: count ? Number(count) : null,
      });
      toast.success("Quota saved");
      setAmount("");
      setCount("");
      refresh();
    } catch (err) {
      toast.error("Could not save quota", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/instrument-quotas/${toDelete.id}`);
      toast.success("Quota removed");
      setToDelete(null);
      refresh();
    } catch (err) {
      toast.error("Could not remove quota", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Cheque & bank draft quotas" description="A daily ceiling on what can be released by cheque or bank draft, for all banks together or for one bank." size="lg">
        <div className="space-y-2">
          {quotas && quotas.length > 0 ? (
            quotas.map((q) => (
              <div key={q.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-[13px]">
                <div>
                  <p className="font-medium text-ink">
                    {q.bankName ?? "All banks"} · {METHOD_LABEL[q.paymentMethod]}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {q.dailyAmountLimit !== null ? `${formatMoney(q.dailyAmountLimit, q.currencyCode)} per day` : ""}
                    {q.dailyAmountLimit !== null && q.dailyCountLimit !== null ? " · " : ""}
                    {q.dailyCountLimit !== null ? `${q.dailyCountLimit} per day` : ""}
                  </p>
                </div>
                <button onClick={() => setToDelete(q)} aria-label="Remove quota" className="rounded-md p-1.5 text-ink-muted hover:bg-plane hover:text-status-critical">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-ink-muted">No quotas yet.</p>
          )}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-[13px] font-medium text-ink">Add a quota</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="q-method">Instrument</Label>
              <Select id="q-method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_DRAFT">Bank draft</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="q-bank">Bank</Label>
              <Select id="q-bank" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                <option value="">All banks</option>
                {banks?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="q-amount">Daily amount limit (MYR)</Label>
              <Input id="q-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500000" />
            </div>
            <div>
              <Label htmlFor="q-count">Daily count limit</Label>
              <Input id="q-count" type="number" min="0" step="1" value={count} onChange={(e) => setCount(e.target.value)} placeholder="optional" />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={add} loading={saving} disabled={!amount && !count}>
              Add quota
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={remove} title="Remove this quota?" description="Payments already raised are not affected." confirmLabel="Remove" tone="danger" />
    </>
  );
}
