import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, KeyRound, LogOut, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { usePlatformAuth, ConnectedEnvironment } from "../../lib/platform-auth-context";
import { platformApiFor, ApiError } from "../../lib/platform-api-client";
import type { KeycloakIdentityProvider, KeycloakIdentityProviders, KeycloakOverview } from "../../lib/platform-types";
import { Card, CardBody, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog, ConfirmDialog } from "../../components/ui/Dialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { HandOverLines, NewIdpFields, apiErrorMessage, emptyIdpValues, idpRequestBody, type NewIdpValues } from "./idp-shared";

// Platform Console -> Identity / SSO. One card per connected environment,
// since each tier has its own Keycloak instance. Platform staff register a
// customer's identity provider here (Keycloak reads its metadata and does
// the protocol work); the customer's own admin then enters the alias in
// their Administration -> Security tab.
export default function PlatformIdentityPage() {
  const { connected } = usePlatformAuth();

  return (
    <div className="space-y-6">
        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-tight text-ink">Identity / SSO</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Register a customer's identity provider (SAML or OIDC) in Keycloak, then give them the alias to enter under Administration → Security. Each
            environment has its own Keycloak.
          </p>
        </div>
        {connected.map((conn) => (
          <EnvironmentCard key={conn.env.key} conn={conn} />
        ))}
    </div>
  );
}

function EnvironmentCard({ conn }: { conn: ConnectedEnvironment }) {
  const api = platformApiFor(conn.env);
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<KeycloakIdentityProvider | null>(null);

  const { data: overview, isLoading } = useQuery({ queryKey: ["platform", "keycloak", conn.env.key], queryFn: () => api.get<KeycloakOverview>("/keycloak") });
  const canManage = !!overview?.reachable && overview.adminAccessConfigured;
  const { data: idps, error: idpError } = useQuery({
    queryKey: ["platform", "keycloak", conn.env.key, "idps"],
    queryFn: () => api.get<KeycloakIdentityProviders>("/keycloak/identity-providers"),
    enabled: canManage,
    retry: false,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["platform", "keycloak", conn.env.key] });

  const remove = async (idp: KeycloakIdentityProvider) => {
    try {
      await api.delete(`/keycloak/identity-providers/${encodeURIComponent(idp.alias)}`);
      toast.success(`Removed ${idp.alias}`);
      refresh();
    } catch (err) {
      toast.error("Could not remove it", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-wrap">
        <div className="flex flex-wrap items-center gap-2.5">
          <CardTitle>{conn.env.label}</CardTitle>
          {overview &&
            (overview.reachable ? (
              <Badge tone="good" dot>
                Keycloak reachable
              </Badge>
            ) : (
              <Badge tone="critical" dot>
                Keycloak unreachable
              </Badge>
            ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {overview?.adminConsoleUrl && (
            <a href={overview.adminConsoleUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3.5 w-3.5" /> Keycloak admin console
              </Button>
            </a>
          )}
          <Button size="sm" onClick={() => setAdding(true)} disabled={!canManage}>
            <Plus className="h-3.5 w-3.5" /> Add identity provider
          </Button>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {isLoading || !overview ? (
          <Skeleton className="h-24 w-full" />
        ) : !overview.configured ? (
          <EmptyState icon={<KeyRound className="h-5 w-5" />} title="Keycloak isn't configured here" description="Set the KEYCLOAK_* variables in this environment's backend env file." />
        ) : !overview.adminAccessConfigured ? (
          <EmptyState
            icon={<KeyRound className="h-5 w-5" />}
            title="Platform service account not set up"
            description="Run keycloak/provision-platform-client.sh for this tier so this page can manage identity providers. You can still open the Keycloak admin console above."
          />
        ) : !overview.reachable ? (
          <EmptyState icon={<KeyRound className="h-5 w-5" />} title="Keycloak isn't responding" description="Check that this environment's keycloak process is running (pm2 list)." />
        ) : (
          <>
            {idpError && <p className="text-[13px] text-status-critical">{idpError instanceof ApiError ? idpError.message : "Could not load identity providers"}</p>}
            {idps && idps.brokenTenantConfigs.length > 0 && (
              <div className="rounded-lg border border-status-warning/30 bg-status-warning-soft px-4 py-3 text-[13px] text-status-warning">
                SSO is broken for {idps.brokenTenantConfigs.map((b) => `${b.tenant.slug} (alias "${b.alias}")`).join(", ")} - that alias no longer exists in Keycloak.
                Register an identity provider with the same alias, or ask the tenant to change it.
              </div>
            )}
            {idps && idps.identityProviders.length === 0 && (
              <EmptyState icon={<KeyRound className="h-5 w-5" />} title="No identity providers yet" description="Add one when a customer asks to sign in with their company SSO." />
            )}
            <div className="space-y-3">
              {idps?.identityProviders.map((idp) => (
                <div key={idp.alias} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                        {idp.displayName}
                        <Badge tone="brand">{idp.protocol.toUpperCase()}</Badge>
                        {!idp.enabled && <Badge tone="warning">Disabled</Badge>}
                      </p>
                      <p className="mt-0.5 font-mono text-[12px] text-ink-muted">alias: {idp.alias}</p>
                      <p className="mt-1 text-[12px] text-ink-secondary">
                        {idp.tenants.length > 0 ? `Used by ${idp.tenants.map((t) => `${t.name} (${t.slug})`).join(", ")}` : "Not used by any tenant yet"}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setDeleting(idp)}>
                      <Trash2 className="h-3.5 w-3.5 text-status-critical" /> Remove
                    </Button>
                  </div>
                  {overview.brokerBaseUrl && (
                    <div className="mt-3 border-t border-border pt-3">
                      <HandOverLines brokerBaseUrl={overview.brokerBaseUrl} alias={idp.alias} protocol={idp.protocol} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardBody>

      {adding && (
        <AddIdpDialog
          conn={conn}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title={`Remove ${deleting?.alias}?`}
        description="Anyone signing in through this identity provider will no longer be able to. Refused while a tenant still uses it."
        confirmLabel="Remove"
        tone="danger"
      />
    </Card>
  );
}

function AddIdpDialog({ conn, onClose, onCreated }: { conn: ConnectedEnvironment; onClose: () => void; onCreated: () => void }) {
  const [values, setValues] = useState<NewIdpValues>(emptyIdpValues());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await platformApiFor(conn.env).post("/keycloak/identity-providers", idpRequestBody(values));
      toast.success(`Registered ${values.alias} in ${conn.env.label}`);
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not register the identity provider"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} title={`Add identity provider - ${conn.env.label}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <NewIdpFields values={values} onChange={setValues} />
        {error && <p className="rounded-lg bg-status-critical-soft px-3 py-2 text-[13px] text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Register
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
