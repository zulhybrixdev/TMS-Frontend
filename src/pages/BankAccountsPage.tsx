import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Toolbar } from "../components/ui/Toolbar";
import { Select } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { DataTable, Pagination, Column } from "../components/ui/Table";
import { SkeletonTable } from "../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/Badge";
import { useListQuery } from "../hooks/useListQuery";
import { useBanks } from "../hooks/useReferenceData";
import { useAuth } from "../lib/auth-context";
import { PERMISSIONS } from "../lib/permissions";
import { formatDate, formatMoney } from "../lib/format";
import type { BankAccountRow } from "../lib/types";
import { AccountFormDialog } from "../components/bank-accounts/AccountFormDialog";
import { AccountDetailDrawer } from "../components/bank-accounts/AccountDetailDrawer";
import { t, tEnum } from "../i18n";

export default function BankAccountsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.ACCOUNTS_MANAGE);
  const { data: banks } = useBanks();
  const qc = useQueryClient();

  const list = useListQuery<BankAccountRow>("bank-accounts", (params) => `/bank-accounts?${params.toString()}`, { defaultSort: "accountName" });

  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<BankAccountRow | null>(null);

  const columns: Column<BankAccountRow>[] = [
    {
      key: "accountName",
      header: t("Account"),
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.accountName}</p>
          <p className="text-xs text-ink-muted">
            {r.bankName} · {r.accountNumber}
          </p>
        </div>
      ),
    },
    { key: "accountType", header: t("Type"), render: (r) => <span className="text-xs text-ink-secondary">{tEnum(r.accountType)}{r.siteName ? ` · ${r.siteName}` : ""}</span> },
    { key: "currencyCode", header: t("Currency"), render: (r) => r.currencyCode },
    { key: "currentBalance", header: t("Current Balance"), sortable: true, align: "right", render: (r) => <span className="tabular-nums">{formatMoney(r.currentBalance, r.currencyCode)}</span> },
    { key: "availableCash", header: t("Available"), align: "right", render: (r) => (
        <div className="tabular-nums">
          <p className={r.availableCash < 0 ? "text-status-warning" : ""}>{formatMoney(r.availableCash, r.currencyCode)}</p>
          {r.overdraftLimit > 0 && <p className="text-xs text-ink-muted">{formatMoney(r.liquidity, r.currencyCode)} {t("incl. OD")}</p>}
        </div>
      ),
    },
    {
      key: "overdraftLimit",
      header: t("Overdraft"),
      align: "right",
      render: (r) =>
        r.overdraftLimit > 0 ? (
          <div className="tabular-nums">
            <p className={r.overdraftUtilised > 0 ? "text-status-warning" : "text-ink-secondary"}>{formatMoney(r.overdraftUtilised, r.currencyCode)} {t("used")}</p>
            <p className="text-xs text-ink-muted">{t("of")} {formatMoney(r.overdraftLimit, r.currencyCode)}</p>
          </div>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    {
      key: "floatTotal",
      header: t("Float D1 / D2"),
      align: "right",
      render: (r) =>
        r.floatTotal > 0 ? (
          <span className="tabular-nums text-ink-secondary">
            {formatMoney(r.floatDay1, r.currencyCode)} / {formatMoney(r.floatDay2, r.currencyCode)}
          </span>
        ) : (
          <span className="text-ink-muted">—</span>
        ),
    },
    { key: "minimumBalance", header: t("Minimum"), align: "right", render: (r) => <span className="tabular-nums text-ink-secondary">{formatMoney(r.minimumBalance, r.currencyCode)}</span> },
    { key: "targetBalance", header: t("Target"), align: "right", render: (r) => <span className="tabular-nums text-ink-secondary">{formatMoney(r.targetBalance, r.currencyCode)}</span> },
    { key: "cashStatus", header: t("Status"), render: (r) => <StatusBadge status={r.cashStatus} /> },
    { key: "lastBalanceAt", header: t("Last Updated"), render: (r) => <span className="text-xs text-ink-muted">{r.lastBalanceAt ? formatDate(r.lastBalanceAt) : "—"}</span> },
  ];

  const onCreated = () => {
    qc.invalidateQueries({ queryKey: ["bank-accounts"] });
    setCreateOpen(false);
    toast.success(t("Bank account created"));
  };

  return (
    <>
      <PageHeader
        title={t("Bank Accounts")}
        description={t("Company bank accounts, balances, and configured minimum/target thresholds.")}
        actions={
          canManage && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> {t("Add Account")}
            </Button>
          )
        }
      />

      <Card>
        <Toolbar
          search={list.search}
          onSearch={list.setSearch}
          placeholder={t("Search account name or number...")}
          filters={
            <>
              <Select className="h-9 w-40" value={list.filters.bankId ?? ""} onChange={(e) => list.setFilter("bankId", e.target.value)}>
                <option value="">{t("All banks")}</option>
                {banks?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
              <Select className="h-9 w-36" value={list.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)}>
                <option value="">{t("All statuses")}</option>
                <option value="ACTIVE">{t("Active")}</option>
                <option value="DORMANT">{t("Dormant")}</option>
                <option value="CLOSED">{t("Closed")}</option>
              </Select>
            </>
          }
        />

        {list.isLoading ? (
          <SkeletonTable cols={11} />
        ) : list.isError ? (
          <ErrorState message={(list.error as Error)?.message} onRetry={list.refetch} />
        ) : list.data.length === 0 ? (
          <EmptyState icon={<Landmark className="h-5 w-5" />} title={t("No bank accounts found")} description={t("Try adjusting your filters, or add a new bank account.")} />
        ) : (
          <DataTable columns={columns} rows={list.data} rowKey={(r) => r.id} sortBy={list.sortBy} sortDir={list.sortDir} onSort={list.toggleSort} onRowClick={setSelected} />
        )}

        {list.meta && <Pagination page={list.page} totalPages={list.meta.totalPages} total={list.meta.total} pageSize={list.meta.pageSize} onPage={list.setPage} />}
      </Card>

      <AccountFormDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={onCreated} />
      {selected && (
        <AccountDetailDrawer
          account={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            qc.invalidateQueries({ queryKey: ["bank-accounts"] });
            setSelected(updated);
          }}
        />
      )}
    </>
  );
}
