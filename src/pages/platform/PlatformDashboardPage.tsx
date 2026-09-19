import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import clsx from "clsx";
import { Building2, CircleDollarSign, Eye, FlaskConical, History, KeyRound, LogOut, Pause, Play, ShieldAlert, SlidersHorizontal, Users2 } from "lucide-react";
import { usePlatformAuth, ConnectedEnvironment } from "../../lib/platform-auth-context";
import { platformApiFor, ApiError } from "../../lib/platform-api-client";
import type { PlatformEnvironment } from "../../lib/platform-environments";
import type { PlatformTenantRow } from "../../lib/platform-types";
import type { AuthUser, PlanKey } from "../../lib/types";
import { DataTable } from "../../components/ui/Table";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { Select, Label } from "../../components/ui/Input";
import { Toolbar } from "../../components/ui/Toolbar";
import { SkeletonStatCard, SkeletonTable } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { formatDate, formatMoney, initials } from "../../lib/format";
import { TenantAuditLogDialog } from "./TenantAuditLogDialog";
import { TenantSsoDialog } from "./TenantSsoDialog";

const PLAN_TONE: Record<PlanKey, "neutral" | "brand"> = { FREE: "neutral", PRO: "brand", PRO_PLUS: "brand" };

// One row, tagged with which environment/database it actually lives in -
// every action on it must go back to that same environment's API.
type EnvTenantRow = PlatformTenantRow & { conn: ConnectedEnvironment };

function originOf(apiBase: string): string {
  return apiBase.replace(/\/api\/?$/, "");
}

