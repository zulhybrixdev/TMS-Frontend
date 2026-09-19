import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { toast } from "sonner";
import { Dialog } from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input, Label, Select } from "../ui/Input";
import { Tabs } from "../ui/Tabs";
import { StatusBadge } from "../ui/Badge";
import { Skeleton } from "../ui/Skeleton";
import { ChartTooltip } from "../charts/ChartTooltip";
import { api, ApiError } from "../../lib/api-client";
import { formatDate, formatMoney } from "../../lib/format";
import { useAuth } from "../../lib/auth-context";
import { PERMISSIONS } from "../../lib/permissions";
import type { BankAccountRow } from "../../lib/types";

interface Props {
  account: BankAccountRow;
  onClose: () => void;
  onUpdated: (account: BankAccountRow) => void;
}

export function AccountDetailDrawer({ account, onClose, onUpdated }: Props) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.ACCOUNTS_MANAGE);
  const [tab, setTab] = useState("overview");

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["account-balances", account.id],
    queryFn: () => api.get<{ balanceDate: string; closingBalance: string }[]>(`/bank-accounts/${account.id}/balances?days=60`),
  });

  const settingsForm = useForm({
    defaultValues: {
      minimumBalance: account.minimumBalance,
      targetBalance: account.targetBalance,
      reservedAmount: account.reservedAmount,
      status: account.status,
    },
  });

  const balanceForm = useForm({ defaultValues: { balanceDate: new Date().toISOString().slice(0, 10), closingBalance: account.currentBalance } });

  const saveSettings = settingsForm.handleSubmit(async (values) => {
    try {
      const updated = await api.patch<BankAccountRow>(`/bank-accounts/${account.id}`, {
        minimumBalance: Number(values.minimumBalance),
        targetBalance: Number(values.targetBalance),
        reservedAmount: Number(values.reservedAmount),
        status: values.status,
      });
      toast.success("Account settings updated");
      onUpdated(updated);
    } catch (err) {
      toast.error("Could not update account", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  const saveBalance = balanceForm.handleSubmit(async (values) => {
    try {
      const updated = await api.post<BankAccountRow>(`/bank-accounts/${account.id}/balance`, {
        balanceDate: values.balanceDate,
        closingBalance: Number(values.closingBalance),
      });
      toast.success("Balance recorded", { description: "Current balance and cash position have been updated." });
      onUpdated(updated);
    } catch (err) {
      toast.error("Could not record balance", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  return (
    <Dialog open onClose={onClose} title={account.accountName} description={`${account.bankName} · ${account.accountNumber}`} size="lg">
      <Tabs
        tabs={[
          { key: "overview", label: "Overview" },
          ...(canManage ? [{ key: "settings", label: "Settings" }, { key: "balance", label: "Record Balance" }] : []),
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <div className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Current" value={formatMoney(account.currentBalance, account.currencyCode)} />
            <Metric label="Available" value={formatMoney(account.availableCash, account.currencyCode)} />
            <Metric label="Minimum" value={formatMoney(account.minimumBalance, account.currencyCode)} />
            <Metric label="Target" value={formatMoney(account.targetBalance, account.currencyCode)} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={account.cashStatus} />
            <StatusBadge status={account.status} />
            {account.shortfall > 0 && <span className="text-xs text-status-critical">Shortfall of {formatMoney(account.shortfall, account.currencyCode)}</span>}
            {account.excessCash > 0 && <span className="text-xs text-brand">Excess of {formatMoney(account.excessCash, account.currencyCode)}</span>}
          </div>

          <p className="mb-2 mt-6 text-[13px] font-medium text-ink-secondary">Balance History · 60 Days</p>
          {historyLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : !history || history.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-muted">No balance history recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history.map((h) => ({ date: h.balanceDate, closingBalance: Number(h.closingBalance) }))}>
                <defs>
                  <linearGradient id="acctFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(v) => formatDate(v, { day: "2-digit", month: "short" })} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis hide domain={["dataMin - 5000", "dataMax + 5000"]} />
                <Tooltip content={<ChartTooltip currency={account.currencyCode} labelFormatter={(l) => formatDate(l)} />} />
                <Area type="monotone" dataKey="closingBalance" stroke="var(--series-1)" strokeWidth={2} fill="url(#acctFill)" name="Balance" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {tab === "settings" && canManage && (
        <form className="space-y-4 pt-4" onSubmit={saveSettings}>
          <p className="text-[13px] text-ink-secondary">Configure the minimum and target balance thresholds used by the cash engine's shortfall/excess recommendations.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="minimumBalance">Minimum Balance</Label>
              <Input id="minimumBalance" type="number" step="0.01" {...settingsForm.register("minimumBalance")} />
            </div>
            <div>
              <Label htmlFor="targetBalance">Target Balance</Label>
              <Input id="targetBalance" type="number" step="0.01" {...settingsForm.register("targetBalance")} />
            </div>
            <div>
              <Label htmlFor="reservedAmount">Reserved Amount</Label>
              <Input id="reservedAmount" type="number" step="0.01" {...settingsForm.register("reservedAmount")} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" {...settingsForm.register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="DORMANT">Dormant</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={settingsForm.formState.isSubmitting}>
              Save Settings
            </Button>
          </div>
        </form>
      )}

      {tab === "balance" && canManage && (
        <form className="space-y-4 pt-4" onSubmit={saveBalance}>
          <p className="text-[13px] text-ink-secondary">Record today's (or a backdated) closing balance from the bank statement. This updates the cash position immediately.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="balanceDate">Balance Date</Label>
              <Input id="balanceDate" type="date" {...balanceForm.register("balanceDate")} />
            </div>
            <div>
              <Label htmlFor="closingBalance">Closing Balance</Label>
              <Input id="closingBalance" type="number" step="0.01" {...balanceForm.register("closingBalance")} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={balanceForm.formState.isSubmitting}>
              Record Balance
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-plane p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}
