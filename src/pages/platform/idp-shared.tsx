import { Copy } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../lib/platform-api-client";
import { Input, Label, Select } from "../../components/ui/Input";

// Pieces shared by the tenant SSO dialog and the all-providers page.

export function CopyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-28 shrink-0 text-ink-muted">{label}</span>
      <code className="min-w-0 flex-1 truncate rounded bg-plane px-1.5 py-0.5 text-ink-secondary">{value}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied");
        }}
        className="shrink-0 rounded p-1 text-ink-muted hover:bg-plane hover:text-ink"
        aria-label={`Copy ${label}`}
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// What the customer's IdP admin needs to configure on their side.
export function HandOverLines({ brokerBaseUrl, alias, protocol }: { brokerBaseUrl: string; alias: string; protocol: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Give the customer's IdP admin</p>
      <CopyLine label={protocol === "saml" ? "ACS / Reply URL" : "Redirect URI"} value={`${brokerBaseUrl}/${alias}/endpoint`} />
      {protocol === "saml" && (
        <>
          <CopyLine label="SP metadata URL" value={`${brokerBaseUrl}/${alias}/endpoint/descriptor`} />
          <CopyLine label="Entity ID" value={brokerBaseUrl.replace(/\/broker$/, "")} />
        </>
      )}
    </div>
  );
}

export interface NewIdpValues {
  protocol: "oidc" | "saml";
  alias: string;
  displayName: string;
  importUrl: string;
  clientId: string;
  clientSecret: string;
  trustEmail: boolean;
}

export const emptyIdpValues = (over: Partial<NewIdpValues> = {}): NewIdpValues => ({
  protocol: "oidc",
  alias: "",
  displayName: "",
  importUrl: "",
  clientId: "",
  clientSecret: "",
  trustEmail: true,
  ...over,
});

export function idpRequestBody(v: NewIdpValues, tenantId?: string) {
  return {
    alias: v.alias,
    displayName: v.displayName || undefined,
    protocol: v.protocol,
    importUrl: v.importUrl,
    ...(v.protocol === "oidc" ? { clientId: v.clientId, clientSecret: v.clientSecret } : {}),
    trustEmail: v.trustEmail,
    ...(tenantId ? { tenantId } : {}),
  };
}

// Zod field errors come back as details.fieldErrors - show the first real message, not just "Validation failed".
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  const fields = (err.details as { fieldErrors?: Record<string, string[]> } | undefined)?.fieldErrors;
  return (fields ? Object.values(fields).flat()[0] : undefined) ?? err.message ?? fallback;
}

export function NewIdpFields({ values, onChange }: { values: NewIdpValues; onChange: (v: NewIdpValues) => void }) {
  const set = <K extends keyof NewIdpValues>(k: K, val: NewIdpValues[K]) => onChange({ ...values, [k]: val });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="idp-protocol">Protocol</Label>
          <Select id="idp-protocol" value={values.protocol} onChange={(e) => set("protocol", e.target.value as "oidc" | "saml")}>
            <option value="oidc">OIDC (OpenID Connect)</option>
            <option value="saml">SAML 2.0</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="idp-alias" required>
            Alias
          </Label>
          <Input id="idp-alias" required value={values.alias} onChange={(e) => set("alias", e.target.value)} placeholder="acme-corp-saml" />
        </div>
      </div>
      <div>
        <Label htmlFor="idp-name">Display name (optional)</Label>
        <Input id="idp-name" value={values.displayName} onChange={(e) => set("displayName", e.target.value)} placeholder="Acme Corp SSO" />
      </div>
      <div>
        <Label htmlFor="idp-url" required>
          {values.protocol === "saml" ? "SAML metadata URL" : "OIDC discovery URL"}
        </Label>
        <Input
          id="idp-url"
          required
          value={values.importUrl}
          onChange={(e) => set("importUrl", e.target.value)}
          placeholder={values.protocol === "saml" ? "https://idp.example.com/metadata" : "https://idp.example.com/.well-known/openid-configuration"}
        />
        <p className="mt-1 text-[12px] text-ink-muted">Keycloak reads this itself and fills in the endpoints and signing keys - nothing else to paste.</p>
      </div>
      {values.protocol === "oidc" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="idp-client-id" required>
              Client ID
            </Label>
            <Input id="idp-client-id" required value={values.clientId} onChange={(e) => set("clientId", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="idp-client-secret" required>
              Client secret
            </Label>
            <Input id="idp-client-secret" type="password" required value={values.clientSecret} onChange={(e) => set("clientSecret", e.target.value)} autoComplete="off" />
          </div>
        </div>
      )}
      <label className="flex items-start gap-2.5 text-[13px]">
        <input type="checkbox" className="mt-0.5" checked={values.trustEmail} onChange={(e) => set("trustEmail", e.target.checked)} />
        <span>
          <span className="font-medium text-ink">Trust the email this provider sends</span>
          <span className="block text-ink-muted">
            Sign-in requires a verified email. Leave on for a customer's own corporate IdP; turn off only if it can't be relied on to verify addresses (sign-ins will
            then be refused).
          </span>
        </span>
      </label>
    </div>
  );
}