export default function PlatformDashboardPage() {
  const { connected, logout } = usePlatformAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [managing, setManaging] = useState<EnvTenantRow | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<EnvTenantRow | null>(null);
  const [viewingAuditLog, setViewingAuditLog] = useState<EnvTenantRow | null>(null);
  const [ssoTenant, setSsoTenant] = useState<EnvTenantRow | null>(null);
  const [confirmModeSwitch, setConfirmModeSwitch] = useState(false);
  const [switchingMode, setSwitchingMode] = useState(false);

  const connectedKeys = connected.map((c) => c.env.key).join(",");

  const { data: tenantsByEnv, isLoading } = useQuery({
    queryKey: ["platform", "tenants", connectedKeys],
    queryFn: async () => {
      const results = await Promise.all(
        connected.map(async (conn) => {
          const rows = await platformApiFor(conn.env).get<PlatformTenantRow[]>("/tenants");
          return rows.map((r): EnvTenantRow => ({ ...r, conn }));
        })
      );
      return results.flat();
    },
    enabled: connected.length > 0,
  });

  // The live POC/full switch only means anything for the uat environment -
  // production never mounts /poc at all, so there's nothing to toggle there.
  const uatConn = connected.find((c) => c.env.key === "uat");
  const { data: config } = useQuery({
    queryKey: ["platform", "config", "uat"],
    queryFn: () => platformApiFor(uatConn!.env).get<{ pocMode: boolean }>("/config"),
    enabled: !!uatConn,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["platform", "tenants"] });

  const toggleMode = async () => {
    if (!uatConn) return;
    setSwitchingMode(true);
    try {
      const result = await platformApiFor(uatConn.env).post<{ pocMode: boolean }>("/config", { pocMode: !config?.pocMode });
      qc.setQueryData(["platform", "config", "uat"], result);
      toast.success(result.pocMode ? "UAT is now live in POC mode" : "UAT is now live in full mode");
    } catch (err) {
      toast.error("Could not switch mode", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSwitchingMode(false);
      setConfirmModeSwitch(false);
    }
  };

  const filtered = useMemo(() => {
    const rows = tenantsByEnv ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tenantsByEnv, search]);

  const stats = useMemo(() => {
    const list = tenantsByEnv ?? [];
    const active = list.filter((t) => t.status === "ACTIVE").length;
    const suspended = list.filter((t) => t.status === "SUSPENDED").length;
    const mrr = list.reduce((sum, t) => (t.subscription?.status === "ACTIVE" ? sum + t.subscription.plan.priceMYR : sum), 0);
    return { total: list.length, active, suspended, mrr };
  }, [tenantsByEnv]);

  // Opens the tenant's own app (on ITS environment's origin, not Platform
  // Console's) signed in as its Admin. The token is handed off via a
  // one-time URL param - since Platform Console and the tenant app are now
  // different origins, localStorage can't be shared directly - which
  // /impersonate-entry (always present in the deployed app) reads and
  // stores before redirecting to "/".
  const viewAsTenant = async (tenant: EnvTenantRow) => {
    try {
      const result = await platformApiFor(tenant.conn.env).post<{ token: string; user: AuthUser }>(`/tenants/${tenant.id}/impersonate`);
      window.open(`${originOf(tenant.conn.env.apiBase)}/impersonate-entry?token=${encodeURIComponent(result.token)}`, "_blank");
    } catch (err) {
      toast.error("Could not view tenant", { description: err instanceof ApiError ? err.message : undefined });
    }
  };

  const toggleSuspend = async (tenant: EnvTenantRow) => {
    try {
      const action = tenant.status === "SUSPENDED" ? "activate" : "suspend";
      await platformApiFor(tenant.conn.env).post(`/tenants/${tenant.id}/${action}`);
      toast.success(action === "suspend" ? `${tenant.name} suspended` : `${tenant.name} reactivated`);
      refresh();
    } catch (err) {
      toast.error("Could not update tenant", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setConfirmSuspend(null);
    }
  };

  return (
    <div className="min-h-screen bg-plane">
      <header className="ledger-grid sticky top-0 z-30 flex h-14 items-center justify-between border-b border-chrome-border bg-chrome px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/15">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[13.5px] font-semibold text-chrome-ink">Platform Console</p>
            <p className="text-[10.5px] uppercase tracking-wider text-chrome-muted">Cross-tenant oversight</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {uatConn && config && (
            <button
              onClick={() => setConfirmModeSwitch(true)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                config.pocMode ? "bg-status-warning-soft text-status-warning" : "bg-status-good-soft text-status-good"
              )}
            >
              <FlaskConical className="h-3.5 w-3.5" />
              UAT live: {config.pocMode ? "POC" : "Full app"}
            </button>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
            {connected.map((c) => (
              <span key={c.env.key} className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-chrome-muted">
                {c.env.label}
              </span>
            ))}
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">{initials(connected[0]?.admin.name ?? "?")}</div>
            <span className="text-[13px] text-chrome-muted">{connected[0]?.admin.name}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={logout} className="text-chrome-muted hover:bg-white/5 hover:text-chrome-ink">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8"
      >
        <div className="mb-6">
          <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Tenants</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Every organisation across {connected.map((c) => c.env.label).join(" and ") || "every connected environment"}, in one view.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard label="Total Tenants" value={stats.total} icon={Building2} />
              <StatCard label="Active" value={stats.active} icon={Play} />
              <StatCard label="Suspended" value={stats.suspended} icon={Pause} tone={stats.suspended > 0 ? "critical" : "default"} />
              <StatCard label="Monthly Recurring Revenue" value={stats.mrr} format={(n) => formatMoney(n)} icon={CircleDollarSign} />
            </>
          )}
        </div>

        <Card className="mt-5">
          <Toolbar search={search} onSearch={setSearch} placeholder="Search tenants..." />

          {isLoading ? (
            <SkeletonTable rows={5} cols={8} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users2 className="h-5 w-5" />}
              title={search ? "No tenants match your search" : "No tenants yet"}
              description={search ? "Try a different name or slug." : "Tenants appear here as soon as someone registers."}
            />
          ) : (
            <DataTable<EnvTenantRow>
              columns={[
                {
                  key: "name",
                  header: "Tenant",
                  render: (t) => (
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">{initials(t.name)}</div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{t.name}</p>
                        <p className="font-mono text-[11px] text-ink-muted">{t.slug}</p>
                      </div>
                    </div>
                  ),
                },
                { key: "env", header: "Environment", render: (t) => <Badge tone={t.conn.env.key === "production" ? "critical" : "warning"}>{t.conn.env.label}</Badge> },
                { key: "accountType", header: "Account type", render: (t) => <Badge tone="neutral">{t.accountType}</Badge> },
                { key: "plan", header: "Plan", render: (t) => <Badge tone={t.subscription ? PLAN_TONE[t.subscription.planKey] : "neutral"}>{t.subscription?.plan.name ?? "—"}</Badge> },
                { key: "subStatus", header: "Billing", render: (t) => (t.subscription ? <StatusBadge status={t.subscription.status} /> : "—") },
                { key: "status", header: "Tenant status", render: (t) => <StatusBadge status={t.status} /> },
                {
                  key: "usage",
                  header: "Users / Accounts",
                  align: "right",
                  render: (t) => (
                    <span className="font-mono text-[13px] tabular-nums text-ink-secondary">
                      {t.usage.users} / {t.usage.bankAccounts}
                    </span>
                  ),
                },
                { key: "createdAt", header: "Created", render: (t) => <span className="text-ink-muted">{formatDate(t.createdAt)}</span> },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  render: (t) => (
                    <DropdownMenu
                      items={[
                        { label: "View as tenant", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => viewAsTenant(t) },
                        { label: "Audit log", icon: <History className="h-3.5 w-3.5" />, onClick: () => setViewingAuditLog(t) },
                        { label: "Change plan", icon: <SlidersHorizontal className="h-3.5 w-3.5" />, onClick: () => setManaging(t) },
                        { label: "Single sign-on", icon: <KeyRound className="h-3.5 w-3.5" />, onClick: () => setSsoTenant(t) },
                        {
                          label: t.status === "SUSPENDED" ? "Reactivate" : "Suspend",
                          icon: t.status === "SUSPENDED" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />,
                          onClick: () => setConfirmSuspend(t),
                          tone: t.status === "SUSPENDED" ? "default" : "danger",
                        },
                      ]}
                    />
                  ),
                },
              ]}
              rows={filtered}
              rowKey={(t) => `${t.conn.env.key}:${t.id}`}
            />
          )}
        </Card>
      </motion.main>

      {ssoTenant && <TenantSsoDialog tenant={ssoTenant} env={ssoTenant.conn.env} onClose={() => setSsoTenant(null)} />}

      {viewingAuditLog && <TenantAuditLogDialog tenant={viewingAuditLog} env={viewingAuditLog.conn.env} onClose={() => setViewingAuditLog(null)} />}

      {managing && (
        <ChangePlanDialog
          tenant={managing}
          env={managing.conn.env}
          onClose={() => setManaging(null)}
          onSaved={() => {
            setManaging(null);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        onConfirm={() => confirmSuspend && toggleSuspend(confirmSuspend)}
        title={confirmSuspend?.status === "SUSPENDED" ? `Reactivate ${confirmSuspend?.name}?` : `Suspend ${confirmSuspend?.name}?`}
        description={
          confirmSuspend?.status === "SUSPENDED"
            ? "Users at this tenant will be able to sign in again immediately."
            : "Every user at this tenant will be signed out and blocked from signing in again until reactivated."
        }
        tone={confirmSuspend?.status === "SUSPENDED" ? "primary" : "danger"}
        confirmLabel={confirmSuspend?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
      />

      <ConfirmDialog
        open={confirmModeSwitch}
        onClose={() => setConfirmModeSwitch(false)}
        onConfirm={toggleMode}
        loading={switchingMode}
        title={config?.pocMode ? "Switch UAT's live site to the full app?" : "Switch UAT's live site to POC mode?"}
        description={
          config?.pocMode
            ? "Every visitor to the UAT/POC environment will be redirected away from /poc to the full app, immediately. Production is unaffected."
            : "Every visitor to the UAT/POC environment will be redirected to /poc, immediately. Production is unaffected - it never serves /poc at all."
        }
        confirmLabel="Switch"
      />
    </div>
  );
}

function ChangePlanDialog({ tenant, env, onClose, onSaved }: { tenant: EnvTenantRow; env: PlatformEnvironment; onClose: () => void; onSaved: () => void }) {
  const [planKey, setPlanKey] = useState<PlanKey>(tenant.subscription?.planKey ?? "FREE");
  const [status, setStatus] = useState<"ACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING_PAYMENT">(tenant.subscription?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await platformApiFor(env).post(`/tenants/${tenant.id}/subscription`, { planKey, status });
      toast.success(`${tenant.name} is now on ${planKey.replace("_", "+")}`);
      onSaved();
    } catch (err) {
      toast.error("Could not change plan", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Change plan — ${tenant.name} (${env.label})`}
      description="Manual override - bypasses Fiuu checkout. Use this to comp a customer or correct a subscription after a failed/refunded payment."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="planKey">Plan</Label>
          <Select id="planKey" value={planKey} onChange={(e) => setPlanKey(e.target.value as PlanKey)}>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PRO_PLUS">Pro+</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Subscription status</Label>
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past due</option>
            <option value="CANCELED">Canceled</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
          </Select>
        </div>
      </div>
    </Dialog>
  );
}
