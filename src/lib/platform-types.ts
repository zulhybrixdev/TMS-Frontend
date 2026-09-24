import type { PlanDefinition, PlanKey, SubscriptionInvoiceRow, TenantAccountType } from "./types";

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
}

export interface PlatformTenantRow {
  id: string;
  slug: string;
  name: string;
  accountType: TenantAccountType;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  subscription: {
    planKey: PlanKey;
    plan: PlanDefinition;
    status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING_PAYMENT";
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  usage: { users: number; bankAccounts: number };
}

export interface PlatformTenantDetail extends PlatformTenantRow {
  invoices: SubscriptionInvoiceRow[];
}

export interface KeycloakOverview {
  configured: boolean;
  adminAccessConfigured: boolean;
  reachable: boolean;
  realm: string | null;
  adminConsoleUrl: string | null;
  brokerBaseUrl: string | null;
}

export interface KeycloakIdentityProvider {
  alias: string;
  displayName: string;
  protocol: "oidc" | "saml" | string;
  enabled: boolean;
  trustEmail: boolean;
  tenants: { slug: string; name: string }[];
}

export interface KeycloakIdentityProviders {
  identityProviders: KeycloakIdentityProvider[];
  brokenTenantConfigs: { alias: string; tenant: { slug: string; name: string } }[];
}

export interface TenantSsoInfo {
  tenant: { id: string; slug: string; name: string };
  eligibility: { ok: boolean; reason: string | null };
  config: {
    keycloakIdpAlias: string;
    ssoRequired: boolean;
    autoProvisionUsers: boolean;
    allowedEmailDomains: string[] | null;
  } | null;
  keycloak: { reachable: boolean; adminAccessConfigured: boolean; brokerBaseUrl: string | null };
  providers: KeycloakIdentityProvider[];
  suggestedAlias: string;
}

// GET /api/platform/config on one environment.
export interface PlatformConfig {
  pocMode: boolean;
  /** Self-service registration open (true) or closed (false) on that environment. */
  registrationEnabled: boolean;
}
