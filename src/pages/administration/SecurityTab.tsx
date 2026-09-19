import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";
import { api, ApiError, getApiBaseUrl } from "../../lib/api-client";
import { useSubscription } from "../../hooks/useSubscription";
import type { SecurityPolicy, SsoConfig } from "../../lib/types";
import { PlanGate } from "../../components/PlanGate";
import { Button } from "../../components/ui/Button";
import { Input, Label } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/Dialog";

export function SecurityTab() {
  return (
    <div className="space-y-8">
      <MfaPolicySection />
      <PlanGate module="sso" feature="Single Sign-On (SSO)">
        <SsoSection />
      </PlanGate>
    </div>
  );
}

function MfaPolicySection() {
  const qc = useQueryClient();
  const { data: policy, isLoading } = useQuery({ queryKey: ["security-policy"], queryFn: () => api.get<SecurityPolicy>("/security-policy") });
  const [confirmOn, setConfirmOn] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (mfaRequired: boolean) => {
    setSaving(true);
    try {
      await api.put("/security-policy", { mfaRequired });
      toast.success(mfaRequired ? "Two-factor authentication is now required" : "Two-factor authentication is no longer required");
      qc.invalidateQueries({ queryKey: ["security-policy"] });
    } catch (err) {
      toast.error("Could not update the policy", { description: err instanceof ApiError ? err.message : undefined });
    } finally {
      setSaving(false);
      setConfirmOn(false);
    }
  };

  if (isLoading || !policy) return <Skeleton className="h-32 w-full" />;
  const pending = policy.totalUsers - policy.usersWithMfa;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-display text-[15px] font-semibold text-ink">Two-factor authentication</h3>
        {policy.mfaRequired ? <Badge tone="good" dot>Required</Badge> : <Badge tone="neutral">Optional</Badge>}
      </div>
      <p className="text-[13px] text-ink-secondary">
        Require everyone to sign in with a code from an authenticator app as well as their password. Anyone who hasn't set it up is walked through it at
        their next password sign-in, and can't turn it off afterwards. People signed in through SSO are exempt - your identity provider is responsible
        for their MFA. Off by default.
      </p>
      <p className="text-[13px] text-ink-muted">
        {policy.usersWithMfa} of {policy.totalUsers} active user{policy.totalUsers === 1 ? "" : "s"} have set it up.
      </p>
      {policy.mfaRequired ? (
        <Button variant="outline" size="sm" loading={saving} onClick={() => save(false)}>
          Stop requiring two-factor authentication
        </Button>
      ) : (
        <Button size="sm" onClick={() => setConfirmOn(true)}>
          <ShieldCheck className="h-4 w-4" /> Require two-factor authentication
        </Button>
      )}
      <ConfirmDialog
        open={confirmOn}
        onClose={() => setConfirmOn(false)}
        onConfirm={() => save(true)}
        loading={saving}
        title="Require two-factor authentication?"
        description={`${pending} active user${pending === 1 ? " hasn't" : "s haven't"} set it up yet and will be asked to at their next sign-in. People already signed in aren't interrupted.`}
        confirmLabel="Require it"
      />
    </section>
  );
}

