import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { platformApiFor } from "../../lib/platform-api-client";
import type { PlatformEnvironment } from "../../lib/platform-environments";
import type { TenantSsoInfo } from "../../lib/platform-types";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input, Label, Select } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { HandOverLines, NewIdpFields, apiErrorMessage, emptyIdpValues, idpRequestBody, type NewIdpValues } from "./idp-shared";

const NEW = "__new__";

// Platform Console -> tenant row -> "Single sign-on". Sets up SSO *for* one
// tenant: choose (or register) its identity provider and set the options its
// own admin would otherwise set under Administration -> Security. Follows the
// same rules as that tab (Pro+, not an Individual account).
export function TenantSsoDialog({ tenant, env, onClose }: { tenant: { id: string; name: string; slug: string }; env: PlatformEnvironment; onClose: () => void }) {
  const api = platformApiFor(env);
  const { data, isLoading, error } = useQuery({
    queryKey: ["platform", "tenant-sso", env.key, tenant.id],
    queryFn: () => api.get<TenantSsoInfo>(`/tenants/${tenant.id}/sso`),
    retry: false,
  });

  return (
    <Dialog open onClose={onClose} title={`Single sign-on - ${tenant.name}`} description={`${env.label} · ${tenant.slug}`} size="lg">
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : error || !data ? (
        <p className="text-[13px] text-status-critical">{error instanceof Error ? error.message : "Could not load this tenant's SSO settings"}</p>
      ) : !data.eligibility.ok ? (
        <Notice>{data.eligibility.reason}</Notice>
      ) : !data.keycloak.reachable ? (
        <Notice>Keycloak isn't responding in {env.label}. Check that its process is running, then reopen this.</Notice>
      ) : !data.keycloak.adminAccessConfigured ? (
        <Notice>The platform service account isn't set up for {env.label} - run keycloak/provision-platform-client.sh for this tier.</Notice>
      ) : (
        <SsoForm info={data} env={env} onClose={onClose} />
      )}
      <p className="mt-4 border-t border-border pt-3 text-[12px] text-ink-muted">
        <Link to="/platform/sso" onClick={onClose} className="text-brand hover:underline">
          View all identity providers →
        </Link>{" "}
        (Keycloak status, unused providers, admin console)
      </p>
    </Dialog>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">{children}</p>;
}

function SsoForm({ info, env, onClose }: { info: TenantSsoInfo; env: PlatformEnvironment; onClose: () => void }) {
  const api = platformApiFor(env);
  const qc = useQueryClient();
  const { config, providers, tenant } = info;

  const [selected, setSelected] = useState<string>(config?.keycloakIdpAlias ?? (providers.length > 0 ? "" : NEW));
  const [newIdp, setNewIdp] = useState<NewIdpValues>(emptyIdpValues({ alias: info.suggestedAlias, displayName: `${tenant.name} SSO` }));
  const [domains, setDomains] = useState((config?.allowedEmailDomains ?? []).join(", "));
  const [autoProvision, setAutoProvision] = useState(config?.autoProvisionUsers ?? true);
  const [ssoRequired, setSsoRequired] = useState(config?.ssoRequired ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const creating = selected === NEW;
  const chosen = providers.find((p) => p.alias === selected);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["platform", "tenant-sso", env.key] });
    qc.invalidateQueries({ queryKey: ["platform", "keycloak", env.key] });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return setError("Choose an identity provider, or register a new one.");
    setSaving(true);
    setError(null);
    try {
      const alias = creating ? newIdp.alias : selected;
      if (creating) await api.post("/keycloak/identity-providers", idpRequestBody(newIdp, tenant.id));
      await api.put(`/tenants/${tenant.id}/sso`, {
        keycloakIdpAlias: alias,
        ssoRequired,
        autoProvisionUsers: autoProvision,
        allowedEmailDomains: domains.split(/[,\s]+/).map((d) => d.trim()).filter(Boolean),
      });
      toast.success(`SSO configured for ${tenant.name}`);
      refresh();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not save SSO settings"));
      refresh(); // a provider may have been created even if saving the tenant's settings failed
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await api.delete(`/tenants/${tenant.id}/sso`);
      toast.success(`SSO removed for ${tenant.name}`);
      refresh();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not remove SSO"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <Label htmlFor="tenant-idp">Identity provider</Label>
        <Select id="tenant-idp" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose…</option>
          {providers.map((p) => (
            <option key={p.alias} value={p.alias}>
              {p.displayName} ({p.alias}) - {p.protocol.toUpperCase()}
              {p.tenants.some((t) => t.slug !== tenant.slug) ? " - also used by another tenant" : ""}
            </option>
          ))}
          <option value={NEW}>Register a new provider…</option>
        </Select>
      </div>

      {creating && (
        <div className="rounded-lg border border-border p-4">
          <NewIdpFields values={newIdp} onChange={setNewIdp} />
        </div>
      )}
      {chosen && info.keycloak.brokerBaseUrl && (
        <div className="rounded-lg border border-border p-4">
          <HandOverLines brokerBaseUrl={info.keycloak.brokerBaseUrl} alias={chosen.alias} protocol={chosen.protocol} />
        </div>
      )}

      <div>
        <Label htmlFor="tenant-domains">Allowed email domains (optional)</Label>
        <Input id="tenant-domains" value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="e.g. acme.com, acme.com.my" />
        <p className="mt-1 text-[12px] text-ink-muted">Only these domains can sign in or be created via SSO. Leave blank for no restriction.</p>
      </div>
      <label className="flex items-start gap-2.5 text-[13px]">
        <input type="checkbox" className="mt-0.5" checked={autoProvision} onChange={(e) => setAutoProvision(e.target.checked)} />
        <span>
          <span className="font-medium text-ink">Automatically create accounts</span>
          <span className="block text-ink-muted">First-time SSO users get an account with Viewer access. If off, they must already have one.</span>
        </span>
      </label>
      <label className="flex items-start gap-2.5 text-[13px]">
        <input type="checkbox" className="mt-0.5" checked={ssoRequired} onChange={(e) => setSsoRequired(e.target.checked)} />
        <span>
          <span className="font-medium text-ink">Require SSO for everyone</span>
          <span className="block text-ink-muted">Blocks password sign-in except for Admins. Turn on only once SSO is confirmed working.</span>
        </span>
      </label>
      <p className="text-[12px] text-ink-muted">These are the same settings the tenant's own admin sees under Administration → Security - whoever saves last wins.</p>

      {error && <p className="rounded-lg bg-status-critical-soft px-3 py-2 text-[13px] text-status-critical">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <div>
          {config && (
            <Button type="button" variant="outline" onClick={remove} disabled={saving}>
              Remove SSO for this tenant
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {creating ? "Register & save" : "Save"}
          </Button>
        </div>
      </div>
    </form>
  );
}