function SsoSection() {
  const qc = useQueryClient();
  const { data: subscription } = useSubscription();
  const { data: config, isLoading } = useQuery({
    queryKey: ["sso-config"],
    queryFn: () => api.get<SsoConfig | null>("/sso-config"),
  });
  const [removeOpen, setRemoveOpen] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      keycloakIdpAlias: config?.keycloakIdpAlias ?? "",
      ssoRequired: config?.ssoRequired ?? false,
      autoProvisionUsers: config?.autoProvisionUsers ?? true,
      allowedEmailDomains: (config?.allowedEmailDomains ?? []).join(", "),
    },
    values: config
      ? {
          keycloakIdpAlias: config.keycloakIdpAlias,
          ssoRequired: config.ssoRequired,
          autoProvisionUsers: config.autoProvisionUsers,
          allowedEmailDomains: (config.allowedEmailDomains ?? []).join(", "),
        }
      : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await api.put("/sso-config", {
        ...values,
        allowedEmailDomains: values.allowedEmailDomains
          .split(/[,\s]+/)
          .map((d) => d.trim())
          .filter(Boolean),
      });
      toast.success("SSO configuration saved");
      qc.invalidateQueries({ queryKey: ["sso-config"] });
    } catch (err) {
      toast.error("Could not save SSO configuration", { description: err instanceof ApiError ? err.message : undefined });
    }
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const ssoStartUrl = subscription ? `${window.location.origin}${getApiBaseUrl()}/auth/sso/${subscription.tenant.slug}/start` : "";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-secondary">
            Let your team sign in through your own identity provider (Okta, Azure AD, Google Workspace, or any SAML/OIDC IdP) - brokered through
            Keycloak, so this app never integrates with your IdP's protocol directly.
          </p>
          {config && (
            <p className="mt-2 flex items-center gap-2 text-[13px]">
              <Badge tone="good" dot>
                Configured
              </Badge>
              <span className="text-ink-muted">Sign-in link: </span>
              <code className="rounded bg-plane px-1.5 py-0.5 text-[12px]">{ssoStartUrl}</code>
            </p>
          )}
        </div>
        {config && (
          <Button variant="outline" size="sm" onClick={() => setRemoveOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 text-status-critical" /> Remove
          </Button>
        )}
      </div>

      <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-lg border border-border p-4">
        <div>
          <Label htmlFor="keycloakIdpAlias" required>
            Keycloak Identity Provider alias
          </Label>
          <Input id="keycloakIdpAlias" placeholder="e.g. acme-corp-saml" {...register("keycloakIdpAlias", { required: true })} />
          <p className="mt-1 text-[12px] text-ink-muted">
            The alias of the Identity Provider registered for your organisation in Keycloak's <code>treasury-system</code> realm - your Keycloak
            administrator sets this up when connecting your IdP.
          </p>
        </div>

        <div>
          <Label htmlFor="allowedEmailDomains">Allowed email domains (optional)</Label>
          <Input id="allowedEmailDomains" placeholder="e.g. acme.com, acme.com.my" {...register("allowedEmailDomains")} />
          <p className="mt-1 text-[12px] text-ink-muted">
            Only these email domains can sign in (or be created) through SSO - a safeguard in case your identity provider is misconfigured. Leave blank
            for no restriction. Sign-ins also require your IdP to have verified the email address.
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-[13px]">
          <input type="checkbox" className="mt-0.5" {...register("autoProvisionUsers")} />
          <span>
            <span className="font-medium text-ink">Automatically create accounts</span>
            <span className="block text-ink-muted">
              When someone signs in via SSO for the first time, create their account automatically with Viewer access. If off, they must already have
              an account (created by an admin) before they can sign in via SSO.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2.5 text-[13px]">
          <input type="checkbox" className="mt-0.5" {...register("ssoRequired")} />
          <span>
            <span className="font-medium text-ink">Require SSO for everyone</span>
            <span className="block text-ink-muted">
              Blocks password sign-in for everyone except Admins, who keep it as a fallback. Off by default - turn this on only once SSO is confirmed
              working, so nobody gets locked out.
            </span>
          </span>
        </label>

        <Button type="submit" loading={isSubmitting}>
          <ShieldCheck className="h-4 w-4" /> Save SSO Configuration
        </Button>
      </form>

      <ConfirmDialog
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={async () => {
          try {
            await api.delete("/sso-config");
            toast.success("SSO configuration removed");
            qc.invalidateQueries({ queryKey: ["sso-config"] });
          } catch (err) {
            toast.error("Could not remove SSO configuration", { description: err instanceof ApiError ? err.message : undefined });
          } finally {
            setRemoveOpen(false);
          }
        }}
        title="Remove SSO configuration?"
        confirmLabel="Remove"
        tone="danger"
      />
    </div>
  );
}
